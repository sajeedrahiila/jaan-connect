import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Search, Menu, X, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSupabaseAuth } from '@/hooks/useAuth-local';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Product Catalog' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Partner With Us' },
];

export function Header() {
  const location = useLocation();
  const { user, isAdmin } = useSupabaseAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="w-full">
      <motion.div 
        className="container-wide py-3 lg:py-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex h-16 items-center justify-between lg:h-20">
          {/* Premium Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div 
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 transition-all group-hover:scale-110"
              whileHover={{ rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Leaf className="h-6 w-6" />
            </motion.div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-foreground">Jaan</span>
              <span className="text-xl font-bold text-primary"> Distributors</span>
            </div>
          </Link>

          {/* Premium Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link, idx) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link
                  to={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary relative py-2",
                    location.pathname === link.href
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                  {location.pathname === link.href && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent rounded-full"
                    />
                  )}
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Right Actions - Premium */}
          <div className="flex items-center gap-2">
            {/* Search Toggle */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="hidden sm:flex hover:bg-secondary/50 rounded-lg"
                aria-label="Toggle search"
              >
                <Search className="h-5 w-5" />
              </Button>
            </motion.div>

            {/* Account */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="hover:bg-secondary/50 rounded-lg"
                aria-label="Account"
              >
                <Link to={user ? (isAdmin ? "/admin" : "/account") : "/auth"}>
                  <User className="h-5 w-5" />
                </Link>
              </Button>
            </motion.div>

            {/* Request Demo Button - CTA for B2B */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} className="hidden lg:block">
              <Button
                variant="hero"
                size="sm"
                asChild
                className="rounded-lg"
              >
                <Link to="/contact">
                  Request Demo
                </Link>
              </Button>
            </motion.div>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Search Bar - Expandable */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border/40"
            >
              <div className="py-4">
                <form className="relative" action="/products">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    name="search"
                    placeholder="Search for products..."
                    className="w-full pl-10 pr-4"
                    autoFocus
                  />
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border/40 bg-background overflow-hidden"
          >
            <nav className="container-wide py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "block py-3 px-4 rounded-lg text-base font-medium transition-colors",
                    location.pathname === link.href
                      ? "bg-secondary text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-border">
                <form action="/products">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      name="search"
                      placeholder="Search our catalog..."
                      className="w-full pl-10"
                    />
                  </div>
                </form>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
