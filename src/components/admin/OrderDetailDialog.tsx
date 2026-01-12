import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  Phone,
  Mail,
  User,
  Calendar,
  CreditCard,
  Loader2,
  Printer,
  Download,
  ShoppingCart,
  FileText,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { generateOrderReceiptPDF } from '@/lib/pdf';
import { generateOrderBarcode } from '@/lib/barcode';

interface OrderItem {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  image?: string;
}

interface Order {
  id: string;
  customer: string;
  email: string;
  phone?: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  items: OrderItem[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  paymentMethod: string;
  notes?: string;
  trackingNumber?: string;
}

interface OrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onStatusUpdate: (orderId: string, status: string, trackingNumber?: string) => Promise<void>;
}

const statusConfig = {
  pending: { icon: Clock, color: 'bg-amber-100 text-amber-800', label: 'Pending' },
  processing: { icon: ShoppingCart, color: 'bg-blue-100 text-blue-800', label: 'Processing' },
  shipped: { icon: Truck, color: 'bg-purple-100 text-purple-800', label: 'Shipped' },
  delivered: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-800', label: 'Delivered' },
  cancelled: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Cancelled' },
};

const statusTimeline = [
  { key: 'pending', label: 'Order Placed', icon: ShoppingCart },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function OrderDetailDialog({ open, onOpenChange, order, onStatusUpdate }: OrderDetailDialogProps) {
  const [newStatus, setNewStatus] = useState(order?.status || 'pending');
  const [trackingNumber, setTrackingNumber] = useState(order?.trackingNumber || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [barcodeImage, setBarcodeImage] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (order?.id) {
      generateOrderBarcode(order.id, {
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 12,
      }).then(setBarcodeImage);
    }
  }, [order?.id]);

  const handleCreateInvoice = async () => {
    if (!order) return;

    setIsCreatingInvoice(true);
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`${API_URL}/api/admin/invoices/from-order/${order.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ due_days: 30 }),
      });

      if (res.ok) {
        const result = await res.json();
        toast({
          title: 'Invoice Created',
          description: `Invoice ${result.data.invoice_number} has been created successfully`,
        });
      } else {
        throw new Error('Failed to create invoice');
      }
    } catch (error) {
      console.error('Create invoice error:', error);
      toast({
        title: 'Error',
        description: 'Failed to create invoice',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  if (!order) return null;

  const currentStatusIndex = statusTimeline.findIndex((s) => s.key === order.status);
  const StatusIcon = statusConfig[order.status].icon;

  const handleStatusUpdate = async () => {
    setIsUpdating(true);
    try {
      await onStatusUpdate(order.id, newStatus, trackingNumber);
      toast({
        title: 'Order updated',
        description: `Order ${order.id} status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">Order {order.id}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Placed on {new Date(order.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {barcodeImage && (
                <img src={barcodeImage} alt="Order Barcode" className="h-14" />
              )}
              <Badge className={statusConfig[order.status].color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig[order.status].label}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Timeline */}
          <div className="bg-secondary/30 rounded-lg p-4">
            <h4 className="text-sm font-medium mb-4">Order Progress</h4>
            <div className="relative flex justify-between">
              {statusTimeline.map((status, index) => {
                const isCompleted = index <= currentStatusIndex && order.status !== 'cancelled';
                const isCurrent = status.key === order.status;
                
                return (
                  <div key={status.key} className="flex flex-col items-center relative z-10">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isCurrent ? 1.1 : 1,
                        backgroundColor: isCompleted ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
                      }}
                      className={`p-2 rounded-full ${isCompleted ? 'text-primary-foreground' : 'text-muted-foreground'}`}
                    >
                      <status.icon className="h-4 w-4" />
                    </motion.div>
                    <span className={`text-xs mt-2 ${isCompleted ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {status.label}
                    </span>
                  </div>
                );
              })}
              {/* Progress line */}
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-border -z-0">
                <motion.div
                  initial={false}
                  animate={{ width: `${(currentStatusIndex / (statusTimeline.length - 1)) * 100}%` }}
                  className="h-full bg-primary"
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          {/* Customer & Shipping Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Information
              </h4>
              <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
                <p className="font-medium">{order.customer}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {order.email}
                </div>
                {order.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {order.phone}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Shipping Address
              </h4>
              <div className="bg-secondary/30 rounded-lg p-4 text-sm">
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Order Items ({order.items.length})
            </h4>
            <div className="border rounded-lg divide-y">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4">
                  <div className="h-16 w-16 rounded-lg bg-secondary flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover rounded-lg" />
                    ) : (
                      <Package className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">{item.quantity} × ${item.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-secondary/30 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>${order.shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium text-lg">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Payment Method:</span>
            <span className="font-medium">{order.paymentMethod}</span>
          </div>

          <Separator />

          {/* Create Invoice Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateInvoice}
            disabled={isCreatingInvoice}
          >
            {isCreatingInvoice ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Create Invoice
          </Button>

          <Separator />

          {/* Update Status */}
          <div className="space-y-4">
            <h4 className="font-medium">Update Order Status</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={(val) => setNewStatus(val as typeof newStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tracking Number</Label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />
                Print Receipt
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => order && (await generateOrderReceiptPDF({
                  order_number: order.id,
                  customer: order.customer,
                  email: order.email,
                  phone: order.phone,
                  shippingAddress: order.shippingAddress,
                  items: order.items,
                  subtotal: order.subtotal,
                  tax: order.tax,
                  shipping: order.shipping,
                  total: order.total,
                  paymentMethod: order.paymentMethod,
                  status: order.status,
                  date: order.date,
                  notes: order.notes,
                }))}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={handleStatusUpdate} disabled={isUpdating}>
                {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update Order
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}