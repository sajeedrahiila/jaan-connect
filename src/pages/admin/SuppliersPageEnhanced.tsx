import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Truck, Mail, Phone, Package, RefreshCw, Info, Edit2, Trash2, Plus, TrendingUp } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface SupplierProduct {
  id: number;
  name: string;
  sku: string;
  stock_quantity: number;
  price: number;
  cost_price: number | null;
  low_stock_threshold: number | null;
  barcode: string | null;
}

interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  payment_terms: string;
  default_lead_time_days: number;
  is_active: boolean;
  rating: number | null;
  notes?: string;
  products: SupplierProduct[];
  // Enhanced fields
  supplier_type?: string;
  is_primary?: boolean;
  is_backup?: boolean;
  min_order_amount?: number;
  order_days?: string;
  cutoff_time?: string;
  delivery_days?: string;
  tax_id?: string;
  requires_1099?: boolean;
  accepts_returns?: boolean;
  credit_days?: number;
  restocking_fee_percent?: number;
  order_method?: string;
  preferred_contact_time?: string;
  on_time_delivery_percent?: number;
  avg_delivery_delay_days?: number;
  order_fulfillment_percent?: number;
  linked_products_count?: number;
  avg_supplier_cost?: number;
  avg_margin_percent?: number;
}

const SUPPLIER_TYPES = [
  { value: 'wholesale_distributor', label: 'Wholesale Distributor' },
  { value: 'local_vendor', label: 'Local Vendor' },
  { value: 'brand_manufacturer', label: 'Brand/Manufacturer' },
  { value: 'farm_producer', label: 'Farm/Producer' },
  { value: 'cash_and_carry', label: 'Cash & Carry' },
];

