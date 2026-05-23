'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { AuthUser } from '@/lib/auth-session';

const refreshMessages = [
  'Ти си най-добрия.',
  'Не остана до края на работния ден.',
  'Идват почивни дни, стягай се.',
  'Днес задачите се предават по график.',
  'Още малко и кафето печели.',
  'Фокусът ти стои добре.',
  'Давай смело, машината работи.',
  'Планът изглежда под контрол.',
  'Работният ден няма шанс.',
  'Малките стъпки правят големия финал.',
  'Таймерът те уважава.',
  'Още една задача и си легенда.',
  'Почивката идва, но първо победата.',
  'Днес си в режим продуктивност.',
  'Всичко важно е на един клик.',
  'Краят на деня се вижда.',
  'Добра работа, продължавай.',
  'Списъкът с задачи ще олекне.',
  'Имаш ритъм.',
  'Екипът разчита на теб.',
  'Днес нещата се подреждат.',
  'Още малко и отчетът ще пее.',
  'Ти караш проекта напред.',
  'Спокойно, задачите падат една по една.',
  'Пет минути фокус правят чудеса.',
];

export function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message] = useState(() => refreshMessages[Math.floor(Math.random() * refreshMessages.length)]);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/auth/me');
        const data = (await response.json()) as { user: AuthUser | null };
        setUser(data.user);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, []);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  if (isLoading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-end">
        <p className="text-sm font-semibold text-white">{user.email}</p>
        <p className="max-w-64 truncate text-xs text-cyan-100/80">{message}</p>
      </div>
      <button
        onClick={handleLogout}
        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-rose-500/10 hover:text-rose-100 hover:border-rose-400/20"
      >
        Logout
      </button>
    </div>
  );
}
