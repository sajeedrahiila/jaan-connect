# Enhanced Hero Animations Guide

## Overview
The hero section has been completely revamped with sophisticated animations and interactions that create an engaging, modern user experience.

## Animation Enhancements

### 1. **Background Animations**
- **Rotating Orbs**: Multiple gradient orbs with different rotation speeds and scales
  - Large primary orb: 80s rotation with 12s scale pulse
  - Secondary pulsing orb: 3s breathing effect
  - Counter-rotating accent orb: 100s rotation with 15s scale
- **Moving Gradient Line**: Vertical line with opacity and position animation (20s cycle)

### 2. **Hero Text Animations**
- **Badge**: Spring-based scale and position animation with hover scaling
- **Heading**: Staggered line-by-line reveal with spring physics
  - Primary text: 0.4s delay
  - Gradient text: 0.5s delay with clipped gradient background
- **Description**: Fade and slide animation (0.6s delay)
- **Animated Underline**: On CTA buttons with continuous pulse animation

### 3. **Interactive CTA Buttons**
- **Shop Now Button**:
  - Hover scale (1.05x)
  - Shadow expansion on hover (primary/30 → primary/50)
  - Animated arrow with continuous pulse animation
  - Spring-based tap feedback

- **Contact Sales Button**:
  - Sparkles icon with breathing opacity animation
  - Horizontal slide animation on hover
  - Smooth scale transitions

### 4. **Category Cards Grid**
- **Parallax Effect**: Responds to mouse movement via spring-based Y offset
- **Individual Card Animations**:
  - Floating animation: Y-axis oscillation (6s cycle)
  - Scale bounce on hover (1.1x)
  - Rotating background gradient
  - Shimmer effect on hover (left to right)
  - Emoji scale-up and rotate on hover
  - Staggered entrance with spring physics

### 5. **Trust Badges**
- **Staggered Spring Animation**: Each badge appears with 0.08s delay
- **Hover Effects**: Scale up (1.08x) with slight Y offset
- **Gradient Background**: Subtle gradient from muted to muted/50

### 6. **Mouse Tracking**
- Real-time mouse movement tracking within hero section
- Spring-smoothed X/Y coordinates for natural parallax effect
- Applied to category grid container for interactive depth

## Technical Implementation

### New Imports
```typescript
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { Sparkles } from 'lucide-react';
```

### Custom Variants
```typescript
// Floating animation for category cards
floatingVariants: {
  initial: { y: 0 },
  animate: { y: [-20, 20, -20], ... }
}

// Pulse effect for background orbs
pulseVariants: {
  initial: { scale: 1, opacity: 0.5 },
  animate: { scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5], ... }
}

// Text reveal for headings
textReveal: {
  hidden: { opacity: 0 },
  visible: (i: number) => ({ opacity: 1, ... })
}
```

### Performance Features
- Optimized with GPU-accelerated transforms (translate, scale, rotate)
- Spring physics for natural motion (stiffness: 200-400)
- Smooth easing functions (easeInOut for continuous loops)
- Scroll-based opacity and scale animations
- Mouse event listener properly cleaned up

## Timing & Delays

| Element | Delay | Duration | Type |
|---------|-------|----------|------|
| Badge | 0.2s | 0.6s | Spring |
| Heading Line 1 | 0.4s | 0.7s | Spring |
| Heading Line 2 | 0.5s | - | Spring |
| Description | 0.6s | 0.6s | Ease |
| CTA Buttons | 0.7s | 0.6s | Ease |
| Trust Badges | 0.9s | 0.6s | Ease |
| Categories Grid | 0.4s | 0.8s | Spring |
| Category Cards | 0.5s+ | 0.5s | Spring + Floating |

## Browser Support
- Modern browsers with GPU acceleration (Chrome, Firefox, Safari, Edge)
- Fallback CSS transitions for hover states
- Hardware acceleration via `transform` and `opacity` properties

## Performance Notes
- All animations use `transform` and `opacity` for best performance
- Background animations loop infinitely without affecting scroll performance
- Mouse tracking uses `useSpring` for smooth, performant motion
- Scroll animations use Framer Motion's `useScroll` for efficient viewport tracking

## Customization

To adjust animation speeds, modify:
- Rotation durations in background orbs (80s, 100s, 30s)
- Scale pulse durations (8s, 12s, 15s)
- Floating animation duration (6s)
- Stagger delays (0.08s between cards)
- Spring stiffness values (affects bounciness)

## Future Enhancement Ideas
- Mouse cursor glow effect
- Animated SVG background
- Scroll-triggered entrance animations for other sections
- Gradient text animation between colors
- 3D perspective transforms on category cards
