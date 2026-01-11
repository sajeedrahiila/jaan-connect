import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Users,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  MoreVertical,
  Eye,
  Mail,
  Ban,
  UserCheck,
  ChevronDown,
  Calendar,
  Filter,
  Download,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

// Mock customer data
const mockCustomers = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1 (555) 123-4567',
    avatar: '',
    status: 'active',
    totalOrders: 24,
    totalSpent: 3450.00,
    lastOrder: '2026-01-08',
    joinDate: '2024-03-15',
    addresses: [
      { type: 'Home', address: '123 Main St, New York, NY 10001' },
      { type: 'Office', address: '456 Business Ave, Suite 100, New York, NY 10002' },
    ],
    orders: [
      { id: 'ORD-001', date: '2026-01-08', total: 125.00, status: 'delivered', items: 4 },
      { id: 'ORD-002', date: '2026-01-05', total: 89.99, status: 'delivered', items: 2 },
      { id: 'ORD-003', date: '2025-12-28', total: 245.50, status: 'delivered', items: 6 },
      { id: 'ORD-004', date: '2025-12-15', total: 67.00, status: 'delivered', items: 3 },
    ],
    tier: 'Gold',
    notes: 'VIP customer, prefers express shipping.',
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    phone: '+1 (555) 234-5678',
    avatar: '',
    status: 'active',
    totalOrders: 18,
    totalSpent: 2890.50,
    lastOrder: '2026-01-10',
    joinDate: '2024-06-20',
    addresses: [
      { type: 'Home', address: '789 Oak Lane, Los Angeles, CA 90001' },
    ],
    orders: [
      { id: 'ORD-010', date: '2026-01-10', total: 156.00, status: 'processing', items: 5 },
      { id: 'ORD-011', date: '2026-01-02', total: 234.50, status: 'delivered', items: 8 },
    ],
    tier: 'Silver',
    notes: '',
  },
  {
    id: 3,
    name: 'Michael Brown',
    email: 'm.brown@example.com',
    phone: '+1 (555) 345-6789',
    avatar: '',
    status: 'active',
    totalOrders: 42,
    totalSpent: 6780.25,
    lastOrder: '2026-01-09',
    joinDate: '2023-11-10',
    addresses: [
      { type: 'Home', address: '321 Pine Street, Chicago, IL 60601' },
    ],
    orders: [
      { id: 'ORD-020', date: '2026-01-09', total: 312.00, status: 'shipped', items: 10 },
    ],
    tier: 'Platinum',
    notes: 'Wholesale buyer, eligible for bulk discounts.',
  },
  {
    id: 4,
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    phone: '+1 (555) 456-7890',
    avatar: '',
    status: 'inactive',
    totalOrders: 5,
    totalSpent: 450.00,
    lastOrder: '2025-08-15',
    joinDate: '2025-02-28',
    addresses: [
      { type: 'Home', address: '654 Elm Road, Houston, TX 77001' },
    ],
    orders: [
      { id: 'ORD-030', date: '2025-08-15', total: 78.00, status: 'delivered', items: 2 },
    ],
    tier: 'Bronze',
    notes: '',
  },
  {
    id: 5,
    name: 'Robert Wilson',
    email: 'r.wilson@example.com',
    phone: '+1 (555) 567-8901',
    avatar: '',
    status: 'blocked',
    totalOrders: 3,
    totalSpent: 125.00,
    lastOrder: '2025-06-20',
    joinDate: '2025-05-10',
    addresses: [],
    orders: [
      { id: 'ORD-040', date: '2025-06-20', total: 45.00, status: 'cancelled', items: 1 },
    ],
    tier: 'Bronze',
    notes: 'Account suspended due to payment issues.',
  },
  {
    id: 6,
    name: 'Amanda Martinez',
    email: 'a.martinez@example.com',
    phone: '+1 (555) 678-9012',
    avatar: '',
    status: 'active',
    totalOrders: 31,
    totalSpent: 4200.75,
    lastOrder: '2026-01-11',
    joinDate: '2024-01-05',
    addresses: [
      { type: 'Home', address: '987 Cedar Blvd, Miami, FL 33101' },
      { type: 'Work', address: '111 Commerce St, Miami, FL 33102' },
    ],
    orders: [
      { id: 'ORD-050', date: '2026-01-11', total: 189.00, status: 'pending', items: 6 },
      { id: 'ORD-051', date: '2026-01-07', total: 95.50, status: 'delivered', items: 3 },
    ],
    tier: 'Gold',
    notes: 'Prefers organic products only.',
  },
];

