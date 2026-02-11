'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { useAuth } from '@/lib/auth/auth-context';
import Image from 'next/image';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're not loading and user is authenticated
    if (!loading && user) {
      // Small delay to ensure auth state is fully settled
      const timeoutId = setTimeout(() => {
        router.push('/dashboard');
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render login form if user is authenticated (prevents flash)
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 p-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <Image
            src="/lexcoworkailogo-removebg-preview.png"
            alt="LexCoworkAI Logo"
            width={240}
            height={80}
            className="h-16 w-auto"
          />
        </div>
        <p className="text-muted-foreground">
          Legal productivity platform powered by agentic intelligence
        </p>
      </div>
      <LoginForm />
      <div className="mt-6 text-center text-xs text-muted-foreground max-w-md">
        <p>
          New here? Click "Sign up" to create an account. The first user becomes a super admin.
        </p>
      </div>
    </div>
  );
}
