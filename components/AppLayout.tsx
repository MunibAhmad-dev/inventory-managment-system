'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { getCurrentUser } from '@/lib/storage';
import type { UserRole } from '@/lib/types';

interface Props {
  children: React.ReactNode;
  title: string;
  allowedRoles?: UserRole[];
}

export default function AppLayout({ children, title, allowedRoles }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { router.replace('/login'); return; }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace('/dashboard');
      return;
    }
    setReady(true);
  }, [router, allowedRoles]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen overflow-auto">
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
          <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        </header>
        <main className="flex-1 p-6 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
