
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
      try {
        const url = new URL(window.location.href);
        const params = url.searchParams;

        // Format PKCE: ?code=...
        const code = params.get('code');

        if (code) {
          const { error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) throw error;
        } else {
          // Format token: #access_token=...&refresh_token=...
          const hashParams = new URLSearchParams(
            url.hash.substring(1)
          );

          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) throw error;
          } else {
            throw new Error('Kode atau token verifikasi tidak ditemukan.');
          }
        }

        // Bersihkan parameter sensitif dari URL.
        window.history.replaceState({}, document.title, '/auth/callback');

        router.replace('/');
        router.refresh();
      } catch (error) {
        console.error('Auth callback error:', error);

        setMessage(
          'Verifikasi gagal atau tautan sudah kedaluwarsa. Silakan minta email verifikasi baru.'
        );
      }
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
