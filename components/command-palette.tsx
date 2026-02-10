"use client";

import { useCommand } from '@/hooks/use-command';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  FileText,
  AlertTriangle,
  Building2,
  FileCheck,
  Inbox,
  Shield,
  FileCode
} from 'lucide-react';

const iconMap: Record<string, any> = {
  review: FileText,
  risk: AlertTriangle,
  vendor: Building2,
  brief: FileCheck,
  triage: Inbox,
  comply: Shield,
  template: FileCode,
};

export function CommandPalette() {
  const { isOpen, setIsOpen, query, setQuery, results, executeCommand } = useCommand();

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      <CommandInput
        placeholder="Type a command or search..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Workflows">
          {results
            .filter(cmd => cmd.category === 'workflow')
            .map(cmd => {
              const Icon = iconMap[cmd.id] || FileText;
              return (
                <CommandItem
                  key={cmd.id}
                  onSelect={() => executeCommand(cmd.id)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <div className="flex-1">
                    <div className="font-medium">{cmd.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {cmd.description}
                    </div>
                  </div>
                  {cmd.shortcut && (
                    <div className="text-xs text-muted-foreground">
                      {cmd.shortcut}
                    </div>
                  )}
                </CommandItem>
              );
            })}
        </CommandGroup>

        <CommandGroup heading="Quick Actions">
          {results
            .filter(cmd => cmd.category === 'quick-action')
            .map(cmd => {
              const Icon = iconMap[cmd.id] || FileText;
              return (
                <CommandItem
                  key={cmd.id}
                  onSelect={() => executeCommand(cmd.id)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <div className="flex-1">
                    <div className="font-medium">{cmd.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {cmd.description}
                    </div>
                  </div>
                  {cmd.shortcut && (
                    <div className="text-xs text-muted-foreground">
                      {cmd.shortcut}
                    </div>
                  )}
                </CommandItem>
              );
            })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
