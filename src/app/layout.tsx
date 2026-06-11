import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Alsace Arena Spike Tournament',
  description: 'Valorant season scoreboard and admin app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 text-gray-900 font-sans">{children}</body>
    </html>
  );
}
