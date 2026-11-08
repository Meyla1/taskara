
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const started = useRef(false);
  const [message, setMessage] = useState(
    'Sedang memverifikasi email dan menyiapkan akun...'
  );

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function completeVerification() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (!code) {
        setMessage('Kode verifikasi tidak ditemukan. Silakan login kembali.');
        return;
      }

      const { error } =
        await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        setMessage(
          'Verifikasi gagal atau tautan sudah kedaluwarsa. Silakan minta email verifikasi baru.'
        );
        return;
      }

      router.replace('/');
      router.refresh();
    }

    completeVerification();
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-3">TASKARA</h1>
        <p>{message}</p>
      </div>
    </main>
  );
}
