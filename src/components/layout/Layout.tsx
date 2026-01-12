import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { AnimatedCursor } from '@/components/AnimatedCursor';
import { SpotlightEffect } from '@/components/SpotlightEffect';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background overflow-x-hidden">
      <SpotlightEffect />
      <AnimatedCursor />
      <Header />
      <main className="flex-1 relative z-10">{children}</main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
