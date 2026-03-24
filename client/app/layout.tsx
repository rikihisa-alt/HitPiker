import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hit Poker',
  description: 'Online Texas Hold\'em with HIT rules',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
