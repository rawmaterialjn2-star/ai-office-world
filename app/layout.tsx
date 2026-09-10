import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'AI Office World — Mayora Jayanti 2', description: 'Local interactive office game world' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
