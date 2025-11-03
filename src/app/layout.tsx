
import type { Metadata } from 'next';
import './globals.css';
import './print.css';
import { AppBody } from '@/components/app-body';

export const metadata: Metadata = {
  title: 'BaseImponible.cl',
  description: 'La plataforma de contabilidad para contadores modernos.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="data:," />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AppBody>{children}</AppBody>
      </body>
    </html>
  );
}
