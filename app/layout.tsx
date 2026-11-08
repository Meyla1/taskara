
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://taskara-two.vercel.app'),

  title: {
    default: 'TASKARA — Your Academic Life, Under Control',
    template: '%s | TASKARA',
  },

  description:
    'TASKARA membantu mahasiswa mengatur jadwal kuliah, tugas, mata kuliah, dan progres akademik dalam satu tempat.',

  applicationName: 'TASKARA',

  keywords: [
    'TASKARA',
    'academic planner',
    'student planner',
    'jadwal kuliah',
    'manajemen tugas',
    'produktivitas mahasiswa',
  ],

  openGraph: {
    title: 'TASKARA — Your Academic Life, Under Control',
    description:
      'A calmer way to organize classes, assignments, and deadlines.',
    url: 'https://taskara-two.vercel.app',
    siteName: 'TASKARA',
    locale: 'id_ID',
    type: 'website',
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
