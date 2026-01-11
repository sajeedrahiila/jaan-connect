import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  CreditCard,
  Package,
  CheckCircle,
  Loader2,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Layout } from '@/components/layout/Layout';
import { useCart } from '@/contexts/CartContext';
import { useSupabaseAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Address } from '@/lib/types';

// Validation schema
const addressSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(100),
  street: z.string().trim().min(5, 'Street address is required').max(200),
  street2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2, 'City is required').max(100),
  state: z.string().trim().min(2, 'State is required').max(100),
  zip: z.string().trim().min(3, 'ZIP code is required').max(20),
  country: z.string().trim().min(2, 'Country is required'),
  phone: z.string().trim().min(10, 'Valid phone number is required').max(20),
});

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming',
];

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit/Debit Card', icon: CreditCard },
  { id: 'invoice', label: 'Invoice (Net 30)', icon: Package },
];

type CheckoutStep = 'shipping' | 'payment' | 'review';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<CheckoutStep>('shipping');
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sameAsBilling, setSameAsBilling] = useState(true);

  const [shippingAddress, setShippingAddress] = useState<Address>({
    name: '',
    street: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    phone: '',
  });

  const [billingAddress, setBillingAddress] = useState<Address>({
    name: '',
    street: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    phone: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [orderNotes, setOrderNotes] = useState('');

  // Calculate totals
  const subtotal = cart.total;
  const tax = subtotal * 0.08;
  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + tax + shipping;

  const validateAddress = (address: Address): boolean => {
    try {
      addressSchema.parse(address);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleShippingChange = (field: keyof Address, value: string) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleBillingChange = (field: keyof Address, value: string) => {
    setBillingAddress(prev => ({ ...prev, [field]: value }));
  };

  const handleContinueToPayment = () => {
    if (validateAddress(shippingAddress)) {
      setStep('payment');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleContinueToReview = () => {
    if (!sameAsBilling && !validateAddress(billingAddress)) {
      return;
    }
    setStep('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast({
        title: 'Please sign in',
        description: 'You need to be signed in to place an order.',
        variant: 'destructive',
      });
      navigate('/auth?redirect=/checkout');
      return;
    }

    setLoading(true);

    try {
      // Simulate order creation - in production this would call your API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const generatedOrderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
      setOrderNumber(generatedOrderNumber);
      setOrderPlaced(true);
      clearCart();

      toast({
        title: 'Order placed successfully!',
        description: `Your order ${generatedOrderNumber} has been confirmed.`,
      });
    } catch (error) {
      toast({
        title: 'Error placing order',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Redirect if cart is empty
  if (cart.items.length === 0 && !orderPlaced) {
    return (
      <Layout>
        <section className="py-20 lg:py-32">
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-md mx-auto"
            >
              <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-secondary mb-6">
                <ShoppingBag className="h-12 w-12 text-muted-foreground" />
              </div>
              <h1 className="text-2xl font-bold mb-3">Your cart is empty</h1>
              <p className="text-muted-foreground mb-8">
                Add some products to your cart before checking out.
              </p>
              <Button variant="hero" size="lg" asChild>
                <Link to="/products">
                  Browse Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </Layout>
    );
  }

  // Order confirmation screen
  if (orderPlaced) {
    return (
      <Layout>
        <section className="py-20 lg:py-32">
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-lg mx-auto"
            >
              <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-green-100 mb-6">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold mb-3">Order Confirmed!</h1>
              <p className="text-muted-foreground mb-4">
                Thank you for your order. We've sent a confirmation email with your order details.
              </p>
              <div className="bg-secondary/50 rounded-xl p-6 mb-8">
                <p className="text-sm text-muted-foreground mb-1">Order Number</p>
                <p className="text-2xl font-bold font-mono text-primary">{orderNumber}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" size="lg" asChild>
                  <Link to="/account/orders">
                    View Orders
                  </Link>
                </Button>
                <Button variant="hero" size="lg" asChild>
                  <Link to="/products">
                    Continue Shopping
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </Layout>
    );
  }

  const steps = [
    { id: 'shipping', label: 'Shipping', icon: MapPin },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'review', label: 'Review', icon: Package },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  return (
    <Layout>
      {/* Header */}
      <section className="bg-gradient-to-b from-secondary to-background py-8 lg:py-12">
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link
              to="/cart"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Link>
            <h1 className="text-3xl lg:text-4xl font-bold">Checkout</h1>

            {/* Progress Steps */}
            <div className="mt-8 flex items-center justify-center max-w-md mx-auto">
              {steps.map((s, index) => (
                <div key={s.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                        index <= currentStepIndex
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-muted-foreground'
                      }`}
                    >
                      <s.icon className="h-5 w-5" />
                    </div>
                    <span className="mt-2 text-xs font-medium">{s.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-16 sm:w-24 h-0.5 mx-2 transition-colors ${
                        index < currentStepIndex ? 'bg-primary' : 'bg-border'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Checkout Content */}
      <section className="py-8 lg:py-12">
        <div className="container-wide">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card rounded-2xl border border-border p-6 lg:p-8"
              >
                {/* Shipping Step */}
                {step === 'shipping' && (
                  <>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Shipping Address
                    </h2>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2 space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={shippingAddress.name}
                          onChange={(e) => handleShippingChange('name', e.target.value)}
                          placeholder="John Smith"
                          className={errors.name ? 'border-destructive' : ''}
                        />
                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                      </div>

                      <div className="sm:col-span-2 space-y-2">
                        <Label htmlFor="street">Street Address *</Label>
                        <Input
                          id="street"
                          value={shippingAddress.street}
                          onChange={(e) => handleShippingChange('street', e.target.value)}
                          placeholder="123 Main Street"
                          className={errors.street ? 'border-destructive' : ''}
                        />
                        {errors.street && <p className="text-sm text-destructive">{errors.street}</p>}
                      </div>

                      <div className="sm:col-span-2 space-y-2">
                        <Label htmlFor="street2">Apartment, Suite, etc. (optional)</Label>
                        <Input
                          id="street2"
                          value={shippingAddress.street2}
                          onChange={(e) => handleShippingChange('street2', e.target.value)}
                          placeholder="Apt 4B"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={shippingAddress.city}
                          onChange={(e) => handleShippingChange('city', e.target.value)}
                          placeholder="New York"
                          className={errors.city ? 'border-destructive' : ''}
                        />
                        {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state">State *</Label>
                        <Select
                          value={shippingAddress.state}
                          onValueChange={(value) => handleShippingChange('state', value)}
                        >
                          <SelectTrigger className={errors.state ? 'border-destructive' : ''}>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent>
                            {US_STATES.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="zip">ZIP Code *</Label>
                        <Input
                          id="zip"
                          value={shippingAddress.zip}
                          onChange={(e) => handleShippingChange('zip', e.target.value)}
                          placeholder="10001"
                          className={errors.zip ? 'border-destructive' : ''}
                        />
                        {errors.zip && <p className="text-sm text-destructive">{errors.zip}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={shippingAddress.phone}
                          onChange={(e) => handleShippingChange('phone', e.target.value)}
                          placeholder="(555) 123-4567"
                          className={errors.phone ? 'border-destructive' : ''}
                        />
                        {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <Button variant="hero" size="lg" onClick={handleContinueToPayment}>
                        Continue to Payment
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  </>
                )}

                {/* Payment Step */}
                {step === 'payment' && (
                  <>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Payment Method
                    </h2>

                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                      {PAYMENT_METHODS.map((method) => (
                        <div
                          key={method.id}
                          className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            paymentMethod === method.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setPaymentMethod(method.id)}
                        >
                          <RadioGroupItem value={method.id} id={method.id} />
                          <method.icon className="h-5 w-5 text-muted-foreground" />
                          <Label htmlFor={method.id} className="flex-1 cursor-pointer font-medium">
                            {method.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>

                    {paymentMethod === 'card' && (
                      <div className="mt-6 p-4 bg-secondary/50 rounded-xl">
                        <p className="text-sm text-muted-foreground">
                          Card details will be collected securely on the next step.
                        </p>
                      </div>
                    )}

                    <Separator className="my-8" />

                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="sameAsBilling"
                        checked={sameAsBilling}
                        onCheckedChange={(checked) => setSameAsBilling(checked as boolean)}
                      />
                      <Label htmlFor="sameAsBilling" className="cursor-pointer">
                        Billing address same as shipping
                      </Label>
                    </div>

                    {!sameAsBilling && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-6 space-y-4"
                      >
                        <h3 className="font-semibold">Billing Address</h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="sm:col-span-2 space-y-2">
                            <Label>Full Name *</Label>
                            <Input
                              value={billingAddress.name}
                              onChange={(e) => handleBillingChange('name', e.target.value)}
                              placeholder="John Smith"
                            />
                          </div>
                          <div className="sm:col-span-2 space-y-2">
                            <Label>Street Address *</Label>
                            <Input
                              value={billingAddress.street}
                              onChange={(e) => handleBillingChange('street', e.target.value)}
                              placeholder="123 Main Street"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>City *</Label>
                            <Input
                              value={billingAddress.city}
                              onChange={(e) => handleBillingChange('city', e.target.value)}
                              placeholder="New York"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>State *</Label>
                            <Select
                              value={billingAddress.state}
                              onValueChange={(value) => handleBillingChange('state', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                              <SelectContent>
                                {US_STATES.map((state) => (
                                  <SelectItem key={state} value={state}>
                                    {state}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>ZIP Code *</Label>
                            <Input
                              value={billingAddress.zip}
                              onChange={(e) => handleBillingChange('zip', e.target.value)}
                              placeholder="10001"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Phone *</Label>
                            <Input
                              type="tel"
                              value={billingAddress.phone}
                              onChange={(e) => handleBillingChange('phone', e.target.value)}
                              placeholder="(555) 123-4567"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div className="mt-8 flex justify-between">
                      <Button variant="outline" size="lg" onClick={() => setStep('shipping')}>
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Back
                      </Button>
                      <Button variant="hero" size="lg" onClick={handleContinueToReview}>
                        Review Order
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  </>
                )}

                {/* Review Step */}
                {step === 'review' && (
                  <>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Review Your Order
                    </h2>

                    {/* Order Items */}
                    <div className="space-y-4 mb-6">
                      {cart.items.map((item) => (
                        <div key={item.product_id} className="flex gap-4 p-4 bg-secondary/30 rounded-xl">
                          <div className="h-16 w-16 rounded-lg bg-secondary overflow-hidden shrink-0">
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium line-clamp-1">{item.product.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Qty: {item.quantity} × ${item.product.price.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right font-bold">
                            ${item.subtotal.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-6" />

                    {/* Addresses */}
                    <div className="grid sm:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Shipping Address
                        </h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p className="font-medium text-foreground">{shippingAddress.name}</p>
                          <p>{shippingAddress.street}</p>
                          {shippingAddress.street2 && <p>{shippingAddress.street2}</p>}
                          <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}</p>
                          <p>{shippingAddress.phone}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Payment Method
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}
                        </p>
                      </div>
                    </div>

                    {/* Order Notes */}
                    <div className="mb-6">
                      <Label htmlFor="notes" className="mb-2 block">Order Notes (optional)</Label>
                      <Textarea
                        id="notes"
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder="Special delivery instructions, etc."
                        rows={3}
                      />
                    </div>

                    <div className="mt-8 flex justify-between">
                      <Button variant="outline" size="lg" onClick={() => setStep('payment')}>
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Back
                      </Button>
                      <Button
                        variant="hero"
                        size="lg"
                        onClick={handlePlaceOrder}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Place Order • ${total.toFixed(2)}
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-2xl border border-border p-6 sticky top-24"
              >
                <h2 className="text-xl font-bold mb-6">Order Summary</h2>

                {/* Items Preview */}
                <div className="space-y-3 mb-6 max-h-48 overflow-y-auto">
                  {cart.items.map((item) => (
                    <div key={item.product_id} className="flex items-center gap-3 text-sm">
                      <div className="h-12 w-12 rounded-lg bg-secondary overflow-hidden shrink-0">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium line-clamp-1">{item.product.name}</p>
                        <p className="text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-medium">${item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Totals */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        `$${shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (8%)</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Secure SSL Encrypted Checkout
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      30-Day Money Back Guarantee
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Free Returns on All Orders
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Checkout;
