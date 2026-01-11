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
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  totalUsers: number;
  newUsersToday: number;
  totalProducts: number;
  totalOrders: number;
  revenue: number;
  pendingOrders: number;
}

// Mock data for charts
const revenueData = [
  { name: 'Mon', revenue: 4500, orders: 12 },
  { name: 'Tue', revenue: 5200, orders: 18 },
  { name: 'Wed', revenue: 4800, orders: 15 },
  { name: 'Thu', revenue: 6100, orders: 22 },
  { name: 'Fri', revenue: 5800, orders: 19 },
  { name: 'Sat', revenue: 7200, orders: 28 },
  { name: 'Sun', revenue: 6500, orders: 24 },
];

const categoryData = [
  { name: 'Grains', value: 35, color: 'hsl(var(--primary))' },
  { name: 'Oils', value: 25, color: 'hsl(var(--accent))' },
  { name: 'Beverages', value: 20, color: '#10b981' },
  { name: 'Sweeteners', value: 15, color: '#f59e0b' },
  { name: 'Others', value: 5, color: '#6366f1' },
];

const recentActivity = [
  { id: 1, type: 'order', message: 'New order #ORD-156 placed', time: '2 min ago', icon: ShoppingCart },
  { id: 2, type: 'user', message: 'New user registered: john@example.com', time: '15 min ago', icon: Users },
  { id: 3, type: 'stock', message: 'Low stock alert: Green Tea Premium', time: '1 hour ago', icon: AlertTriangle },
  { id: 4, type: 'order', message: 'Order #ORD-152 delivered', time: '2 hours ago', icon: CheckCircle },
  { id: 5, type: 'product', message: 'Product updated: Organic Honey', time: '3 hours ago', icon: Package },
];

const topProducts = [
  { name: 'Premium Basmati Rice', sales: 124, revenue: 11155, progress: 100 },
  { name: 'Organic Whole Wheat Flour', sales: 98, revenue: 4410, progress: 79 },
  { name: 'Cold Pressed Coconut Oil', sales: 87, revenue: 2132, progress: 70 },
  { name: 'Organic Honey', sales: 76, revenue: 1443, progress: 61 },
  { name: 'Green Tea Premium', sales: 65, revenue: 2080, progress: 52 },
];

const recentOrders = [
  { id: 'ORD-156', customer: 'Sarah Wilson', total: 245.99, status: 'pending' },
  { id: 'ORD-155', customer: 'Mike Johnson', total: 189.50, status: 'processing' },
  { id: 'ORD-154', customer: 'Emily Brown', total: 520.00, status: 'shipped' },
  { id: 'ORD-153', customer: 'Tom Davis', total: 89.99, status: 'delivered' },
];

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
    title: 'Total Users',
    key: 'totalUsers' as const,
    icon: Users,
    color: 'bg-blue-500',
    trend: '+12%',
    trendUp: true,
  },
  {
    title: 'Total Orders',
    key: 'totalOrders' as const,
    icon: ShoppingCart,
    color: 'bg-violet-500',
    trend: '+8.5%',
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
    totalProducts: 156,
    totalOrders: 89,
    revenue: 45230,
    pendingOrders: 12,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: newUsersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      setStats((prev) => ({
        ...prev,
        totalUsers: usersCount || 0,
        newUsersToday: newUsersCount || 0,
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-secondary text-secondary-foreground';
    }
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
                          {card.prefix || ''}{stats[card.key].toLocaleString()}
                        </>
                      )}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${card.color}`}>
                    <card.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="flex items-center mt-3 text-sm">
                  {card.trendUp ? (
                    <ArrowUpRight className="h-4 w-4 text-emerald-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={card.trendUp ? 'text-emerald-500' : 'text-red-500'}>
                    {card.trend}
                  </span>
                  <span className="text-muted-foreground ml-1">vs last month</span>
                </div>
              </CardContent>
              <div className={`absolute bottom-0 left-0 right-0 h-1 ${card.color}`} />
            </Card>
          </motion.div>
        ))}
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
                <AreaChart data={revenueData}>
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
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value}%`, 'Share']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {categoryData.map((cat) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-xs text-muted-foreground">{cat.name}</span>
                  <span className="text-xs font-medium ml-auto">{cat.value}%</span>
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
                  <Progress value={product.progress} className="h-1.5" />
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
                        {order.customer.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{order.id}</p>
                      <p className="text-xs text-muted-foreground">{order.customer}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">${order.total.toFixed(2)}</span>
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
                    <activity.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
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