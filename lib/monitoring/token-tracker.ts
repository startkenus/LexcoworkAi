/**
 * Token Usage Monitoring and Limit Enforcement
 * Based on Cursor AI Implementation Guide Phase 9
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface TokenUsageRecord {
  organization_id: string;
  user_id: string;
  task_id: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost: number;
  worker: string;
  timestamp: Date;
}

export interface UsageLimit {
  daily_user_limit: number;
  monthly_org_limit: number;
  current_daily_usage: number;
  current_monthly_usage: number;
  remaining_daily: number;
  remaining_monthly: number;
}

export interface UsageAlert {
  level: 'warning' | 'critical';
  message: string;
  percentage: number;
  limit_type: 'daily' | 'monthly';
}

/**
 * Record token usage for monitoring and billing
 */
export async function recordTokenUsage(
  record: TokenUsageRecord
): Promise<void> {
  try {
    // Insert token usage log
    await supabase.from('token_usage_logs').insert({
      organization_id: record.organization_id,
      user_id: record.user_id,
      task_id: record.task_id,
      input_tokens: record.input_tokens,
      output_tokens: record.output_tokens,
      total_tokens: record.total_tokens,
      cost: record.cost,
      worker: record.worker,
      created_at: record.timestamp.toISOString(),
    });

    // Update organization's current usage
    const { data: org } = await supabase
      .from('organizations')
      .select('current_token_usage')
      .eq('id', record.organization_id)
      .single();

    if (org) {
      await supabase
        .from('organizations')
        .update({
          current_token_usage: (org.current_token_usage || 0) + record.total_tokens,
        })
        .eq('id', record.organization_id);
    }

    // Check for alerts
    await checkUsageAlerts(record.organization_id, record.user_id);
  } catch (error) {
    console.error('Error recording token usage:', error);
  }
}

/**
 * Check if user/org is within usage limits
 */
export async function checkUsageLimits(
  organizationId: string,
  userId: string,
  estimatedTokens: number
): Promise<{
  allowed: boolean;
  reason?: string;
  limits: UsageLimit;
}> {
  try {
    // Get organization limits and current usage
    const { data: org } = await supabase
      .from('organizations')
      .select('token_limit, current_token_usage')
      .eq('id', organizationId)
      .single();

    if (!org) {
      return {
        allowed: false,
        reason: 'Organization not found',
        limits: createEmptyLimits(),
      };
    }

    // Calculate monthly usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyLogs } = await supabase
      .from('token_usage_logs')
      .select('total_tokens')
      .eq('organization_id', organizationId)
      .gte('created_at', startOfMonth.toISOString());

    const monthlyUsage = monthlyLogs?.reduce((sum, log) => sum + log.total_tokens, 0) || 0;

    // Calculate daily usage (for user)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data: dailyLogs } = await supabase
      .from('token_usage_logs')
      .select('total_tokens')
      .eq('user_id', userId)
      .gte('created_at', startOfDay.toISOString());

    const dailyUsage = dailyLogs?.reduce((sum, log) => sum + log.total_tokens, 0) || 0;

    // Define limits
    const monthlyLimit = org.token_limit || 1_000_000; // Default 1M tokens per month
    const dailyUserLimit = 50_000; // 50K tokens per user per day

    const limits: UsageLimit = {
      daily_user_limit: dailyUserLimit,
      monthly_org_limit: monthlyLimit,
      current_daily_usage: dailyUsage,
      current_monthly_usage: monthlyUsage,
      remaining_daily: Math.max(0, dailyUserLimit - dailyUsage),
      remaining_monthly: Math.max(0, monthlyLimit - monthlyUsage),
    };

    // Check if adding estimated tokens would exceed limits
    if (dailyUsage + estimatedTokens > dailyUserLimit) {
      return {
        allowed: false,
        reason: `Daily user token limit exceeded. Limit: ${dailyUserLimit.toLocaleString()}, Current: ${dailyUsage.toLocaleString()}`,
        limits,
      };
    }

    if (monthlyUsage + estimatedTokens > monthlyLimit) {
      return {
        allowed: false,
        reason: `Monthly organization token limit exceeded. Limit: ${monthlyLimit.toLocaleString()}, Current: ${monthlyUsage.toLocaleString()}`,
        limits,
      };
    }

    return {
      allowed: true,
      limits,
    };
  } catch (error) {
    console.error('Error checking usage limits:', error);
    return {
      allowed: false,
      reason: 'Error checking usage limits',
      limits: createEmptyLimits(),
    };
  }
}

/**
 * Get usage statistics for an organization
 */
