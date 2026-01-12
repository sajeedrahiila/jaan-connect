import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useRef } from 'react';

export const AnimatedCursor = () => {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const cursorScale = useMotionValue(1);
  const cursorOpacity = useMotionValue(0);

  const springConfig = { damping: 12, stiffness: 400, mass: 0.2 };
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

        // Keep trail limited to 30 points
        if (trailRef.current.length > 30) {
          trailRef.current.shift();
        }
      }
    };

    const handleMouseDown = () => {
      cursorScale.set(0.6);
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
      {/* Main cursor - CARROT EMOJI */}
      <motion.div
        className="pointer-events-none fixed z-[9999] select-none"
        style={{
          left: springX,
          top: springY,
          x: -20,
          y: -20,
          opacity: cursorOpacity,
          scale: springScale,
        }}
      >
        {/* Large carrot emoji with glow - pointing DOWN */}
        <motion.div
          className="text-2xl filter drop-shadow-lg"
          style={{ rotate: '90deg' }}
          animate={{
            scale: [1, 1.15, 1],
            filter: [
              'drop-shadow(0 0 10px rgba(255, 100, 0, 0.6))',
              'drop-shadow(0 0 20px rgba(255, 100, 0, 0.9))',
              'drop-shadow(0 0 10px rgba(255, 100, 0, 0.6))',
            ],
          }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          🥕
        </motion.div>
      </motion.div>

      {/* Trail particles - orange/carrot colored */}
      {trailRef.current.map((point, index) => {
        const progress = index / trailRef.current.length;
        const opacity = progress * 0.8;
        const size = 8 + progress * 12;

        return (
          <motion.div
            key={index}
            className="pointer-events-none fixed rounded-full bg-orange-400 shadow-lg"
            style={{
              left: point.x,
              top: point.y,
              width: size,
              height: size,
              opacity,
              x: -size / 2,
              y: -size / 2,
              boxShadow: `0 0 ${size}px rgba(255, 140, 0, 0.8)`,
            }}
            animate={{
              opacity: 0,
              scale: 2,
              y: [0, 10],
            }}
            transition={{
              duration: 0.7 + index * 0.04,
              ease: 'easeOut',
            }}
          />
        );
      })}

      {/* Hide default cursor */}
      <style>{`
        * {
          cursor: none !important;
        }
        a, button {
          cursor: none !important;
        }
      `}</style>
    </>
  );
};
