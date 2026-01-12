import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { ArrowRight, Truck, Shield, Clock, Leaf, Star, Users, Package, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { ScrollReveal } from '@/components/ScrollReveal';
import { useRef, useEffect } from 'react';

const features = [
  { icon: Truck, title: 'Fast Delivery', description: 'Same-day delivery on orders before 2 PM' },
  { icon: Shield, title: 'Quality Guaranteed', description: 'Fresh products or your money back' },
  { icon: Clock, title: '24/7 Ordering', description: 'Place orders anytime, anywhere' },
  { icon: Leaf, title: 'Sustainably Sourced', description: 'Partnering with local farms' },
];

const categories = [
  { name: 'Fresh Produce', slug: 'fresh-produce', emoji: '🥬', gradient: 'from-green-400/20 to-emerald-500/20' },
  { name: 'Dairy & Eggs', slug: 'dairy-eggs', emoji: '🥛', gradient: 'from-amber-300/20 to-yellow-400/20' },
  { name: 'Meat & Seafood', slug: 'meat-seafood', emoji: '🥩', gradient: 'from-red-400/20 to-rose-500/20' },
  { name: 'Pantry Staples', slug: 'pantry-staples', emoji: '🫘', gradient: 'from-orange-400/20 to-amber-500/20' },
  { name: 'Beverages', slug: 'beverages', emoji: '🧃', gradient: 'from-blue-400/20 to-cyan-500/20' },
  { name: 'Frozen Foods', slug: 'frozen-foods', emoji: '🧊', gradient: 'from-sky-400/20 to-blue-500/20' },
];

const stats = [
  { value: '500+', label: 'Business Partners', icon: Users },
  { value: '10K+', label: 'Products', icon: Package },
  { value: '99%', label: 'Satisfaction Rate', icon: Star },
  { value: '24/7', label: 'Support Available', icon: Clock },
];

const testimonials = [
  { name: 'Sarah Chen', role: 'Restaurant Owner', text: 'Jaan Distributors transformed our supply chain. Fresh products, always on time.', rating: 5 },
  { name: 'Michael Roberts', role: 'Grocery Store Manager', text: 'The best wholesale partner we\'ve ever worked with. Exceptional quality and service.', rating: 5 },
  { name: 'Priya Sharma', role: 'Café Owner', text: 'Their produce is always fresh and prices are unbeatable. Highly recommend!', rating: 5 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

// Text reveal animation
const textReveal = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { delay: i * 0.05, duration: 0.5 }
  })
};

