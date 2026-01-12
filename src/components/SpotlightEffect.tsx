import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect } from 'react';

export const SpotlightEffect = () => {
  const spotX = useMotionValue(0);
  const spotY = useMotionValue(0);

  const springConfig = { damping: 50, stiffness: 100, mass: 0.3 };
  const springX = useSpring(spotX, springConfig);
  const springY = useSpring(spotY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      spotX.set(e.clientX);
      spotY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [spotX, spotY]);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[1]"
      style={{
        background: `radial-gradient(
          800px at ${springX}px ${springY}px,
          rgba(var(--color-primary), 0.08),
          transparent 80%
        )`,
      }}
    />
  );
};
