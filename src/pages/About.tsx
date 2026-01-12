import { motion } from 'framer-motion';
import { CheckCircle, Target, Eye, Shield, Zap, Users, BarChart3, Truck } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const About = () => {
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

  const coreValues = [
    {
      icon: Shield,
      title: 'Integrity in Operations',
      description: 'We conduct business with transparency, honesty, and accountability in all partnerships.'
    },
    {
      icon: Truck,
      title: 'Reliability in Delivery',
      description: 'Consistent, on-time fulfillment is at the heart of our service promise.'
    },
    {
      icon: Users,
      title: 'Partnership-Driven Growth',
      description: 'We succeed when our retail partners succeed. Long-term relationships matter most.'
    },
    {
      icon: Zap,
      title: 'Operational Excellence',
      description: 'Continuous improvement and process discipline ensure quality and efficiency.'
    }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-secondary via-secondary/50 to-background py-16 sm:py-20 lg:py-24">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/3 -right-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/8 via-accent/5 to-transparent blur-3xl"
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            <motion.div variants={itemVariants}>
              <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6">
                <span>About Us</span>
              </div>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6"
            >
              About Jaan Distributers
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mx-auto max-w-2xl text-lg text-muted-foreground"
            >
              A trusted partner in wholesale and retail distribution for over two decades
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Company Overview */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">Company Overview</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Jaan Distributers is a wholesale and retail distribution organization dedicated to supporting retail businesses through reliable supply and structured operations.
                </p>
                <p>
                  Our approach is centered on long-term collaboration, operational consistency, and service accountability. We work closely with our retail partners to ensure timely delivery, dependable stock flow, and alignment with business objectives.
                </p>
                <p>
                  By combining experience, process-driven operations, and a commitment to quality, Jaan Distributers positions itself as a trusted distribution partner for modern retail.
                </p>
              </div>

              <div className="mt-8 pt-8 border-t border-border">
                <p className="text-sm text-muted-foreground mb-4">Serving retail businesses across the region</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-primary">500+</p>
                    <p className="text-sm text-muted-foreground">Active Partners</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">10K+</p>
                    <p className="text-sm text-muted-foreground">Products</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">20+</p>
                    <p className="text-sm text-muted-foreground">Years Experience</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 p-8 sm:p-12 border border-border">
                <div className="absolute inset-0 -z-10">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"
                  />
                </div>
                <div className="space-y-6">
                  <div className="flex gap-3">
                    <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground">Established Excellence</h3>
                      <p className="text-sm text-muted-foreground">Two decades of proven wholesale distribution expertise</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground">Retail-Focused</h3>
                      <p className="text-sm text-muted-foreground">Built to support supermarkets and retail chains</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground">Reliable Operations</h3>
                      <p className="text-sm text-muted-foreground">99.2% order fulfillment rate and consistent delivery</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground">Quality Standards</h3>
                      <p className="text-sm text-muted-foreground">Rigorous sourcing and food safety compliance</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 sm:py-20 lg:py-24 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-12"
          >
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Our Mission</h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                To deliver reliable and scalable distribution solutions that enable retail partners to operate with confidence and achieve their business objectives.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-6">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-accent/10">
                <Eye className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Our Vision</h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                To be recognized as the most trusted distribution partner within the retail and food service supply ecosystem, known for operational excellence and partnership commitment.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2 variants={itemVariants} className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Core Values
            </motion.h2>
            <motion.p variants={itemVariants} className="text-muted-foreground text-lg max-w-2xl mx-auto">
              The principles that guide our operations and partnerships
            </motion.p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {coreValues.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="relative group p-6 rounded-xl border border-border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="mb-4">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center space-y-8"
          >
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Ready to Partner With Us?
              </h2>
              <p className="text-lg text-muted-foreground">
                Discover how Jaan Distributers can support your retail operations with reliable supply and strategic partnership.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/contact">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Contact Our Team
                </Button>
              </Link>
              <Link to="/products">
                <Button size="lg" variant="outline">
                  View Our Catalog
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
