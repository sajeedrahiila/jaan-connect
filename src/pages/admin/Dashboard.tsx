import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  totalUsers: number;
  newUsersToday: number;
  totalProducts: number;
  totalOrders: number;
}

const statCards = [
  {
    title: 'Total Users',
    key: 'totalUsers' as const,
    icon: Users,
    color: 'bg-blue-500',
    trend: '+12%',
    trendUp: true,
  },
  {
    title: 'New Users Today',
    key: 'newUsersToday' as const,
    icon: TrendingUp,
    color: 'bg-green-500',
    trend: '+5%',
    trendUp: true,
  },
  {
    title: 'Products',
    key: 'totalProducts' as const,
    icon: Package,
    color: 'bg-purple-500',
    trend: '+3%',
    trendUp: true,
  },
  {
    title: 'Orders',
    key: 'totalOrders' as const,
    icon: ShoppingCart,
    color: 'bg-orange-500',
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
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total users count
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Get today's date for new users
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count: newUsersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today.toISOString());

        setStats({
          totalUsers: usersCount || 0,
          newUsersToday: newUsersCount || 0,
          totalProducts: 156, // Mock data - would come from products table
          totalOrders: 89, // Mock data - would come from orders table
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the admin portal</p>
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
            <Card className="hover-lift">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <card.icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <div className="h-8 w-20 bg-secondary animate-pulse rounded" />
                  ) : (
                    stats[card.key].toLocaleString()
                  )}
                </div>
                <div className="flex items-center mt-1 text-sm">
                  {card.trendUp ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={card.trendUp ? 'text-green-500' : 'text-red-500'}>
                    {card.trend}
                  </span>
                  <span className="text-muted-foreground ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              User activity will appear here once there are registered users.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <span className="text-sm font-medium">Manage Users</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <span className="text-sm font-medium">View Products</span>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <span className="text-sm font-medium">Process Orders</span>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
