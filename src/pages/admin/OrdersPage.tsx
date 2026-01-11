import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  MoreVertical,
  ShoppingCart,
  Eye,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Filter,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OrderDetailDialog } from '@/components/admin/OrderDetailDialog';
import { useToast } from '@/hooks/use-toast';

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

// Mock orders data with full details
const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    customer: 'John Smith',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    total: 245.99,
    subtotal: 219.99,
    tax: 16.00,
    shipping: 10.00,
    items: [
      { id: 1, name: 'Premium Basmati Rice (25kg)', sku: 'RIC-002', quantity: 2, price: 89.99 },
      { id: 2, name: 'Organic Honey (500g)', sku: 'HON-004', quantity: 2, price: 18.99 },
    ],
    status: 'pending',
    date: '2024-01-10T14:32:00Z',
    shippingAddress: {
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'United States',
    },
    paymentMethod: 'Credit Card (Visa ****4242)',
  },
  {
    id: 'ORD-002',
    customer: 'Sarah Johnson',
    email: 'sarah@example.com',
    phone: '+1 (555) 234-5678',
    total: 189.50,
    subtotal: 169.50,
    tax: 12.00,
    shipping: 8.00,
    items: [
      { id: 3, name: 'Cold Pressed Coconut Oil', sku: 'OIL-003', quantity: 3, price: 24.50 },
      { id: 4, name: 'Organic Whole Wheat Flour', sku: 'FLR-001', quantity: 2, price: 45.00 },
    ],
    status: 'processing',
    date: '2024-01-09T10:15:00Z',
    shippingAddress: {
      street: '456 Oak Avenue',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90001',
      country: 'United States',
    },
    paymentMethod: 'PayPal',
  },
  {
    id: 'ORD-003',
    customer: 'Mike Davis',
    email: 'mike@example.com',
    phone: '+1 (555) 345-6789',
    total: 520.00,
    subtotal: 480.00,
    tax: 25.00,
    shipping: 15.00,
    items: [
      { id: 5, name: 'Premium Basmati Rice (25kg)', sku: 'RIC-002', quantity: 4, price: 89.99 },
      { id: 6, name: 'Green Tea Premium Pack', sku: 'TEA-005', quantity: 3, price: 32.00 },
      { id: 7, name: 'Organic Honey (500g)', sku: 'HON-004', quantity: 2, price: 18.99 },
    ],
    status: 'shipped',
    date: '2024-01-08T16:45:00Z',
    shippingAddress: {
      street: '789 Pine Road',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      country: 'United States',
    },
    paymentMethod: 'Credit Card (Mastercard ****5555)',
    trackingNumber: 'TRK-789456123',
  },
  {
    id: 'ORD-004',
    customer: 'Emily Brown',
    email: 'emily@example.com',
    total: 89.99,
    subtotal: 79.99,
    tax: 5.00,
    shipping: 5.00,
    items: [
      { id: 8, name: 'Premium Basmati Rice (25kg)', sku: 'RIC-002', quantity: 1, price: 89.99 },
    ],
    status: 'delivered',
    date: '2024-01-07T09:20:00Z',
    shippingAddress: {
      street: '321 Elm Street',
      city: 'Houston',
      state: 'TX',
      zip: '77001',
      country: 'United States',
    },
    paymentMethod: 'Credit Card (Visa ****1234)',
    trackingNumber: 'TRK-456789012',
  },
  {
    id: 'ORD-005',
    customer: 'Tom Wilson',
    email: 'tom@example.com',
    phone: '+1 (555) 567-8901',
    total: 315.75,
    subtotal: 289.75,
    tax: 18.00,
    shipping: 8.00,
    items: [
      { id: 9, name: 'Organic Whole Wheat Flour', sku: 'FLR-001', quantity: 3, price: 45.00 },
      { id: 10, name: 'Cold Pressed Coconut Oil', sku: 'OIL-003', quantity: 4, price: 24.50 },
      { id: 11, name: 'Green Tea Premium Pack', sku: 'TEA-005', quantity: 2, price: 32.00 },
    ],
    status: 'cancelled',
    date: '2024-01-06T11:30:00Z',
    shippingAddress: {
      street: '654 Maple Drive',
      city: 'Phoenix',
      state: 'AZ',
      zip: '85001',
      country: 'United States',
    },
    paymentMethod: 'PayPal',
    notes: 'Customer requested cancellation - changed mind',
  },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const { toast } = useToast();

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <ShoppingCart className="h-3 w-3 mr-1" />
            Processing
          </Badge>
        );
      case 'shipped':
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            <Truck className="h-3 w-3 mr-1" />
            Shipped
          </Badge>
        );
      case 'delivered':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Delivered
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string, trackingNumber?: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, status: newStatus as Order['status'], trackingNumber: trackingNumber || order.trackingNumber }
          : order
      )
    );

    // Update selected order if it's the one being updated
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) =>
        prev ? { ...prev, status: newStatus as Order['status'], trackingNumber: trackingNumber || prev.trackingNumber } : null
      );
    }
  };

  const handleQuickStatusUpdate = async (order: Order, newStatus: Order['status']) => {
    await handleStatusUpdate(order.id, newStatus);
    toast({
      title: 'Status updated',
      description: `Order ${order.id} marked as ${newStatus}`,
    });
  };

  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage and track customer orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/20">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{statusCounts.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold">{statusCounts.processing}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Shipped</p>
                <p className="text-2xl font-bold">{statusCounts.shipped}</p>
              </div>
              <Truck className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold">{statusCounts.delivered}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders by ID, customer, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders ({statusCounts.all})</SelectItem>
                <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
                <SelectItem value="processing">Processing ({statusCounts.processing})</SelectItem>
                <SelectItem value="shipped">Shipped ({statusCounts.shipped})</SelectItem>
                <SelectItem value="delivered">Delivered ({statusCounts.delivered})</SelectItem>
                <SelectItem value="cancelled">Cancelled ({statusCounts.cancelled})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No orders found</h3>
                      <p className="text-muted-foreground">Try adjusting your search or filters</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order, index) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleViewDetails(order)}
                    >
                      <TableCell className="font-mono font-medium text-primary">
                        {order.id}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customer}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{order.items.length} items</TableCell>
                      <TableCell className="font-medium">
                        ${order.total.toFixed(2)}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(order.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(order)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {order.status === 'pending' && (
                              <DropdownMenuItem
                                onClick={() => handleQuickStatusUpdate(order, 'processing')}
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Mark as Processing
                              </DropdownMenuItem>
                            )}
                            {order.status === 'processing' && (
                              <DropdownMenuItem
                                onClick={() => handleQuickStatusUpdate(order, 'shipped')}
                              >
                                <Truck className="h-4 w-4 mr-2" />
                                Mark as Shipped
                              </DropdownMenuItem>
                            )}
                            {order.status === 'shipped' && (
                              <DropdownMenuItem
                                onClick={() => handleQuickStatusUpdate(order, 'delivered')}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark as Delivered
                              </DropdownMenuItem>
                            )}
                            {order.status !== 'cancelled' && order.status !== 'delivered' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleQuickStatusUpdate(order, 'cancelled')}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancel Order
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <OrderDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        order={selectedOrder}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
}