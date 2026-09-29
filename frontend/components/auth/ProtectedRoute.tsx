'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { UserType } from '@/lib/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: UserType | UserType[];
  fallbackRoute?: string;
}

/**
 * Client-side route protection component.
 * Redirects unauthenticated users to login or users without proper permissions.
 */
export function ProtectedRoute({
  children,
  requiredUserType,
  fallbackRoute = '/login',
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    // Check if user is authenticated
    if (!user) {
      router.replace(fallbackRoute);
      return;
    }

    // Check if user has required type
    if (requiredUserType) {
      const allowedTypes = Array.isArray(requiredUserType)
        ? requiredUserType
        : [requiredUserType];
      if (!allowedTypes.includes(user.userType)) {
        router.replace(fallbackRoute);
        return;
      }
    }

    setIsAuthorized(true);
  }, [loading, user, requiredUserType, router, fallbackRoute]);

  if (loading || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      </div>
    );
  }

  return <>{children}</>;
}
