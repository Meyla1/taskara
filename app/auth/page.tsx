
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthPage() {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setMessage('');
    setError('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.push('/');
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;

        if (data.session) {
          router.push('/');
          router.refresh();
        } else {
          setMessage(
            'Pendaftaran berhasil! Silakan periksa email untuk verifikasi akun.'
          );
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Terjadi kesalahan.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResendEmail() {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setMessage(
        'Email verifikasi baru berhasil dikirim. Silakan periksa kotak masuk emailmu.'
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengirim email verifikasi.'
      );
    } finally {
      setLoading(false);
    }
  }

  const styles = {
    page: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: '#F8F7FB',
      fontFamily: 'Arial, sans-serif',
    } as React.CSSProperties,
    card: {
      width: '100%',
      maxWidth: '420px',
      background: '#FFFFFF',
      padding: '36px',
      borderRadius: '18px',
      boxShadow: '0 8px 35px rgba(60, 45, 100, 0.08)',
    } as React.CSSProperties,
    input: {
      width: '100%',
      padding: '13px 14px',
      border: '1px solid #E5E1EF',
      borderRadius: '9px',
      fontSize: '14px',
      outline: 'none',
      boxSizing: 'border-box',
      marginTop: '7px',
    } as React.CSSProperties,
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: 600,
      color: '#49445B',
      marginTop: '17px',
    } as React.CSSProperties,
  };

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1
            style={{
              color: '#8B7FC7',
              fontSize: '32px',
              fontWeight: 800,
              margin: 0,
              letterSpacing: '1px',
            }}
          >
            TASKARA
          </h1>

          <p style={{ color: '#858195', fontSize: '13px' }}>
            Your Academic Life, Under Control.
          </p>
        </div>

        <h2 style={{ color: '#292638', fontSize: '22px' }}>
          {isLogin ? 'Selamat datang kembali!' : 'Buat akun baru'}
        </h2>

        <p style={{ color: '#858195', fontSize: '13px' }}>
          {isLogin
            ? 'Masuk untuk mengelola aktivitas akademikmu.'
            : 'Mulai atur kehidupan akademikmu bersama TASKARA.'}
        </p>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <label style={styles.label}>Nama lengkap</label>
              <input
                style={styles.input}
                type="text"
                placeholder="Nama lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </>
          )}

          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            placeholder="Minimal 6 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />

          {error && (
            <p style={{ color: '#D87582', fontSize: '13px' }}>
              {error}
            </p>
          )}

          {message && (
            <p style={{ color: '#398568', fontSize: '13px' }}>
              {message}
            </p>
          )}

          {message && !isLogin && (
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={loading || !email}
              style={{
                marginTop: '8px',
                padding: '8px 0',
                background: 'none',
                border: 'none',
                color: '#8B7FC7',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '13px',
              }}
            >
              {loading
                ? 'Mengirim...'
                : 'Kirim ulang email verifikasi'}
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              marginTop: '25px',
              background: '#8B7FC7',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '9px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? 'Memproses...'
              : isLogin
                ? 'Masuk'
                : 'Daftar Sekarang'}
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            color: '#858195',
            fontSize: '13px',
            marginTop: '24px',
          }}
        >
          {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage('');
              setError('');
            }}
            style={{
              color: '#8B7FC7',
              background: 'none',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {isLogin ? 'Daftar' : 'Masuk'}
          </button>
        </p>
      </section>
    </main>
  );
}
