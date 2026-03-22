import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hit Poker',
  description: 'Texas Hold\'em with HIT Rules — Online Poker',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
