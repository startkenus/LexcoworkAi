import { useState } from 'react';
import { callClaude, callClaudeWithHistory } from '@/lib/ai/claude-client';

interface UseClaudeAPIReturn {
  callAPI: (userMessage: string, systemPrompt?: string) => Promise<void>;
  callAPIWithHistory: (
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    systemPrompt?: string
  ) => Promise<void>;
  loading: boolean;
  result: string | null;
  error: string | null;
  reset: () => void;
}

export function useClaudeAPI(): UseClaudeAPIReturn {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const callAPI = async (userMessage: string, systemPrompt?: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Calling Claude API with message:', userMessage);

      const response = await callClaude(userMessage, systemPrompt);

      console.log('Claude API Response:', response);
      setResult(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error calling Claude API:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const callAPIWithHistory = async (
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    systemPrompt?: string
  ) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Calling Claude API with conversation history:', messages);

      const response = await callClaudeWithHistory(messages, systemPrompt);

      console.log('Claude API Response:', response);
      setResult(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error calling Claude API:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setLoading(false);
    setResult(null);
    setError(null);
  };

  return {
    callAPI,
    callAPIWithHistory,
    loading,
    result,
    error,
    reset,
  };
}
