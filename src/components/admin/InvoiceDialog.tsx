import { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: any | null;
  onSuccess: () => void;
}

export function InvoiceDialog({ open, onOpenChange, invoice, onSuccess }: InvoiceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    billing_street: '',
    billing_city: '',
    billing_state: '',
    billing_zip: '',
    subtotal: '',
    tax: '',
    shipping_fee: '',
    status: 'draft' as InvoiceStatus,
    due_days: '30',
    notes: '',
  });

  const { toast } = useToast();

  useEffect(() => {
    if (invoice) {
      setFormData({
        customer_name: invoice.customer_name || '',
        customer_email: invoice.customer_email || '',
        customer_phone: invoice.customer_phone || '',
        billing_street: invoice.billing_street || '',
        billing_city: invoice.billing_city || '',
        billing_state: invoice.billing_state || '',
        billing_zip: invoice.billing_zip || '',
        subtotal: invoice.subtotal?.toString() || '',
        tax: invoice.tax?.toString() || '',
        shipping_fee: invoice.shipping_fee?.toString() || '',
        status: invoice.status || 'draft',
        due_days: '30',
        notes: invoice.notes || '',
      });
    }
  }, [invoice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('session_token');
      const subtotal = parseFloat(formData.subtotal) || 0;
      const tax = parseFloat(formData.tax) || 0;
      const shipping_fee = parseFloat(formData.shipping_fee) || 0;
      const total = subtotal + tax + shipping_fee;

      const payload = {
        ...formData,
        subtotal,
        tax,
        shipping_fee,
        total,
        balance_due: total,
      };

      let res;
      if (invoice) {
        // Update existing invoice
        res = await fetch(`${API_URL}/api/admin/invoices/${invoice.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      } else {
        // Create new invoice
        res = await fetch(`${API_URL}/api/admin/invoices`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        toast({
          title: invoice ? 'Invoice Updated' : 'Invoice Created',
          description: `Invoice has been ${invoice ? 'updated' : 'created'} successfully`,
        });
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error('Failed to save invoice');
      }
    } catch (error) {
      console.error('Save invoice error:', error);
      toast({
        title: 'Error',
        description: `Failed to ${invoice ? 'update' : 'create'} invoice`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoice ? 'Edit Invoice' : 'Create Invoice'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <Input
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Customer Email *</Label>
              <Input
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Customer Phone</Label>
              <Input
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val as InvoiceStatus })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Billing Street *</Label>
            <Input
              value={formData.billing_street}
              onChange={(e) => setFormData({ ...formData, billing_street: e.target.value })}
              placeholder="123 Main St"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>City *</Label>
              <Input
                value={formData.billing_city}
                onChange={(e) => setFormData({ ...formData, billing_city: e.target.value })}
                placeholder="New York"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>State *</Label>
              <Input
                value={formData.billing_state}
                onChange={(e) => setFormData({ ...formData, billing_state: e.target.value })}
                placeholder="NY"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>ZIP *</Label>
              <Input
                value={formData.billing_zip}
                onChange={(e) => setFormData({ ...formData, billing_zip: e.target.value })}
                placeholder="10001"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Subtotal *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.subtotal}
                onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Tax</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.tax}
                onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Shipping Fee</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.shipping_fee}
                onChange={(e) => setFormData({ ...formData, shipping_fee: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Total</Label>
            <div className="text-2xl font-bold">
              ${((parseFloat(formData.subtotal) || 0) + (parseFloat(formData.tax) || 0) + (parseFloat(formData.shipping_fee) || 0)).toFixed(2)}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {invoice ? 'Update' : 'Create'} Invoice
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
