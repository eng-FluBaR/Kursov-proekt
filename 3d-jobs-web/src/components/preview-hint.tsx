'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import type { AuthUser } from '@/lib/auth-session';

export function usePreviewMode() {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch('/api/auth/me');
        const data = (await response.json()) as { user: AuthUser | null };
        setIsPreviewMode(!data.user);
      } catch {
        setIsPreviewMode(true);
      } finally {
        setIsLoading(false);
      }
    }

    void Promise.resolve().then(loadUser);
  }, []);

  return { isPreviewMode, isLoading };
}

export function PreviewHint({
  title,
  children,
  compact = false,
  className = '',
}: {
  title?: string;
  children: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  const { isPreviewMode, isLoading } = usePreviewMode();

  if (isLoading || !isPreviewMode) {
    return null;
  }

  return (
    <div className={`rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-50 ${compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'} ${className}`}>
      {title ? <p className="mb-1 font-semibold text-cyan-100">{title}</p> : null}
      <div className="leading-5 text-cyan-50/90">{children}</div>
    </div>
  );
}