type Customer = typeof mockCustomers[0];

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const filteredCustomers = mockCustomers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    const matchesTier = tierFilter === 'all' || customer.tier === tierFilter;
    return matchesSearch && matchesStatus && matchesTier;
  });

  const totalCustomers = mockCustomers.length;
  const activeCustomers = mockCustomers.filter((c) => c.status === 'active').length;
  const totalRevenue = mockCustomers.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgOrderValue = totalRevenue / mockCustomers.reduce((sum, c) => sum + c.totalOrders, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Inactive</Badge>;
      case 'blocked':
        return <Badge variant="destructive">Blocked</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'Platinum':
        return <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">Platinum</Badge>;
      case 'Gold':
        return <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white">Gold</Badge>;
      case 'Silver':
        return <Badge className="bg-gradient-to-r from-gray-400 to-gray-500 text-white">Silver</Badge>;
      default:
        return <Badge className="bg-gradient-to-r from-amber-700 to-amber-800 text-white">Bronze</Badge>;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Pending</Badge>;
      case 'processing':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">Processing</Badge>;
      case 'shipped':
        return <Badge variant="outline" className="border-purple-500 text-purple-700">Shipped</Badge>;
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailDialogOpen(true);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTierFilter('all');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || tierFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage customer relationships and analytics</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{totalCustomers}</p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Customers</p>
                <p className="text-2xl font-bold">{activeCustomers}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                <p className="text-2xl font-bold">${avgOrderValue.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500 opacity-50" />
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
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="Platinum">Platinum</SelectItem>
                <SelectItem value="Gold">Gold</SelectItem>
                <SelectItem value="Silver">Silver</SelectItem>
                <SelectItem value="Bronze">Bronze</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="gap-2">
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Last Order</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer, index) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleViewCustomer(customer)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={customer.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {customer.name.split(' ').map((n) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(customer.status)}</TableCell>
                    <TableCell>{getTierBadge(customer.tier)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        <span>{customer.totalOrders}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${customer.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(customer.lastOrder).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewCustomer(customer)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {customer.status !== 'blocked' ? (
                            <DropdownMenuItem className="text-destructive">
                              <Ban className="h-4 w-4 mr-2" />
                              Block Customer
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-green-600">
                              <UserCheck className="h-4 w-4 mr-2" />
                              Unblock Customer
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Customer Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle>Customer Details</DialogTitle>
                <DialogDescription>
                  View complete customer information and order history
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Customer Header */}
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedCustomer.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                      {selectedCustomer.name.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold">{selectedCustomer.name}</h3>
                      {getStatusBadge(selectedCustomer.status)}
                      {getTierBadge(selectedCustomer.tier)}
                    </div>
                    <p className="text-muted-foreground">{selectedCustomer.email}</p>
                    <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Customer since</p>
                    <p className="font-medium">
                      {new Date(selectedCustomer.joinDate).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold">{selectedCustomer.totalOrders}</p>
                      <p className="text-sm text-muted-foreground">Total Orders</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold">
                        ${selectedCustomer.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Spent</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold">
                        ${(selectedCustomer.totalSpent / selectedCustomer.totalOrders).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="orders" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="orders">Order History</TabsTrigger>
                    <TabsTrigger value="addresses">Addresses</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  </TabsList>

                  <TabsContent value="orders" className="mt-4">
                    <div className="space-y-3">
                      {selectedCustomer.orders.length > 0 ? (
                        selectedCustomer.orders.map((order) => (
                          <div
                            key={order.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <ShoppingBag className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{order.id}</p>
                                <p className="text-sm text-muted-foreground">
                                  {order.items} items • {new Date(order.date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <p className="font-medium">${order.total.toFixed(2)}</p>
                              {getOrderStatusBadge(order.status)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No orders yet</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="addresses" className="mt-4">
                    <div className="space-y-3">
                      {selectedCustomer.addresses.length > 0 ? (
                        selectedCustomer.addresses.map((addr, index) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <Badge variant="outline" className="mb-2">
                              {addr.type}
                            </Badge>
                            <p className="text-muted-foreground">{addr.address}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No addresses saved</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="analytics" className="mt-4">
                    <div className="space-y-4">
                      {/* Spending Progress */}
                      <Card>
                        <CardContent className="pt-4">
                          <div className="flex justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Progress to next tier</span>
                            <span className="text-sm font-medium">
                              ${selectedCustomer.totalSpent.toFixed(0)} / $5,000
                            </span>
                          </div>
                          <Progress
                            value={Math.min((selectedCustomer.totalSpent / 5000) * 100, 100)}
                            className="h-2"
                          />
                        </CardContent>
                      </Card>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                          <p className="text-sm text-muted-foreground">Orders per month</p>
                          <p className="text-xl font-bold">
                            {(selectedCustomer.totalOrders / 12).toFixed(1)}
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <p className="text-sm text-muted-foreground">Days since last order</p>
                          <p className="text-xl font-bold">
                            {Math.floor(
                              (new Date().getTime() - new Date(selectedCustomer.lastOrder).getTime()) /
                                (1000 * 60 * 60 * 24)
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Notes */}
                      {selectedCustomer.notes && (
                        <div className="p-4 border rounded-lg bg-muted/50">
                          <p className="text-sm font-medium mb-1">Notes</p>
                          <p className="text-muted-foreground">{selectedCustomer.notes}</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
