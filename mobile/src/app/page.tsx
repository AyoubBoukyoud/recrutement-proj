'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';

export default function RootRedirectPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { profile, isHydrated, getIncompleteStep } = useProfile();

  useEffect(() => {
    if (isLoading || !isHydrated) return;

    if (!user) {
      router.replace('/splash');
      return;
    }

    if (user.role === 'candidate') {
      const incompleteStep = getIncompleteStep();
      if (incompleteStep) {
        router.replace(`/profile-creation?step=${incompleteStep}`);
      } else {
        router.replace('/dashboard');
      }
      return;
    }

    if (user.role === 'employer') {
      router.replace('/employer/dashboard');
      return;
    }

    if (user.role === 'admin') {
      router.replace('/admin/utilisateurs');
    }
  }, [user, isLoading, isHydrated, profile.isComplete, router, getIncompleteStep]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface p-6">
      <div className="w-full max-w-xs space-y-4">
        <div className="mx-auto h-14 w-14 animate-pulse rounded-2xl bg-primary" />
        <SkeletonLoader variant="text" count={3} />
      </div>
    </main>
  );
}
