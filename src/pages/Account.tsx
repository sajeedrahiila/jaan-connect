import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogOut, Package, FileText, Eye, Download, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useAuth-local';

interface Order {
  id: number;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  customer_name: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  status: string;
  total: number;
  balance_due: number;
  issue_date: string;
  due_date: string;
  order_id?: number;
}

const Account = () => {
  const navigate = useNavigate();
  const { user, signOut } = useSupabaseAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchOrders();
    fetchInvoices();
  }, [user, navigate]);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const token = localStorage.getItem('session_token');
      const res = await fetch(`${API_URL}/api/orders`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(data.data.data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load orders',
        variant: 'destructive',
      });
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoadingInvoices(true);
      const token = localStorage.getItem('session_token');
      const res = await fetch(`${API_URL}/api/user/invoices`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.status === 404) {
        setInvoices([]);
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch invoices');
      const data = await res.json();
      setInvoices(data.data?.data || []);
    } catch (error) {
      // Invoices endpoint may not exist yet, that's ok
      setInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'paid':
        return 'bg-green-500/10 text-green-700';
      case 'pending':
      case 'draft':
        return 'bg-yellow-500/10 text-yellow-700';
      case 'processing':
        return 'bg-blue-500/10 text-blue-700';
      case 'cancelled':
      case 'overdue':
        return 'bg-red-500/10 text-red-700';
      default:
        return 'bg-gray-500/10 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'paid':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'pending':
      case 'draft':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="py-12 lg:py-16">
        <div className="container-wide">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold mb-2">My Account</h1>
              <p className="text-muted-foreground">Welcome back, {user.full_name || user.email}</p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </motion.div>

          {/* Account Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{orders.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {formatCurrency(orders.reduce((sum, o) => sum + Number(o.total), 0))}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{invoices.length}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tabs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Tabs defaultValue="orders" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="orders" className="gap-2">
                  <Package className="h-4 w-4" />
                  Order History
                </TabsTrigger>
                <TabsTrigger value="invoices" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Invoices
                </TabsTrigger>
              </TabsList>

              {/* Orders Tab */}
              <TabsContent value="orders" className="space-y-4">
                {loadingOrders ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : orders.length === 0 ? (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                        <p className="text-muted-foreground mb-4">
                          You haven't placed any orders. Start shopping to see your orders here.
                        </p>
                        <Button asChild>
                          <a href="/products">Browse Products</a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Order History</CardTitle>
                      <CardDescription>View and track your orders</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Order Number</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {orders.map((order) => (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium">{order.order_number}</TableCell>
                                <TableCell>{formatDate(order.created_at)}</TableCell>
                                <TableCell>{formatCurrency(Number(order.total))}</TableCell>
                                <TableCell>
                                  <Badge className={`gap-1 ${getStatusColor(order.status)}`}>
                                    {getStatusIcon(order.status)}
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedOrder(order);
                                      setShowOrderDetails(true);
                                    }}
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
                )}
              </TabsContent>

              {/* Invoices Tab */}
              <TabsContent value="invoices" className="space-y-4">
                {loadingInvoices ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : invoices.length === 0 ? (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No invoices yet</h3>
                        <p className="text-muted-foreground">Your invoices will appear here once you place an order.</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Invoices</CardTitle>
                      <CardDescription>Download and manage your invoices</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Invoice Number</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Balance Due</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invoices.map((invoice) => (
                              <TableRow key={invoice.id}>
                                <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                                <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                                <TableCell>{formatCurrency(Number(invoice.total))}</TableCell>
                                <TableCell>{formatCurrency(Number(invoice.balance_due))}</TableCell>
                                <TableCell>
                                  <Badge className={`gap-1 ${getStatusColor(invoice.status)}`}>
                                    {getStatusIcon(invoice.status)}
                                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setSelectedInvoice(invoice);
                                        setShowInvoiceDetails(true);
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost">
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Order Details Modal */}
          {showOrderDetails && selectedOrder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowOrderDetails(false)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Order {selectedOrder.order_number}</h2>
                    <p className="text-muted-foreground">Placed on {formatDate(selectedOrder.created_at)}</p>
                  </div>
                  <Badge className={`gap-1 ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusIcon(selectedOrder.status)}
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-semibold mb-2">Order Summary</h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">Order ID: {selectedOrder.id}</p>
                      <p className="text-muted-foreground">Name: {selectedOrder.customer_name}</p>
                      <p className="text-2xl font-bold mt-3">{formatCurrency(Number(selectedOrder.total))}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Order Status Timeline</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Order Placed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span>Processing</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowOrderDetails(false)}>
                    Close
                  </Button>
                  <Button>Download Invoice</Button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Invoice Details Modal */}
          {showInvoiceDetails && selectedInvoice && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowInvoiceDetails(false)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Invoice {selectedInvoice.invoice_number}</h2>
                    <p className="text-muted-foreground">Issued on {formatDate(selectedInvoice.issue_date)}</p>
                  </div>
                  <Badge className={`gap-1 ${getStatusColor(selectedInvoice.status)}`}>
                    {getStatusIcon(selectedInvoice.status)}
                    {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-semibold mb-2">Invoice Details</h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">Invoice ID: {selectedInvoice.id}</p>
                      <p className="text-muted-foreground">Due Date: {formatDate(selectedInvoice.due_date)}</p>
                      <p className="text-2xl font-bold mt-3">{formatCurrency(Number(selectedInvoice.total))}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Payment Status</h3>
                    <div className="space-y-2 text-sm">
                      <p className="text-muted-foreground">Amount Due: {formatCurrency(Number(selectedInvoice.balance_due))}</p>
                      <p className="text-muted-foreground">Amount Paid: {formatCurrency(Number(selectedInvoice.total) - Number(selectedInvoice.balance_due))}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowInvoiceDetails(false)}>
                    Close
                  </Button>
                  <Button>Download PDF</Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Account;