export async function getUsageStats(
  organizationId: string,
  timeRange: 'day' | 'week' | 'month' = 'month'
): Promise<{
  total_tokens: number;
  total_cost: number;
  total_tasks: number;
  by_worker: Record<string, { tokens: number; cost: number; count: number }>;
  by_day: Array<{ date: string; tokens: number; cost: number }>;
}> {
  try {
    // Calculate start date based on time range
    const startDate = new Date();
    switch (timeRange) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    const { data: logs } = await supabase
      .from('token_usage_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (!logs || logs.length === 0) {
      return {
        total_tokens: 0,
        total_cost: 0,
        total_tasks: 0,
        by_worker: {},
        by_day: [],
      };
    }

    // Aggregate stats
    const totalTokens = logs.reduce((sum, log) => sum + log.total_tokens, 0);
    const totalCost = logs.reduce((sum, log) => sum + log.cost, 0);
    const uniqueTasks = new Set(logs.map((log) => log.task_id)).size;

    // Group by worker
    const byWorker: Record<string, { tokens: number; cost: number; count: number }> = {};
    logs.forEach((log) => {
      const worker = log.worker || 'unknown';
      if (!byWorker[worker]) {
        byWorker[worker] = { tokens: 0, cost: 0, count: 0 };
      }
      byWorker[worker].tokens += log.total_tokens;
      byWorker[worker].cost += log.cost;
      byWorker[worker].count += 1;
    });

    // Group by day
    const byDay: Record<string, { tokens: number; cost: number }> = {};
    logs.forEach((log) => {
      const date = new Date(log.created_at).toISOString().split('T')[0];
      if (!byDay[date]) {
        byDay[date] = { tokens: 0, cost: 0 };
      }
      byDay[date].tokens += log.total_tokens;
      byDay[date].cost += log.cost;
    });

    const byDayArray = Object.entries(byDay).map(([date, stats]) => ({
      date,
      ...stats,
    }));

    return {
      total_tokens: totalTokens,
      total_cost: totalCost,
      total_tasks: uniqueTasks,
      by_worker: byWorker,
      by_day: byDayArray,
    };
  } catch (error) {
    console.error('Error getting usage stats:', error);
    return {
      total_tokens: 0,
      total_cost: 0,
      total_tasks: 0,
      by_worker: {},
      by_day: [],
    };
  }
}

/**
 * Check for usage alerts and send notifications if needed
 */
async function checkUsageAlerts(
  organizationId: string,
  userId: string
): Promise<UsageAlert[]> {
  const alerts: UsageAlert[] = [];

  try {
    const limitsCheck = await checkUsageLimits(organizationId, userId, 0);
    const { limits } = limitsCheck;

    // Check monthly limit
    const monthlyPercentage =
      (limits.current_monthly_usage / limits.monthly_org_limit) * 100;

    if (monthlyPercentage >= 95) {
      alerts.push({
        level: 'critical',
        message: `Organization has used ${monthlyPercentage.toFixed(0)}% of monthly token limit`,
        percentage: monthlyPercentage,
        limit_type: 'monthly',
      });
    } else if (monthlyPercentage >= 80) {
      alerts.push({
        level: 'warning',
        message: `Organization has used ${monthlyPercentage.toFixed(0)}% of monthly token limit`,
        percentage: monthlyPercentage,
        limit_type: 'monthly',
      });
    }

    // Check daily limit
    const dailyPercentage =
      (limits.current_daily_usage / limits.daily_user_limit) * 100;

    if (dailyPercentage >= 90) {
      alerts.push({
        level: 'critical',
        message: `User has used ${dailyPercentage.toFixed(0)}% of daily token limit`,
        percentage: dailyPercentage,
        limit_type: 'daily',
      });
    } else if (dailyPercentage >= 75) {
      alerts.push({
        level: 'warning',
        message: `User has used ${dailyPercentage.toFixed(0)}% of daily token limit`,
        percentage: dailyPercentage,
        limit_type: 'daily',
      });
    }

    // TODO: Send email/slack notifications for critical alerts
    if (alerts.length > 0) {
      console.warn('Usage alerts:', alerts);
    }
  } catch (error) {
    console.error('Error checking usage alerts:', error);
  }

  return alerts;
}

/**
 * Predict monthly usage based on current trend
 */
export async function predictMonthlyUsage(
  organizationId: string
): Promise<{
  predicted_tokens: number;
  predicted_cost: number;
  days_remaining: number;
  current_daily_average: number;
}> {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const stats = await getUsageStats(organizationId, 'month');

    const daysInMonth = new Date(
      startOfMonth.getFullYear(),
      startOfMonth.getMonth() + 1,
      0
    ).getDate();

    const daysPassed = Math.ceil(
      (Date.now() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24)
    );

    const daysRemaining = daysInMonth - daysPassed;

    const dailyAverage = daysPassed > 0 ? stats.total_tokens / daysPassed : 0;

    const predictedTokens = stats.total_tokens + dailyAverage * daysRemaining;
    const predictedCost = stats.total_cost + (stats.total_cost / stats.total_tokens) * dailyAverage * daysRemaining;

    return {
      predicted_tokens: Math.round(predictedTokens),
      predicted_cost: Number(predictedCost.toFixed(2)),
      days_remaining: daysRemaining,
      current_daily_average: Math.round(dailyAverage),
    };
  } catch (error) {
    console.error('Error predicting monthly usage:', error);
    return {
      predicted_tokens: 0,
      predicted_cost: 0,
      days_remaining: 0,
      current_daily_average: 0,
    };
  }
}

function createEmptyLimits(): UsageLimit {
  return {
    daily_user_limit: 0,
    monthly_org_limit: 0,
    current_daily_usage: 0,
    current_monthly_usage: 0,
    remaining_daily: 0,
    remaining_monthly: 0,
  };
}
