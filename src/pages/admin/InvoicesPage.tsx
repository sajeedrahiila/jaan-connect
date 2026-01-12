import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  FileText,
  Download,
  Eye,
  Send,
  MoreVertical,
  Loader2,
  Plus,
  Calendar,
  DollarSign,
  Filter,
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
import { useToast } from '@/hooks/use-toast';
import { InvoiceDialog } from '@/components/admin/InvoiceDialog';
import { InvoiceViewer } from '@/components/admin/InvoiceViewer';
import { InvoiceEditDialog } from '@/components/admin/InvoiceEditDialog';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

interface Invoice {
  id: number;
  invoice_number: string;
  order_id?: number;
  customer_name: string;
  customer_email: string;
  subtotal: number;
  tax: number;
  shipping_fee: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  paid_date?: string;
  created_at: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [statsApi, setStatsApi] = useState<{ total_revenue: number; outstanding: number; sent_count: number; overdue_count: number } | null>(null);
  const [paidList, setPaidList] = useState<Invoice[]>([]);
  const [unpaidList, setUnpaidList] = useState<Invoice[]>([]);
  const [overdueList, setOverdueList] = useState<Invoice[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchInvoices();
    fetchStatsAndBuckets();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('session_token');
      const params = new URLSearchParams({
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        ...(searchQuery ? { search: searchQuery } : {}),
      });

      const res = await fetch(`${API_URL}/api/admin/invoices?${params}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setInvoices(result.data.data || result.data);
        }
      } else {
        throw new Error('Failed to fetch');
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch invoices',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsAndBuckets = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const headers: Record<string, string> = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const [statsRes, paidRes, unpaidRes, overdueRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/invoices/stats`, { headers, credentials: 'include' }),
        fetch(`${API_URL}/api/admin/invoices?status=paid&per_page=10`, { headers, credentials: 'include' }),
        fetch(`${API_URL}/api/admin/invoices?status=unpaid&per_page=10`, { headers, credentials: 'include' }),
        fetch(`${API_URL}/api/admin/invoices?status=overdue&per_page=10`, { headers, credentials: 'include' }),
      ]);

      if (statsRes.ok) {
        const s = await statsRes.json();
        if (s.success) setStatsApi(s.data);
      }
      if (paidRes.ok) {
        const p = await paidRes.json();
        setPaidList(p.data?.data || p.data || []);
      }
      if (unpaidRes.ok) {
        const u = await unpaidRes.json();
        setUnpaidList(u.data?.data || u.data || []);
      }
      if (overdueRes.ok) {
        const o = await overdueRes.json();
        setOverdueList(o.data?.data || o.data || []);
      }
    } catch (error) {
      console.error('Error fetching stats/buckets', error);
    }
  };

  const handleCreateInvoice = () => {
    setSelectedInvoice(null);
    setDialogOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setEditDialogOpen(true);
  };

  const handleViewInvoice = (id: number) => {
    setSelectedInvoiceId(id);
    setViewerOpen(true);
  };

  const handleSendInvoice = (id: number) => {
    toast({
      title: 'Invoice Sent',
      description: `Invoice will be sent to customer email`,
    });
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    const variants = {
      draft: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
      sent: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      paid: 'bg-green-100 text-green-800 hover:bg-green-100',
      overdue: 'bg-red-100 text-red-800 hover:bg-red-100',
      cancelled: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
    };

    return (
      <Badge className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customer_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: invoices.length,
    draft: invoices.filter((i) => i.status === 'draft').length,
    sent: invoices.filter((i) => i.status === 'sent').length,
    paid: invoices.filter((i) => i.status === 'paid').length,
    overdue: invoices.filter((i) => i.status === 'overdue').length,
    totalRevenue: statsApi ? statsApi.total_revenue : invoices
      .filter((i) => i.status === 'paid')
      .reduce((sum, i) => sum + Number(i.total), 0),
    outstanding: statsApi ? statsApi.outstanding : invoices
      .filter((i) => ['sent', 'overdue'].includes(i.status))
      .reduce((sum, i) => sum + Number(i.balance_due), 0),
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Manage and track invoices</p>
        </div>
        <Button onClick={handleCreateInvoice}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{stats.paid} paid invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.outstanding.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.sent + stats.overdue} unpaid invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <FileText className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
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
                placeholder="Search by invoice number, customer name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No invoices found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first invoice to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice, index) => (
                    <motion.tr
                      key={invoice.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <TableCell>
                        <div className="font-medium">{invoice.invoice_number}</div>
                        {invoice.order_id && (
                          <div className="text-xs text-muted-foreground">
                            Order #{invoice.order_id}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>{invoice.customer_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {invoice.customer_email}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(invoice.issue_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${Number(invoice.total).toFixed(2)}
                      </TableCell>
                      <TableCell
                        className={
                          Number(invoice.balance_due) > 0
                            ? 'font-medium text-orange-600'
                            : 'text-muted-foreground'
                        }
                      >
                        ${Number(invoice.balance_due).toFixed(2)}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewInvoice(invoice.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Edit Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewInvoice(invoice.id)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {invoice.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleSendInvoice(invoice.id)}>
                                <Send className="h-4 w-4 mr-2" />
                                Send to Customer
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive">
                              Cancel Invoice
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Columns */}
      <Card>
        <CardHeader>
          <CardTitle>By Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Paid */}
            <div>
              <h3 className="font-semibold mb-2">Paid</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paidList.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                        <TableCell className="text-sm">{inv.customer_name}</TableCell>
                        <TableCell className="font-medium">${Number(inv.total).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    {!paidList.length && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-muted-foreground text-sm">No paid invoices</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Unpaid */}
            <div>
              <h3 className="font-semibold mb-2">Unpaid</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unpaidList.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                        <TableCell className="text-sm">{inv.customer_name}</TableCell>
                        <TableCell className="font-medium text-orange-600">${Number(inv.balance_due).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    {!unpaidList.length && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-muted-foreground text-sm">No unpaid invoices</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Overdue */}
            <div>
              <h3 className="font-semibold mb-2">Overdue</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueList.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                        <TableCell className="text-sm text-red-600">{new Date(inv.due_date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium text-red-600">${Number(inv.balance_due).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    {!overdueList.length && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-muted-foreground text-sm">No overdue invoices</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Dialog */}
      <InvoiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        invoice={selectedInvoice}
        onSuccess={fetchInvoices}
      />

      {/* Invoice Viewer */}
      <InvoiceViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        invoiceId={selectedInvoiceId}
      />

      {/* Invoice Edit Dialog */}
      <InvoiceEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        invoice={selectedInvoice}
        onSuccess={fetchInvoices}
      />
    </div>
  );
}
