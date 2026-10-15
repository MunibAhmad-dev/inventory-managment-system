'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, seedInitialData } from '@/lib/storage';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    seedInitialData();
    const user = getCurrentUser();
    if (user) router.replace('/dashboard');
    else router.replace('/login');
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-800">
      <div className="text-white text-xl">Loading SK Traders DMS...</div>
    </div>
  );
}
