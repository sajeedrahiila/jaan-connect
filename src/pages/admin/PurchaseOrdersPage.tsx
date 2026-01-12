import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Eye,
  Download,
  TrendingUp,
  Box,
  Package,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MoreVertical,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier_name: string;
  order_date: string;
  expected_delivery_date: string;
  actual_delivery_date: string | null;
  status: 'draft' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'unpaid' | 'partial' | 'paid';
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  item_count: number;
  received_count: number;
  items?: Array<{
    id: number;
    product_name: string;
    quantity: number;
    received_quantity: number;
    barcode: string;
  }>;
}

interface LowStockItem {
  product_id: number;
  product_name: string;
  sku: string;
  current_stock: number;
  low_stock_threshold: number;
  reorder_quantity: number;
  unit_cost: number;
  barcode: string;
}

interface SupplierLowStock {
  id: number;
  supplier_name: string;
  contact_person: string;
  email: string;
  phone: string;
  payment_terms: string;
  default_lead_time_days: number;
  products: LowStockItem[];
}

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [lowStockDialogOpen, setLowStockDialogOpen] = useState(false);
  const [lowStockData, setLowStockData] = useState<SupplierLowStock[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierLowStock | null>(null);
  const [manualSupplierId, setManualSupplierId] = useState<number | null>(null);
  const [manualItems, setManualItems] = useState<Record<number, { product: LowStockItem; quantity: number }>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPurchaseOrders();
  }, [statusFilter]);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('session_token');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`${API_URL}/api/admin/purchase-orders?${params}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setPurchaseOrders(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch purchase orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch purchase orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStockBySupplier = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`${API_URL}/api/admin/low-stock-by-supplier`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setLowStockData(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch low stock data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch low stock products',
        variant: 'destructive',
      });
    }
  };

  const handleViewPO = async (po: PurchaseOrder) => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`${API_URL}/api/admin/purchase-orders/${po.id}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setSelectedPO(result.data);
          setDetailDialogOpen(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch PO details:', error);
    }
  };

  const handleCreatePO = async (supplier: SupplierLowStock) => {
    try {
      const token = localStorage.getItem('session_token');
      const items = supplier.products.map((p) => ({
        product_id: p.product_id,
        quantity: p.reorder_quantity,
        unit_price: p.unit_cost,
      }));

      const res = await fetch(`${API_URL}/api/admin/purchase-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          supplier_id: supplier.id,
          expected_delivery_date: new Date(Date.now() + supplier.default_lead_time_days * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          items,
          notes: `Auto-generated PO for low stock items`,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          toast({
            title: 'Success',
            description: `Purchase order ${result.data.po_number} created`,
          });
          fetchPurchaseOrders();
          setCreateDialogOpen(false);
        }
      }
    } catch (error) {
      console.error('Failed to create PO:', error);
      toast({
        title: 'Error',
        description: 'Failed to create purchase order',
        variant: 'destructive',
      });
    }
  };

  const handleManualCreatePO = async () => {
    if (!manualSupplierId) {
      toast({ title: 'Select supplier', description: 'Choose a supplier to proceed', variant: 'destructive' });
      return;
    }

    const supplier = lowStockData.find((s) => s.id === manualSupplierId);
    if (!supplier) {
      toast({ title: 'Supplier not found', description: 'Reload suppliers and try again', variant: 'destructive' });
      return;
    }

    const items = Object.values(manualItems)
      .filter((entry) => entry.quantity > 0)
      .map((entry) => ({
        product_id: entry.product.product_id,
        quantity: entry.quantity,
        unit_price: entry.product.unit_cost,
      }));

    if (!items.length) {
      toast({ title: 'Add items', description: 'Select at least one product with quantity', variant: 'destructive' });
      return;
    }

    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`${API_URL}/api/admin/purchase-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          supplier_id: manualSupplierId,
          expected_delivery_date: new Date(Date.now() + (supplier.default_lead_time_days || 7) * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          items,
          notes: 'Manual PO created from admin panel',
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          toast({ title: 'PO created', description: `Purchase order ${result.data.po_number} created` });
          fetchPurchaseOrders();
          setCreateDialogOpen(false);
          setManualItems({});
          setManualSupplierId(null);
        }
      }
    } catch (error) {
      console.error('Failed to create PO:', error);
      toast({ title: 'Error', description: 'Failed to create purchase order', variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'partial':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage supplier orders and track deliveries</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              fetchLowStockBySupplier();
              setLowStockDialogOpen(true);
            }}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Low Stock
          </Button>
          <Button
            onClick={() => {
              fetchLowStockBySupplier();
              setCreateDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New PO
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total POs</p>
                <p className="text-2xl font-bold">{purchaseOrders.length}</p>
              </div>
              <Package className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {purchaseOrders.filter((po) => po.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Transit</p>
                <p className="text-2xl font-bold">
                  {purchaseOrders.filter((po) => po.status === 'shipped').length}
                </p>
              </div>
              <Truck className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
                  ${purchaseOrders.reduce((sum, po) => sum + po.total_amount, 0).toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search PO number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Purchase Orders Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders
                  .filter((po) => po.po_number.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((po) => (
                    <TableRow key={po.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{po.po_number}</TableCell>
                      <TableCell>{po.supplier_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Box className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {po.received_count}/{po.item_count}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">${po.total_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(po.status)}>{po.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPaymentStatusIcon(po.payment_status)}
                          <span className="text-xs">{po.payment_status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {po.actual_delivery_date
                          ? new Date(po.actual_delivery_date).toLocaleDateString()
                          : new Date(po.expected_delivery_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewPO(po)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Dialog */}
      <Dialog open={lowStockDialogOpen} onOpenChange={setLowStockDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Low Stock Products by Supplier</DialogTitle>
            <DialogDescription>
              Generate purchase orders for products below their reorder point
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {lowStockData.map((supplier) => (
              <Card key={supplier.id} className="border-blue-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{supplier.supplier_name}</CardTitle>
                      <CardDescription>
                        {supplier.contact_person} • {supplier.phone}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => handleCreatePO(supplier)}
                      size="sm"
                    >
                      Create PO
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {supplier.products.map((product) => (
                      <div
                        key={product.product_id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{product.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            SKU: {product.sku} • Barcode: {product.barcode}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Stock: {product.current_stock} / {product.low_stock_threshold} (Reorder: {product.reorder_quantity})
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${(product.unit_cost * product.reorder_quantity).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">${product.unit_cost.toFixed(2)} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* New PO Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>Select a supplier and add products from inventory</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Select
              value={manualSupplierId ? String(manualSupplierId) : ''}
              onValueChange={(val) => {
                setManualSupplierId(Number(val));
                setManualItems({});
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose supplier" />
              </SelectTrigger>
              <SelectContent>
                {lowStockData.map((supplier) => (
                  <SelectItem key={supplier.id} value={String(supplier.id)}>
                    {supplier.supplier_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {manualSupplierId && (
              <div className="space-y-3">
                {(lowStockData.find((s) => s.id === manualSupplierId)?.products || []).map((product) => {
                  const existing = manualItems[product.product_id]?.quantity || 0;
                  return (
                    <div
                      key={product.product_id}
                      className="grid grid-cols-12 gap-3 items-center p-3 bg-muted/50 rounded border"
                    >
                      <div className="col-span-7">
                        <p className="font-medium">{product.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          SKU: {product.sku} • Stock: {product.current_stock}
                        </p>
                      </div>
                      <div className="col-span-3 text-sm text-right">
                        <p className="font-semibold">${product.unit_cost.toFixed(2)} each</p>
                        <p className="text-xs text-muted-foreground">Reorder: {product.reorder_quantity}</p>
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min={0}
                          value={existing}
                          onChange={(e) => {
                            const qty = Number(e.target.value) || 0;
                            setManualItems((prev) => {
                              const next = { ...prev };
                              if (qty > 0) {
                                next[product.product_id] = { product, quantity: qty };
                              } else {
                                delete next[product.product_id];
                              }
                              return next;
                            });
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleManualCreatePO} disabled={!manualSupplierId || !Object.keys(manualItems).length}>
              Create PO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PO Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedPO && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedPO.po_number}</DialogTitle>
                <DialogDescription>
                  {selectedPO.supplier_name} • Ordered {new Date(selectedPO.order_date).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(selectedPO.status)}>
                      {selectedPO.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Status</p>
                    <div className="flex items-center gap-2">
                      {getPaymentStatusIcon(selectedPO.payment_status)}
                      <span className="capitalize">{selectedPO.payment_status}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Delivery</p>
                    <p className="font-medium">
                      {new Date(selectedPO.expected_delivery_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Items Received</p>
                    <p className="font-medium">
                      {selectedPO.received_count}/{selectedPO.item_count}
                    </p>
                  </div>
                </div>

                {selectedPO.items && (
                  <div>
                    <h3 className="font-semibold mb-3">Items</h3>
                    <div className="space-y-2">
                      {selectedPO.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded border"
                        >
                          <div>
                            <p className="font-medium text-sm">{item.product_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Barcode: {item.barcode}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {item.received_quantity}/{item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${selectedPO.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (5%)</span>
                      <span>${selectedPO.tax_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>${selectedPO.shipping_cost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base">
                      <span>Total</span>
                      <span>${selectedPO.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                  Close
                </Button>
                <Button>Download PO</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
