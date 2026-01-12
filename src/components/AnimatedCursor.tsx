import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';

export const AnimatedCursor = () => {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const cursorScale = useMotionValue(1);
  const cursorOpacity = useMotionValue(0);

  const springConfig = { damping: 30, stiffness: 200, mass: 0.5 };
  const springX = useSpring(cursorX, springConfig);
  const springY = useSpring(cursorY, springConfig);
  const springScale = useSpring(cursorScale, springConfig);

  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      const isMoving = now - lastTimeRef.current < 100;

      // Main cursor
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      cursorOpacity.set(1);
      lastTimeRef.current = now;

      // Add to trail
      if (isMoving) {
        trailRef.current.push({
          x: e.clientX,
          y: e.clientY,
        });

        // Keep trail limited to 20 points
        if (trailRef.current.length > 20) {
          trailRef.current.shift();
        }
      }
    };

    const handleMouseDown = () => {
      cursorScale.set(0.7);
    };

    const handleMouseUp = () => {
      cursorScale.set(1);
    };

    const handleMouseLeave = () => {
      cursorOpacity.set(0);
      trailRef.current = [];
    };

    const handleMouseEnter = () => {
      cursorOpacity.set(1);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [cursorX, cursorY, cursorScale, cursorOpacity]);

  return (
    <>
      {/* Main cursor blob */}
      <motion.div
        className="pointer-events-none fixed z-[9999] mix-blend-screen"
        style={{
          left: springX,
          top: springY,
          x: -12,
          y: -12,
          opacity: cursorOpacity,
        }}
      >
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-0 w-6 h-6 rounded-full border-2 border-primary/40"
          animate={{
            boxShadow: [
              '0 0 10px rgba(var(--color-primary), 0.3), inset 0 0 10px rgba(var(--color-primary), 0.1)',
              '0 0 20px rgba(var(--color-primary), 0.5), inset 0 0 10px rgba(var(--color-primary), 0.2)',
              '0 0 10px rgba(var(--color-primary), 0.3), inset 0 0 10px rgba(var(--color-primary), 0.1)',
            ],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />

        {/* Inner dot */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-primary rounded-full"
          style={{ transform: 'translate(-50%, -50%)' }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>

      {/* Trail particles */}
      {trailRef.current.map((point, index) => {
        const opacity = (index / trailRef.current.length) * 0.3;
        const size = 4 + (index / trailRef.current.length) * 4;

        return (
          <motion.div
            key={index}
            className="pointer-events-none fixed w-1 h-1 rounded-full bg-primary/30 mix-blend-screen"
            style={{
              left: point.x,
              top: point.y,
              width: size,
              height: size,
              opacity,
              x: -size / 2,
              y: -size / 2,
            }}
            animate={{
              opacity: 0,
              scale: 2,
            }}
            transition={{
              duration: 0.8 + index * 0.05,
              ease: 'easeOut',
            }}
          />
        );
      })}

      {/* Hide default cursor */}
      <style>{`
        * {
          cursor: none;
        }
        a, button {
          cursor: none;
        }
      `}</style>
    </>
  );
};