const ORDER_METHODS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'portal', label: 'Online Portal' },
  { value: 'fax', label: 'Fax' },
];

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    payment_terms: '',
    default_lead_time_days: 7,
    is_active: true,
    rating: 0,
    notes: '',
    supplier_type: '',
    is_primary: true,
    is_backup: false,
    min_order_amount: undefined,
    order_days: '',
    cutoff_time: '',
    delivery_days: '',
    tax_id: '',
    requires_1099: false,
    accepts_returns: true,
    credit_days: 30,
    restocking_fee_percent: 0,
    order_method: '',
    preferred_contact_time: '',
    on_time_delivery_percent: 100,
    avg_delivery_delay_days: 0,
    order_fulfillment_percent: 100,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('session_token');
      const res = await fetch(`${API_URL}/api/admin/suppliers`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setSuppliers(result.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch suppliers', error);
      toast({ title: 'Error', description: 'Could not load suppliers', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      payment_terms: '',
      default_lead_time_days: 7,
      is_active: true,
      rating: 0,
      notes: '',
      supplier_type: '',
      is_primary: true,
      is_backup: false,
      min_order_amount: undefined,
      order_days: '',
      cutoff_time: '',
      delivery_days: '',
      tax_id: '',
      requires_1099: false,
      accepts_returns: true,
      credit_days: 30,
      restocking_fee_percent: 0,
      order_method: '',
      preferred_contact_time: '',
      on_time_delivery_percent: 100,
      avg_delivery_delay_days: 0,
      order_fulfillment_percent: 100,
    });
    setFormOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setFormData(supplier);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      toast({ title: 'Required', description: 'Supplier name is required', variant: 'destructive' });
      return;
    }

    try {
      const token = localStorage.getItem('session_token');
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API_URL}/api/admin/suppliers/${editingId}` : `${API_URL}/api/admin/suppliers`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          contactPerson: formData.contact_person,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          paymentTerms: formData.payment_terms,
          defaultLeadTimeDays: formData.default_lead_time_days,
          isActive: formData.is_active,
          rating: formData.rating,
          notes: formData.notes,
          supplierType: formData.supplier_type,
          isPrimary: formData.is_primary,
          isBackup: formData.is_backup,
          minOrderAmount: formData.min_order_amount,
          orderDays: formData.order_days,
          cutoffTime: formData.cutoff_time,
          deliveryDays: formData.delivery_days,
          taxId: formData.tax_id,
          requires1099: formData.requires_1099,
          acceptsReturns: formData.accepts_returns,
          creditDays: formData.credit_days,
          restockingFeePercent: formData.restocking_fee_percent,
          orderMethod: formData.order_method,
          preferredContactTime: formData.preferred_contact_time,
          onTimeDeliveryPercent: formData.on_time_delivery_percent,
          avgDeliveryDelayDays: formData.avg_delivery_delay_days,
          orderFulfillmentPercent: formData.order_fulfillment_percent,
        }),
      });

      if (res.ok) {
        toast({ title: editingId ? 'Updated' : 'Created', description: `Supplier ${formData.name} saved` });
        fetchSuppliers();
        setFormOpen(false);
      }
    } catch (error) {
      console.error('Failed to save supplier', error);
      toast({ title: 'Error', description: 'Could not save supplier', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete supplier "${name}"? This cannot be undone.`)) return;

    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`${API_URL}/api/admin/suppliers/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (res.ok) {
        toast({ title: 'Deleted', description: `Supplier "${name}" removed` });
        fetchSuppliers();
      }
    } catch (error) {
      console.error('Failed to delete supplier', error);
      toast({ title: 'Error', description: 'Could not delete supplier', variant: 'destructive' });
    }
  };

  const filtered = suppliers.filter((s) =>
    [s.name, s.contact_person, s.email, s.phone, s.supplier_type]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground">Complete supplier profiles for grocery wholesale</p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Button variant="outline" onClick={fetchSuppliers} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supplier Directory</CardTitle>
          <CardDescription>All suppliers with enhanced profiles and metrics.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[70vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Metrics</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id} className="align-top">
                    <TableCell className="space-y-1">
                      <div className="flex items-center gap-2 font-semibold">
                        <Truck className="h-4 w-4 text-primary" />
                        {s.name}
                        {s.is_primary && <Badge className="bg-blue-100 text-blue-700 text-xs">Primary</Badge>}
                        {s.is_backup && <Badge className="bg-orange-100 text-orange-700 text-xs">Backup</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{s.contact_person || '—'}</p>
                      {s.is_active ? (
                        <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      <Badge variant="outline">{SUPPLIER_TYPES.find(t => t.value === s.supplier_type)?.label || '—'}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="space-y-1">
                        <p className="font-medium">{s.linked_products_count || 0} products</p>
                        {s.avg_margin_percent ? <p className="text-xs text-green-600">{s.avg_margin_percent.toFixed(1)}% margin</p> : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="space-y-1">
                        {s.on_time_delivery_percent ? <p>🚚 {s.on_time_delivery_percent.toFixed(0)}% on-time</p> : null}
                        {s.order_fulfillment_percent ? <p>📦 {s.order_fulfillment_percent.toFixed(0)}% fulfilled</p> : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {s.rating ? <Badge className="bg-yellow-100 text-yellow-800">{s.rating.toFixed(1)}⭐</Badge> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedSupplier(s); setDetailOpen(true); }}>
                        <Info className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(s)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id, s.name)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!filtered.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                      No suppliers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Supplier Details Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedSupplier && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedSupplier.name}</DialogTitle>
                <DialogDescription>
                  {selectedSupplier.supplier_type && SUPPLIER_TYPES.find(t => t.value === selectedSupplier.supplier_type)?.label}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                {/* Contact Info */}
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-1">
                    <p><span className="font-semibold">Person:</span> {selectedSupplier.contact_person || '—'}</p>
                    <p><span className="font-semibold">Email:</span> {selectedSupplier.email || '—'}</p>
                    <p><span className="font-semibold">Phone:</span> {selectedSupplier.phone || '—'}</p>
                    <p><span className="font-semibold">Address:</span> {selectedSupplier.address || '—'}</p>
                  </CardContent>
                </Card>

                {/* Ordering Info */}
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Ordering</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-1">
                    <p><span className="font-semibold">Min Order:</span> ${selectedSupplier.min_order_amount?.toFixed(2) || '—'}</p>
                    <p><span className="font-semibold">Method:</span> {ORDER_METHODS.find(m => m.value === selectedSupplier.order_method)?.label || '—'}</p>
                    <p><span className="font-semibold">Days:</span> {selectedSupplier.order_days || '—'}</p>
                    <p><span className="font-semibold">Cutoff:</span> {selectedSupplier.cutoff_time || '—'}</p>
                    <p><span className="font-semibold">Delivery:</span> {selectedSupplier.delivery_days || '—'}</p>
                  </CardContent>
                </Card>

                {/* Terms & Compliance */}
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Terms</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-1">
                    <p><span className="font-semibold">Payment:</span> {selectedSupplier.payment_terms || '—'}</p>
                    <p><span className="font-semibold">Lead Time:</span> {selectedSupplier.default_lead_time_days} days</p>
                    <p><span className="font-semibold">Credit Days:</span> {selectedSupplier.credit_days || 30}</p>
                    <p><span className="font-semibold">Returns:</span> {selectedSupplier.accepts_returns ? 'Yes' : 'No'}</p>
                    {selectedSupplier.restocking_fee_percent ? <p><span className="font-semibold">Restock Fee:</span> {selectedSupplier.restocking_fee_percent}%</p> : null}
                  </CardContent>
                </Card>

                {/* Reliability */}
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Reliability</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-1">
                    <p><span className="font-semibold">On-Time:</span> {selectedSupplier.on_time_delivery_percent?.toFixed(0) || 0}%</p>
                    <p><span className="font-semibold">Avg Delay:</span> {selectedSupplier.avg_delivery_delay_days || 0} days</p>
                    <p><span className="font-semibold">Fulfillment:</span> {selectedSupplier.order_fulfillment_percent?.toFixed(0) || 100}%</p>
                    <p><span className="font-semibold">Rating:</span> {selectedSupplier.rating?.toFixed(1) || '—'}⭐</p>
                  </CardContent>
                </Card>

                {/* Products */}
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Products</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-1">
                    <p><span className="font-semibold">Count:</span> {selectedSupplier.linked_products_count || 0}</p>
                    <p><span className="font-semibold">Avg Cost:</span> ${selectedSupplier.avg_supplier_cost?.toFixed(2) || 0}</p>
                    <p><span className="font-semibold">Avg Margin:</span> {selectedSupplier.avg_margin_percent?.toFixed(1) || 0}%</p>
                  </CardContent>
                </Card>

                {/* Compliance */}
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Compliance</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-1">
                    <p><span className="font-semibold">Tax ID:</span> {selectedSupplier.tax_id || '—'}</p>
                    <p><span className="font-semibold">1099:</span> {selectedSupplier.requires_1099 ? 'Required' : 'Not required'}</p>
                    <p><span className="font-semibold">Primary:</span> {selectedSupplier.is_primary ? 'Yes' : 'No'}</p>
                    <p><span className="font-semibold">Backup:</span> {selectedSupplier.is_backup ? 'Yes' : 'No'}</p>
                  </CardContent>
                </Card>
              </div>

              {selectedSupplier.products?.length ? (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Linked Products ({selectedSupplier.products.length})</h3>
                  <ScrollArea className="h-48">
                    <div className="space-y-2 pr-4">
                      {selectedSupplier.products.slice(0, 5).map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-2 bg-muted/50 rounded border text-sm">
                          <div>
                            <p className="font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">SKU: {p.sku} • Stock: {p.stock_quantity}</p>
                          </div>
                          <div className="text-right text-xs">
                            <p>Cost: ${p.cost_price ?? p.price}</p>
                          </div>
                        </div>
                      ))}
                      {selectedSupplier.products.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          +{selectedSupplier.products.length - 5} more products
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">No products linked.</p>
              )}

              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Supplier Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update supplier information' : 'Create a complete supplier profile'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div>
              <h3 className="font-semibold mb-3">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium">Name *</label>
                  <Input value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Supplier name" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium">Type</label>
                  <Select value={formData.supplier_type || ''} onValueChange={(v) => setFormData({ ...formData, supplier_type: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPLIER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium">Contact Person</label>
                  <Input value={formData.contact_person || ''} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} placeholder="John Doe" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium">Email</label>
                  <Input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="contact@supplier.com" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium">Phone</label>
                  <Input value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="(555) 123-4567" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium">Address</label>
                  <Input value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="123 Business St..." className="mt-1" />
                </div>
              </div>
            </div>

            {/* Ordering Info */}
            <div>
              <h3 className="font-semibold mb-3">Ordering Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium">Min Order Amount ($)</label>
                  <Input type="number" value={formData.min_order_amount || ''} onChange={(e) => setFormData({ ...formData, min_order_amount: Number(e.target.value) })} placeholder="0" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium">Order Method</label>
                  <Select value={formData.order_method || ''} onValueChange={(v) => setFormData({ ...formData, order_method: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium">Order Days (e.g., Mon-Fri)</label>
                  <Input value={formData.order_days || ''} onChange={(e) => setFormData({ ...formData, order_days: e.target.value })} placeholder="Mon-Fri" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium">Cutoff Time (e.g., 3:00 PM)</label>
                  <Input value={formData.cutoff_time || ''} onChange={(e) => setFormData({ ...formData, cutoff_time: e.target.value })} placeholder="HH:MM" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium">Delivery Days (e.g., Mon, Wed, Fri)</label>
                  <Input value={formData.delivery_days || ''} onChange={(e) => setFormData({ ...formData, delivery_days: e.target.value })} placeholder="Mon, Wed, Fri" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium">Preferred Contact Time</label>
                  <Input value={formData.preferred_contact_time || ''} onChange={(e) => setFormData({ ...formData, preferred_contact_time: e.target.value })} placeholder="e.g., 9 AM - 12 PM" className="mt-1" />
                </div>
              </div>
            </div>

            {/* Payment & Returns */}
            <div>
              <h3 className="font-semibold mb-3">Payment & Returns</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium">Payment Terms</label>
                  <Input value={formData.payment_terms || ''} onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })} placeholder="Net 30" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium">Lead Time (days)</label>
                  <Input type="number" value={formData.default_lead_time_days || 7} onChange={(e) => setFormData({ ...formData, default_lead_time_days: Number(e.target.value) })} min={1} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium">Credit Days</label>
                  <Input type="number" value={formData.credit_days || 30} onChange={(e) => setFormData({ ...formData, credit_days: Number(e.target.value) })} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium">Restocking Fee (%)</label>
                  <Input type="number" value={formData.restocking_fee_percent || 0} onChange={(e) => setFormData({ ...formData, restocking_fee_percent: Number(e.target.value) })} min={0} max={100} step={0.1} className="mt-1" />
                </div>
                <div className="flex items-center gap-2 md:col-span-2">
                  <input type="checkbox" checked={formData.accepts_returns ?? true} onChange={(e) => setFormData({ ...formData, accepts_returns: e.target.checked })} id="accepts_returns" />
                  <label htmlFor="accepts_returns" className="text-xs font-medium cursor-pointer">Accepts Returns</label>
                </div>
              </div>
            </div>

            {/* Compliance */}
            <div>
              <h3 className="font-semibold mb-3">Compliance & Classification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium">Tax ID / EIN</label>
                  <Input value={formData.tax_id || ''} onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })} placeholder="XX-XXXXXXX" className="mt-1" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.requires_1099 ?? false} onChange={(e) => setFormData({ ...formData, requires_1099: e.target.checked })} id="requires_1099" />
                  <label htmlFor="requires_1099" className="text-xs font-medium cursor-pointer">1099 Required</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.is_primary ?? true} onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })} id="is_primary" />
                  <label htmlFor="is_primary" className="text-xs font-medium cursor-pointer">Primary Supplier</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.is_backup ?? false} onChange={(e) => setFormData({ ...formData, is_backup: e.target.checked })} id="is_backup" />
                  <label htmlFor="is_backup" className="text-xs font-medium cursor-pointer">Backup Supplier</label>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div>
              <h3 className="font-semibold mb-3">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium">On-Time Delivery %</label>
                  <Input type="number" value={formData.on_time_delivery_percent || 100} onChange={(e) => setFormData({ ...formData, on_time_delivery_percent: Number(e.target.value) })} min={0} max={100} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium">Avg Delivery Delay (days)</label>
                  <Input type="number" value={formData.avg_delivery_delay_days || 0} onChange={(e) => setFormData({ ...formData, avg_delivery_delay_days: Number(e.target.value) })} min={0} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium">Order Fulfillment %</label>
                  <Input type="number" value={formData.order_fulfillment_percent || 100} onChange={(e) => setFormData({ ...formData, order_fulfillment_percent: Number(e.target.value) })} min={0} max={100} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium">Rating (0-5)</label>
                  <Input type="number" value={formData.rating || 0} onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })} min={0} max={5} step={0.5} className="mt-1" />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-medium">Notes</label>
              <Input value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Internal notes..." className="mt-1" />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" checked={formData.is_active ?? true} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} id="active" />
              <label htmlFor="active" className="text-xs font-medium cursor-pointer">Active</label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingId ? 'Update Supplier' : 'Create Supplier'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
