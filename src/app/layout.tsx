import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'HomePro — Home Improvement Bidding Marketplace',
  description:
    'Post your home improvement project and get competitive bids from licensed local contractors.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main className="mx-auto min-h-[calc(100vh-8rem)] max-w-6xl px-4 py-8">{children}</main>
          <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} HomePro Marketplace. Built for homeowners &amp; contractors.
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
