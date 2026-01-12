import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Activity,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  FileText,
  CreditCard,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Stats {
  totalUsers: number;
  newUsersToday: number;
  totalProducts: number;
  totalOrders: number;
  revenue: number;
  pendingOrders: number;
  totalInvoices?: number;
  invoiceRevenue?: number;
  receivables?: number;
  paidAmount?: number;
  overdueInvoices?: number;
}

interface RevenuePoint {
  label: string;
  revenue: number;
  orders: number;
}

interface CategoryBreakdown {
  name: string;
  sales: number;
  orders: number;
}

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
}

interface RecentOrder {
  id: number;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

interface ActivityItem {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  details: any;
  created_at: string;
}

const statCards = [
  {
    title: 'Total Revenue',
    key: 'revenue' as const,
    icon: DollarSign,
    color: 'bg-emerald-500',
    trend: '+18.2%',
    trendUp: true,
    prefix: '$',
  },
  {
    title: 'Accounts Receivable',
    key: 'receivables' as const,
    icon: CreditCard,
    color: 'bg-orange-500',
    trend: '',
    trendUp: true,
    prefix: '$',
  },
  {
    title: 'Total Invoices',
    key: 'totalInvoices' as const,
    icon: FileText,
    color: 'bg-purple-500',
    trend: '',
    trendUp: true,
  },
  {
    title: 'Pending Orders',
    key: 'pendingOrders' as const,
    icon: Clock,
    color: 'bg-amber-500',
    trend: '-2%',
    trendUp: false,
  },
];

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    newUsersToday: 0,
    totalProducts: 0,
    totalOrders: 0,
    revenue: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revenueTrend, setRevenueTrend] = useState<RevenuePoint[]>([]);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('session_token');
      
      const res = await fetch(`${API_URL}/api/admin/stats`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setStats({
            ...result.data,
            newUsersToday: 0, // Can add this to backend later
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`${API_URL}/api/admin/dashboard-data`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setRevenueTrend(result.data.revenueTrend || []);
          setCategories(result.data.categoryBreakdown || []);
          setTopProducts(result.data.topProducts || []);
          setRecentOrders(result.data.recentOrders || []);
          setRecentActivity(result.data.recentActivity || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const categoryColors = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#6366f1'];
  const maxProductRevenue = Math.max(...topProducts.map((p) => Number(p.revenue) || 0), 0) || 1;

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'update':
        return RefreshCw;
      case 'create':
      case 'insert':
        return CheckCircle;
      case 'delete':
        return AlertTriangle;
      default:
        return Activity;
    }
  };

  const formatActivityMessage = (activity: ActivityItem) => {
    if (activity.entity_type) {
      return `${activity.action} ${activity.entity_type} #${activity.entity_id || ''}`.trim();
    }
    return activity.action || 'Activity';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchStats} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link to="/admin/analytics">
            <Button size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold">
                      {loading ? (
                        <span className="inline-block h-8 w-20 bg-secondary animate-pulse rounded" />
                      ) : (
                        <>
                          {card.prefix || ''}{(stats[card.key] || 0).toLocaleString()}
                        </>
                      )}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${card.color}`}>
                    <card.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="flex items-center mt-3 text-sm">
                  {card.trend && (
                    <>
                      {card.trendUp ? (
                        <ArrowUpRight className="h-4 w-4 text-emerald-500 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={card.trendUp ? 'text-emerald-500' : 'text-red-500'}>
                        {card.trend}
                      </span>
                      <span className="text-muted-foreground ml-1">vs last month</span>
                    </>
                  )}
                </div>
              </CardContent>
              <div className={`absolute bottom-0 left-0 right-0 h-1 ${card.color}`} />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Invoice Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Invoice Revenue
                </p>
                <p className="text-2xl font-bold">
                  {loading ? (
                    <span className="inline-block h-8 w-20 bg-secondary animate-pulse rounded" />
                  ) : (
                    `$${(stats.invoiceRevenue || 0).toLocaleString()}`
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total billed amount
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500">
                <FileText className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Paid Amount
                </p>
                <p className="text-2xl font-bold">
                  {loading ? (
                    <span className="inline-block h-8 w-20 bg-secondary animate-pulse rounded" />
                  ) : (
                    `$${(stats.paidAmount || 0).toLocaleString()}`
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Successfully collected
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-500">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Overdue Invoices
                </p>
                <p className="text-2xl font-bold">
                  {loading ? (
                    <span className="inline-block h-8 w-20 bg-secondary animate-pulse rounded" />
                  ) : (
                    (stats.overdueInvoices || 0).toLocaleString()
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Requires attention
                </p>
              </div>
              <div className="p-3 rounded-xl bg-red-500">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Daily revenue for this week</CardDescription>
            </div>
            <Badge variant="secondary" className="font-normal">
              <TrendingUp className="h-3 w-3 mr-1" />
              +18.2%
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" stroke="hsl(var(--muted-foreground))" />
                  <YAxis className="text-xs" stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `$${value}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>Product category breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories.map((cat, idx) => ({ ...cat, color: categoryColors[idx % categoryColors.length] }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="sales"
                  >
                    {categories.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`$${Number(value).toFixed(2)}`, 'Sales']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {categories.map((cat, idx) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: categoryColors[idx % categoryColors.length] }} />
                  <span className="text-xs text-muted-foreground">{cat.name}</span>
                  <span className="text-xs font-medium ml-auto">${Number(cat.sales).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Best selling products this month</CardDescription>
            </div>
            <Link to="/admin/products">
              <Button variant="ghost" size="sm">
                View All
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <motion.div
                  key={product.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-5">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-medium truncate">{product.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium">${product.revenue.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground block">{product.sales} sales</span>
                    </div>
                  </div>
                  <Progress value={Math.min(100, (Number(product.revenue) / maxProductRevenue) * 100)} className="h-1.5" />
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest customer orders</CardDescription>
            </div>
            <Link to="/admin/orders">
              <Button variant="ghost" size="sm">
                View All
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {(order.customer_name || '').split(' ').map(n => n[0]).join('') || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{order.order_number || `#${order.id}`}</p>
                      <p className="text-xs text-muted-foreground">{order.customer_name || 'Unknown customer'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">${Number(order.total).toFixed(2)}</span>
                    <Badge className={`${getStatusColor(order.status)} capitalize text-xs`}>
                      {order.status}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest actions and updates</CardDescription>
          </div>
          <Link to="/admin/activity">
            <Button variant="ghost" size="sm">
              View All
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex items-start gap-4 pl-10"
                >
                  <div className="absolute left-0 p-2 rounded-full bg-card border border-border">
                    {(() => {
                      const Icon = getActivityIcon(activity.action);
                      return <Icon className="h-4 w-4 text-muted-foreground" />;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{formatActivityMessage(activity)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(activity.created_at).toLocaleString()}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}