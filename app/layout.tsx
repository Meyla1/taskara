import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TASKARA — Your Academic Life, Under Control',
  description: 'A calmer way to organize classes, assignments, and deadlines.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
