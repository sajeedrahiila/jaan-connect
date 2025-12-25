import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Truck, Shield, Clock, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';

const features = [
  { icon: Truck, title: 'Fast Delivery', description: 'Same-day delivery on orders before 2 PM' },
  { icon: Shield, title: 'Quality Guaranteed', description: 'Fresh products or your money back' },
  { icon: Clock, title: '24/7 Ordering', description: 'Place orders anytime, anywhere' },
  { icon: Leaf, title: 'Sustainably Sourced', description: 'Partnering with local farms' },
];

const categories = [
  { name: 'Fresh Produce', slug: 'fresh-produce', color: 'bg-green-100' },
  { name: 'Dairy & Eggs', slug: 'dairy-eggs', color: 'bg-yellow-100' },
  { name: 'Meat & Seafood', slug: 'meat-seafood', color: 'bg-red-100' },
  { name: 'Pantry Staples', slug: 'pantry-staples', color: 'bg-orange-100' },
];

const Index = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-secondary to-background py-16 lg:py-24">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent-foreground text-sm font-medium mb-6">
                Wholesale Grocery Distribution
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Quality Groceries,
                <span className="text-primary"> Delivered Fresh</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8">
                Your trusted wholesale partner for premium grocery products. Competitive prices, reliable delivery, and exceptional service for businesses of all sizes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button variant="hero" size="xl" asChild>
                  <Link to="/products">
                    Shop Now <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="hero-outline" size="xl" asChild>
                  <Link to="/contact">Contact Sales</Link>
                </Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-square max-w-lg mx-auto rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 p-8 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-4 w-full">
                  {categories.map((cat, i) => (
                    <motion.div
                      key={cat.slug}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className={`${cat.color} rounded-2xl p-6 text-center hover-lift cursor-pointer`}
                    >
                      <Link to={`/products?category=${cat.slug}`}>
                        <span className="text-sm font-semibold text-foreground">{cat.name}</span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 border-b border-border">
        <div className="container-wide">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary mb-4">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24">
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-primary rounded-3xl p-8 lg:p-12 text-center text-primary-foreground"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready to Partner With Us?</h2>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              Join hundreds of businesses that trust Jaan Distributors for their grocery supply needs.
            </p>
            <Button variant="accent" size="xl" asChild>
              <Link to="/register">Create Business Account</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
