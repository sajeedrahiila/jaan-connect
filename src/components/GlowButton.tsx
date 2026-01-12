import { motion, useMotionValue, useSpring } from 'framer-motion';
import React, { useRef } from 'react';
import { cn } from '@/lib/utils';

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const GlowButton = React.forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ children, className, variant = 'default', size = 'md', ...props }, ref) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 30, stiffness: 200 };
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    };

    const handleMouseLeave = () => {
      mouseX.set(-100);
      mouseY.set(-100);
    };

    const baseClasses = cn(
      'relative overflow-hidden rounded-lg font-semibold transition-all duration-300',
      'focus:outline-none focus:ring-2 focus:ring-primary/50',
      {
        'px-3 py-1.5 text-sm': size === 'sm',
        'px-4 py-2 text-base': size === 'md',
        'px-6 py-2.5 text-lg': size === 'lg',
        'px-8 py-3 text-xl': size === 'xl',
        'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/30':
          variant === 'default',
        'border border-primary/30 text-primary hover:border-primary/60 bg-transparent':
          variant === 'outline',
        'text-foreground hover:bg-accent/10': variant === 'ghost',
      },
      className
    );

    return (
      <button
        ref={ref ?? buttonRef}
        className={baseClasses}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <motion.div
          className="absolute inset-0"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Glow effect */}
          <motion.div
            className="pointer-events-none absolute w-40 h-40 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(var(--color-primary), 0.2) 0%, transparent 70%)',
              left: springX,
              top: springY,
              x: -80,
              y: -80,
              filter: 'blur(20px)',
            }}
          />
        </motion.div>

        {/* Content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </button>
    );
  }
);

GlowButton.displayName = 'GlowButton';
