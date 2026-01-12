import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Loader2, DollarSign, Plus, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface InvoiceItem {
  id?: number;
  product_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  billing_street: string;
  billing_street2?: string;
  billing_city: string;
  billing_state: string;
  billing_zip: string;
  billing_country?: string;
  subtotal: number;
  tax: number;
  shipping_fee: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  status: string;
  notes?: string;
  items?: InvoiceItem[];
}

interface InvoiceEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onSuccess: () => void;
}

export function InvoiceEditDialog({ open, onOpenChange, invoice, onSuccess }: InvoiceEditDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Invoice>>({});
  const [items, setItems] = useState<InvoiceItem[]>([]);

  useEffect(() => {
    if (invoice) {
      setFormData(invoice);
      setItems(invoice.items || []);
    }
  }, [invoice]);

  const calculateTotals = (updatedItems: InvoiceItem[]) => {
    const subtotal = updatedItems.reduce((sum, item) => sum + Number(item.total_price), 0);
    const tax = formData.tax || 0;
    const shipping = formData.shipping_fee || 0;
    const total = subtotal + Number(tax) + Number(shipping);
    const amountPaid = formData.amount_paid || 0;
    const balanceDue = total - Number(amountPaid);

    setFormData(prev => ({
      ...prev,
      subtotal,
      total,
      balance_due: balanceDue
    }));
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      description: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    };
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
  };

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    calculateTotals(updatedItems);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate total price for this item
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = field === 'quantity' ? Number(value) : Number(updatedItems[index].quantity);
      const unitPrice = field === 'unit_price' ? Number(value) : Number(updatedItems[index].unit_price);
      updatedItems[index].total_price = quantity * unitPrice;
    }
    
    setItems(updatedItems);
    calculateTotals(updatedItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`${API_URL}/api/admin/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          items,
        }),
      });

      if (!res.ok) throw new Error('Failed to update invoice');

      toast({
        title: 'Invoice updated',
        description: 'Changes have been saved and synchronized across all views',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update invoice',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    const updated = { ...formData, [field]: value };
    
    // Recalculate totals when tax or shipping changes
    if (field === 'tax' || field === 'shipping_fee') {
      const subtotal = Number(updated.subtotal) || 0;
      const tax = Number(updated.tax) || 0;
      const shipping = Number(updated.shipping_fee) || 0;
      const total = subtotal + tax + shipping;
      const amountPaid = Number(updated.amount_paid) || 0;
      
      updated.total = total;
      updated.balance_due = total - amountPaid;
    }
    
    // Recalculate balance when amount paid changes
    if (field === 'amount_paid') {
      const total = Number(updated.total) || 0;
      updated.balance_due = total - Number(value);
    }
    
    setFormData(updated);
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Invoice {invoice.invoice_number}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name || ''}
                  onChange={(e) => handleFieldChange('customer_name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_email">Email</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={formData.customer_email || ''}
                  onChange={(e) => handleFieldChange('customer_email', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_phone">Phone</Label>
                <Input
                  id="customer_phone"
                  value={formData.customer_phone || ''}
                  onChange={(e) => handleFieldChange('customer_phone', e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Billing Address */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Billing Address</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="billing_street">Street Address</Label>
                <Input
                  id="billing_street"
                  value={formData.billing_street || ''}
                  onChange={(e) => handleFieldChange('billing_street', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing_city">City</Label>
                <Input
                  id="billing_city"
                  value={formData.billing_city || ''}
                  onChange={(e) => handleFieldChange('billing_city', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing_state">State</Label>
                <Input
                  id="billing_state"
                  value={formData.billing_state || ''}
                  onChange={(e) => handleFieldChange('billing_state', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing_zip">ZIP Code</Label>
                <Input
                  id="billing_zip"
                  value={formData.billing_zip || ''}
                  onChange={(e) => handleFieldChange('billing_zip', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Invoice Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Line Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
            
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                  <div className="flex-1 grid grid-cols-12 gap-2">
                    <div className="col-span-5">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Qty"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        value={`$${Number(item.total_price).toFixed(2)}`}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Financial Details */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Financial Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subtotal">Subtotal</Label>
                <Input
                  id="subtotal"
                  value={`$${Number(formData.subtotal || 0).toFixed(2)}`}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax">Tax</Label>
                <Input
                  id="tax"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.tax || 0}
                  onChange={(e) => handleFieldChange('tax', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipping_fee">Shipping Fee</Label>
                <Input
                  id="shipping_fee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.shipping_fee || 0}
                  onChange={(e) => handleFieldChange('shipping_fee', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total">Total</Label>
                <Input
                  id="total"
                  value={`$${Number(formData.total || 0).toFixed(2)}`}
                  disabled
                  className="bg-muted font-semibold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount_paid">Amount Paid</Label>
                <Input
                  id="amount_paid"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount_paid || 0}
                  onChange={(e) => handleFieldChange('amount_paid', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="balance_due">Balance Due</Label>
                <Input
                  id="balance_due"
                  value={`$${Number(formData.balance_due || 0).toFixed(2)}`}
                  disabled
                  className="bg-muted font-semibold"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Status and Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || 'draft'}
                onValueChange={(value) => handleFieldChange('status', value)}
              >
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
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
