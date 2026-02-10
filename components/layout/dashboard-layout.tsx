'use client';

import { ReactNode, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Settings,
  LogOut,
  Shield,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  taskList?: ReactNode;
  rightSidebar?: ReactNode;
  showRightSidebar?: boolean;
}

export function DashboardLayout({
  children,
  taskList,
  rightSidebar,
  showRightSidebar = false,
}: DashboardLayoutProps) {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(!showRightSidebar);
  const { user, profile, signOut, isAdmin } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', error);
      router.push('/login');
      router.refresh();
    }
  };

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || user?.email?.[0].toUpperCase() || '?';

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <div
        className={cn(
          'border-r bg-muted/30 transition-all duration-300',
          leftCollapsed ? 'w-16' : 'w-60'
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          {!leftCollapsed && (
            <div className="flex items-center">
              <Image
                src="/lexcoworkailogo-removebg-preview.png"
                alt="LexCoworkAI Logo"
                width={150}
                height={50}
                className="h-10 w-auto"
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLeftCollapsed(!leftCollapsed)}
            className="h-8 w-8"
          >
            {leftCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
        {!leftCollapsed && (
          <>
            <Separator />
            <ScrollArea className="flex-1 h-[calc(100vh-180px)]">
              {taskList || (
                <div className="p-4 text-sm text-muted-foreground">
                  No active tasks
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b px-6 bg-card">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">Workspace</h1>
          </div>

          <div className="flex items-center gap-4">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin')}
              >
                <Shield className="mr-2 h-4 w-4" />
                Admin Console
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.full_name || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    {isAdmin && (
                      <p className="text-xs leading-none text-blue-600 font-medium">
                        Super Admin
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-auto pl-4 pr-6 py-6">
            {children}
          </main>

          {!rightCollapsed && (
            <aside className="w-80 border-l bg-card overflow-auto">
              <div className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-card px-4">
                <h2 className="font-semibold">Details</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRightCollapsed(true)}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4">
                {rightSidebar || (
                  <div className="text-sm text-muted-foreground">
                    Select a task to view details
                  </div>
                )}
              </div>
            </aside>
          )}

          {rightCollapsed && showRightSidebar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRightCollapsed(false)}
              className="absolute right-4 top-20 h-8 w-8 rounded-full border bg-card shadow-md"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