// Floating animation
const floatingVariants = {
  initial: { y: 0 },
  animate: {
    y: [-20, 20, -20],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Pulse animation
const pulseVariants = {
  initial: { scale: 1, opacity: 0.5 },
  animate: {
    scale: [1, 1.1, 1],
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const Index = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  // Mouse tracking for interactive elements
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 300, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 300, damping: 30 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = heroRef.current?.getBoundingClientRect();
      if (rect) {
        mouseX.set(e.clientX - rect.left - rect.width / 2);
        mouseY.set(e.clientY - rect.top - rect.height / 2);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <Layout>
      {/* Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden bg-gradient-to-b from-secondary via-secondary/50 to-background py-20 lg:py-32">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large rotating orb */}
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.15, 1]
            }}
            transition={{ 
              rotate: { duration: 80, repeat: Infinity, ease: "linear" },
              scale: { duration: 12, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -top-1/3 -right-1/4 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-primary/8 via-accent/5 to-transparent blur-3xl"
          />
          
          {/* Pulsing orb */}
          <motion.div
            variants={pulseVariants}
            initial="initial"
            animate="animate"
            className="absolute top-1/3 right-1/3 w-[300px] h-[300px] rounded-full bg-gradient-to-br from-primary/15 to-transparent blur-2xl"
          />
          
          {/* Counter-rotating orb */}
          <motion.div
            animate={{ 
              rotate: -360,
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              rotate: { duration: 100, repeat: Infinity, ease: "linear" },
              scale: { duration: 15, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -bottom-1/2 -left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-accent/10 via-primary/5 to-transparent blur-3xl"
          />
          
          {/* Moving gradient line */}
          <motion.div
            animate={{ 
              opacity: [0.2, 0.5, 0.2],
              y: [-100, 100, -100]
            }}
            transition={{ 
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-0 left-1/2 w-1 h-96 bg-gradient-to-b from-primary via-accent to-transparent blur-lg"
          />
        </div>

        <motion.div 
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
          className="container-wide relative z-10"
        >
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center lg:text-left"
            >
              {/* Badge with enhanced animation */}
              <motion.span 
                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 100 }}
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 text-primary text-sm font-medium mb-6 backdrop-blur-sm hover:border-primary/40 transition-colors"
              >
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="relative flex h-2 w-2"
                >
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </motion.span>
                <span>Wholesale Grocery Distribution</span>
              </motion.span>
              
              {/* Animated heading with text reveal */}
              <motion.div className="overflow-hidden">
                <motion.h1 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.7, type: "spring" }}
                  className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] mb-6"
                >
                  <motion.span 
                    className="block"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    Quality Groceries,
                  </motion.span>
                  <motion.span 
                    className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary mt-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    Delivered Fresh
                  </motion.span>
                </motion.h1>
              </motion.div>
              
              {/* Enhanced paragraph with fade */}
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed"
              >
                Your trusted wholesale partner for premium grocery products. Competitive prices, reliable delivery, and exceptional service for businesses of all sizes.
              </motion.p>
              
              {/* CTA Buttons with enhanced interactions */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button variant="hero" size="xl" asChild className="group shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow">
                    <Link to="/products">
                      <motion.span
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        Shop Now
                      </motion.span>
                      <motion.span
                        className="ml-2"
                        initial={{ x: 0 }}
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <ArrowRight className="h-5 w-5" />
                      </motion.span>
                    </Link>
                  </Button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button variant="hero-outline" size="xl" asChild className="group hover:shadow-lg transition-shadow">
                    <Link to="/contact">
                      <motion.span
                        className="flex items-center gap-2"
                        initial={{ x: 0 }}
                        whileHover={{ x: 3 }}
                      >
                        Contact Sales
                        <motion.span
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Sparkles className="h-4 w-4" />
                        </motion.span>
                      </motion.span>
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>

              {/* Trust badges with staggered appearance */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="mt-10 pt-8 border-t border-border/50"
              >
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-sm text-muted-foreground mb-4"
                >
                  Trusted by 500+ businesses
                </motion.p>
                <div className="flex items-center justify-center lg:justify-start gap-6 flex-wrap">
                  {[1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.6, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 1.1 + i * 0.08, type: "spring", stiffness: 200 }}
                      whileHover={{ scale: 1.08, y: -3 }}
                      className="h-8 w-16 rounded bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-xs text-muted-foreground font-medium hover:border-primary/20 border border-transparent transition-colors"
                    >
                      Partner {i}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Enhanced Categories Grid with parallax */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, type: "spring", stiffness: 100 }}
              className="relative"
              style={{ y: springY }}
            >
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [0.8, 1, 0.8]
                }}
                transition={{ 
                  rotate: { duration: 30, repeat: Infinity, ease: "linear" },
                  scale: { duration: 8, repeat: Infinity, ease: "easeInOut" }
                }}
                className="absolute -inset-8 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-transparent blur-2xl"
              />
              
              <div className="relative grid grid-cols-2 sm:grid-cols-3 gap-4 z-10">
                {categories.map((cat, i) => (
                  <motion.div
                    key={cat.slug}
                    initial={{ opacity: 0, y: 30, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.08, duration: 0.5, type: "spring" }}
                    whileHover={{ scale: 1.1, y: -8 }}
                    whileTap={{ scale: 0.95 }}
                    variants={floatingVariants}
                    initial="initial"
                    animate="animate"
                    className="group"
                  >
                    <Link 
                      to={`/products?category=${cat.slug}`}
                      className={`block rounded-2xl bg-gradient-to-br ${cat.gradient} backdrop-blur-md border border-border/50 p-5 text-center hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 relative overflow-hidden`}
                    >
                      {/* Shimmer effect on hover */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        initial={{ x: '-100%' }}
                        whileHover={{ x: '100%' }}
                        transition={{ duration: 0.6 }}
                      />
                      
                      <motion.span 
                        className="text-4xl mb-2 block group-hover:scale-125 transition-transform"
                        whileHover={{ rotate: [0, -15, 15, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        {cat.emoji}
                      </motion.span>
                      <span className="text-sm font-semibold text-foreground relative z-10">{cat.name}</span>
                      <motion.div
                        initial={{ opacity: 0, x: -5 }}
                        whileHover={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="h-4 w-4 mx-auto mt-2 text-primary"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NCAwLTE4IDguMDYtMTggMThzOC4wNiAxOCAxOCAxOCAxOC04LjA2IDE4LTE4LTguMDYtMTgtMTgtMTh6bTAgMzJjLTcuNzMyIDAtMTQtNi4yNjgtMTQtMTRzNi4yNjgtMTQgMTQtMTQgMTQgNi4yNjggMTQgMTQtNi4yNjggMTQtMTQgMTR6IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii4wNSIvPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="container-wide relative z-10"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                  className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-foreground/10 mb-4"
                >
                  <stat.icon className="h-7 w-7" />
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="text-3xl lg:text-4xl font-bold mb-1"
                >
                  {stat.value}
                </motion.div>
                <p className="text-primary-foreground/70 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28 bg-background relative">
        {/* Animated gradient background */}
        <motion.div
          animate={{
            background: [
              'radial-gradient(800px at 0% 0%, rgba(var(--color-primary), 0.05) 0%, transparent 50%)',
              'radial-gradient(800px at 100% 100%, rgba(var(--color-accent), 0.05) 0%, transparent 50%)',
              'radial-gradient(800px at 0% 0%, rgba(var(--color-primary), 0.05) 0%, transparent 50%)',
            ]
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute inset-0 pointer-events-none"
        />

        <div className="container-wide relative z-10">
          <ScrollReveal direction="down" className="text-center mb-14">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Why Choose Us</span>
            <h2 className="text-3xl lg:text-4xl font-bold mt-2">Built for Business Success</h2>
          </ScrollReveal>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feature, i) => (
              <ScrollReveal 
                key={feature.title}
                direction="up"
                delay={i * 0.1}
              >
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  whileHover={{ y: -8 }}
                  className="group relative bg-card rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 overflow-hidden"
                >
                  {/* Hover glow effect */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: 'radial-gradient(circle at center, rgba(var(--color-primary), 0.1) 0%, transparent 70%)',
                    }}
                  />

                  {/* Animated gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300" />
                  
                  <div className="relative">
                    <motion.div 
                      whileHover={{ 
                        rotate: [0, -10, 10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 0.5 }}
                      className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4 group-hover:from-primary/30 group-hover:to-primary/10 transition-colors shadow-lg shadow-primary/10 group-hover:shadow-primary/20"
                    >
                      <feature.icon className="h-7 w-7 text-primary" />
                    </motion.div>
                    <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </div>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-28 bg-secondary/30 relative overflow-hidden">
        {/* Animated gradient background */}
        <motion.div
          animate={{
            background: [
              'radial-gradient(800px at 100% 0%, rgba(var(--color-accent), 0.05) 0%, transparent 50%)',
              'radial-gradient(800px at 0% 100%, rgba(var(--color-primary), 0.05) 0%, transparent 50%)',
              'radial-gradient(800px at 100% 0%, rgba(var(--color-accent), 0.05) 0%, transparent 50%)',
            ]
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute inset-0 pointer-events-none"
        />

        <div className="container-wide relative z-10">
          <ScrollReveal direction="down" className="text-center mb-14">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Testimonials</span>
            <h2 className="text-3xl lg:text-4xl font-bold mt-2">What Our Partners Say</h2>
          </ScrollReveal>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <ScrollReveal 
                key={testimonial.name}
                direction="up"
                delay={i * 0.1}
              >
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  whileHover={{ y: -5 }}
                  className="group bg-card rounded-2xl border border-border p-6 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 relative overflow-hidden"
                >
                  {/* Hover glow effect */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: 'radial-gradient(circle at center, rgba(var(--color-primary), 0.08) 0%, transparent 70%)',
                    }}
                  />

                  <div className="relative">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, j) => (
                        <motion.div
                          key={j}
                          initial={{ opacity: 0, scale: 0 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + j * 0.05 }}
                        >
                          <motion.div
                            whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                            transition={{ duration: 0.3 }}
                          >
                            <Star className="h-5 w-5 fill-accent text-accent" />
                          </motion.div>
                        </motion.div>
                      ))}
                    </div>
                    <p className="text-foreground mb-4 leading-relaxed">"{testimonial.text}"</p>
                    <div className="flex items-center gap-3">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary font-semibold shadow-lg shadow-primary/10"
                      >
                        {testimonial.name.charAt(0)}
                      </motion.div>
                      <div>
                        <p className="font-semibold text-sm">{testimonial.name}</p>
                        <p className="text-muted-foreground text-xs">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="container-wide relative z-10">
          <ScrollReveal scale={0.95}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative bg-gradient-to-br from-primary via-primary to-primary/90 rounded-3xl p-8 lg:p-16 text-center text-primary-foreground overflow-hidden group"
            >
              {/* Animated gradient overlay */}
              <motion.div
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
              />

              {/* Background decoration */}
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  animate={{ 
                    x: [0, 100, 0],
                    y: [0, -50, 0],
                  }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"
                />
                <motion.div
                  animate={{ 
                    x: [0, -100, 0],
                    y: [0, 50, 0],
                  }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
                />
              </div>
              
              <div className="relative z-10">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-3xl lg:text-5xl font-bold mb-4"
                >
                  Ready to Partner With Us?
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="text-primary-foreground/80 max-w-2xl mx-auto mb-8 text-lg"
                >
                  Join hundreds of businesses that trust Jaan Distributors for their grocery supply needs.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                  <motion.div
                    whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(255, 255, 255, 0.2)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      variant="accent" 
                      size="xl" 
                      asChild 
                      className="group shadow-lg shadow-accent/30 hover:shadow-accent/50 transition-all"
                    >
                      <Link to="/register">
                        <motion.span
                          animate={{ x: [0, 3, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          Create Business Account
                        </motion.span>
                        <motion.span
                          className="ml-2"
                          whileHover={{ x: 5 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          <ArrowRight className="h-5 w-5" />
                        </motion.span>
                      </Link>
                    </Button>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      variant="ghost" 
                      size="xl" 
                      asChild 
                      className="text-primary-foreground hover:bg-primary-foreground/10 group"
                    >
                      <Link to="/about">
                        <motion.span
                          initial={{ x: 0 }}
                          whileHover={{ x: 3 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          Learn More
                        </motion.span>
                        <motion.span
                          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          animate={{ rotate: [0, 10, 0] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          →
                        </motion.span>
                      </Link>
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
