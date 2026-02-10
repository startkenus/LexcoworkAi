"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { commandRegistry, findCommand, searchCommands, Command } from '@/lib/commands/registry';
import { supabase } from '@/lib/supabase/client';

export function useCommand() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Command[]>(commandRegistry);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    setResults(searchCommands(query));
  }, [query]);

  const executeCommand = useCallback(async (commandId: string, params?: any) => {
    const command = commandRegistry.find(cmd => cmd.id === commandId);
    if (!command) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      await supabase
        .from('command_history')
        .insert({
          user_id: user.id,
          tenant_id: profile.tenant_id,
          command: commandId,
          parameters: params || {},
          status: 'pending',
          executed_at: new Date().toISOString(),
        });
    }

    switch (commandId) {
      case 'review':
        router.push('/dashboard?action=review');
        break;
      case 'risk':
        router.push('/dashboard?action=risk');
        break;
      case 'vendor':
        router.push('/vendors');
        break;
      case 'brief':
        router.push('/briefings/new');
        break;
      case 'triage':
        router.push('/dashboard?action=triage');
        break;
      case 'comply':
        router.push('/dashboard?action=comply');
        break;
      case 'template':
        router.push('/templates');
        break;
      default:
        if (command.action) {
          await command.action(params);
        }
    }

    setIsOpen(false);
    setQuery('');
  }, [router]);

  return {
    isOpen,
    setIsOpen,
    query,
    setQuery,
    results,
    executeCommand,
  };
}
