export interface Command {
  id: string;
  name: string;
  description: string;
  shortcut?: string;
  category: 'workflow' | 'quick-action' | 'navigation';
  action: (params?: any) => void | Promise<void>;
}

export const commandRegistry: Command[] = [
  {
    id: 'review',
    name: 'Contract Review',
    description: 'Start contract review workflow',
    shortcut: '/review',
    category: 'workflow',
    action: () => {},
  },
  {
    id: 'risk',
    name: 'Risk Assessment',
    description: 'Assess legal risk on document',
    shortcut: '/risk',
    category: 'workflow',
    action: () => {},
  },
  {
    id: 'vendor',
    name: 'Vendor Check',
    description: 'Check existing vendor agreements',
    shortcut: '/vendor',
    category: 'quick-action',
    action: () => {},
  },
  {
    id: 'brief',
    name: 'Meeting Briefing',
    description: 'Prep briefing for meeting',
    shortcut: '/brief',
    category: 'workflow',
    action: () => {},
  },
  {
    id: 'triage',
    name: 'Quick Triage',
    description: 'Intake and categorize request',
    shortcut: '/triage',
    category: 'quick-action',
    action: () => {},
  },
  {
    id: 'comply',
    name: 'Compliance Check',
    description: 'Run compliance verification',
    shortcut: '/comply',
    category: 'workflow',
    action: () => {},
  },
  {
    id: 'template',
    name: 'Use Template',
    description: 'Generate response from template',
    shortcut: '/template',
    category: 'quick-action',
    action: () => {},
  },
];

export function findCommand(query: string): Command | undefined {
  const normalized = query.toLowerCase().trim();
  return commandRegistry.find(
    cmd =>
      cmd.shortcut?.toLowerCase() === normalized ||
      cmd.name.toLowerCase().includes(normalized) ||
      cmd.id === normalized
  );
}

export function searchCommands(query: string): Command[] {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return commandRegistry;

  return commandRegistry.filter(
    cmd =>
      cmd.name.toLowerCase().includes(normalized) ||
      cmd.description.toLowerCase().includes(normalized) ||
      cmd.shortcut?.toLowerCase().includes(normalized)
  );
}
