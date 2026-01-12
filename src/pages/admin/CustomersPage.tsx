import { useEffect, useState } from 'react';
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Customer {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  status: 'active' | 'inactive' | 'blocked';
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  created_at: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter, searchQuery]);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const params = new URLSearchParams({
        status: statusFilter,
        ...(searchQuery ? { search: searchQuery } : {}),
      });

      const res = await fetch(`${API_URL}/api/admin/customers?${params}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setCustomers(result.data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesTier = tierFilter === 'all' || customer.tier === tierFilter;
    return matchesTier;
  });

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === 'active').length;
  const totalRevenue = customers.reduce((sum, c) => sum + Number(c.total_spent || 0), 0);
  const totalOrders = customers.reduce((sum, c) => sum + (c.total_orders || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

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

  const handleViewCustomer = async (customer: Customer) => {
    setDetailDialogOpen(true);
    // Fetch full customer details including orders
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`${API_URL}/api/admin/customers/${customer.id}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setSelectedCustomer({ ...customer, ...(result.data as any) });
        }
      } else {
        setSelectedCustomer(customer);
      }
    } catch (error) {
      console.error('Failed to fetch customer details:', error);
      setSelectedCustomer(customer);
    }
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
                          <AvatarImage src={customer.avatar_url} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {(customer.full_name || customer.email).split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{customer.full_name || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(customer.status)}</TableCell>
                    <TableCell>{getTierBadge(customer.tier)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        <span>{customer.total_orders}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${Number(customer.total_spent || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {customer.last_order_date ? new Date(customer.last_order_date).toLocaleDateString() : 'No orders yet'}
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
                    <AvatarImage src={selectedCustomer.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                      {(selectedCustomer.full_name || selectedCustomer.email).split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold">{selectedCustomer.full_name || 'N/A'}</h3>
                      {getStatusBadge(selectedCustomer.status)}
                      {getTierBadge(selectedCustomer.tier)}
                    </div>
                    <p className="text-muted-foreground">{selectedCustomer.email}</p>
                    <p className="text-sm text-muted-foreground">{selectedCustomer.phone || 'No phone'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Customer since</p>
                    <p className="font-medium">
                      {new Date(selectedCustomer.created_at).toLocaleDateString('en-US', {
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
                      <p className="text-2xl font-bold">{selectedCustomer.total_orders || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Orders</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold">
                        ${Number(selectedCustomer.total_spent || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Spent</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold">
                        ${selectedCustomer.total_orders > 0 ? (Number(selectedCustomer.total_spent) / selectedCustomer.total_orders).toFixed(2) : '0.00'}
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
                      {(selectedCustomer as any).orders?.length > 0 ? (
                        (selectedCustomer as any).orders.map((order: any) => (
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
