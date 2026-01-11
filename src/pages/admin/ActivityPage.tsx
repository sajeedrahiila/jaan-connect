import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Search,
  Filter,
  ShoppingCart,
  Users,
  Package,
  Settings,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Calendar,
  User,
  Edit,
  Trash2,
  Eye,
  LogIn,
  LogOut,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ActivityLog {
  id: number;
  type: 'order' | 'user' | 'product' | 'security' | 'system' | 'admin';
  action: string;
  description: string;
  user: string;
  userEmail: string;
  timestamp: string;
  ip?: string;
  details?: string;
  severity: 'info' | 'warning' | 'success' | 'error';
}

const mockActivities: ActivityLog[] = [
  {
    id: 1,
    type: 'order',
    action: 'Order Created',
    description: 'New order #ORD-156 placed by customer',
    user: 'Sarah Wilson',
    userEmail: 'sarah@example.com',
    timestamp: '2024-01-10T14:32:00Z',
    severity: 'success',
    details: 'Order total: $245.99, Items: 5',
  },
  {
    id: 2,
    type: 'user',
    action: 'User Registered',
    description: 'New user account created',
    user: 'John Smith',
    userEmail: 'john@example.com',
    timestamp: '2024-01-10T13:45:00Z',
    severity: 'info',
    ip: '192.168.1.100',
  },
  {
    id: 3,
    type: 'security',
    action: 'Failed Login Attempt',
    description: 'Multiple failed login attempts detected',
    user: 'Unknown',
    userEmail: 'admin@store.com',
    timestamp: '2024-01-10T12:20:00Z',
    severity: 'warning',
    ip: '45.33.22.11',
    details: '5 failed attempts in 10 minutes',
  },
  {
    id: 4,
    type: 'product',
    action: 'Product Updated',
    description: 'Product "Organic Honey" price updated',
    user: 'Admin',
    userEmail: 'admin@store.com',
    timestamp: '2024-01-10T11:15:00Z',
    severity: 'info',
    details: 'Price changed from $16.99 to $18.99',
  },
  {
    id: 5,
    type: 'order',
    action: 'Order Shipped',
    description: 'Order #ORD-152 marked as shipped',
    user: 'Admin',
    userEmail: 'admin@store.com',
    timestamp: '2024-01-10T10:30:00Z',
    severity: 'success',
    details: 'Tracking number: TRK-789456',
  },
  {
    id: 6,
    type: 'system',
    action: 'Low Stock Alert',
    description: 'Product "Green Tea Premium" is low on stock',
    user: 'System',
    userEmail: 'system',
    timestamp: '2024-01-10T09:00:00Z',
    severity: 'warning',
    details: 'Current stock: 15 units, Threshold: 20 units',
  },
  {
    id: 7,
    type: 'admin',
    action: 'Role Changed',
    description: 'User role updated to moderator',
    user: 'Super Admin',
    userEmail: 'superadmin@store.com',
    timestamp: '2024-01-10T08:45:00Z',
    severity: 'info',
    details: 'User: mike@example.com changed from user to moderator',
  },
  {
    id: 8,
    type: 'product',
    action: 'Product Created',
    description: 'New product "Organic Quinoa" added',
    user: 'Admin',
    userEmail: 'admin@store.com',
    timestamp: '2024-01-09T16:20:00Z',
    severity: 'success',
    details: 'SKU: QUI-001, Price: $12.99',
  },
  {
    id: 9,
    type: 'order',
    action: 'Order Cancelled',
    description: 'Order #ORD-148 cancelled by customer',
    user: 'Tom Wilson',
    userEmail: 'tom@example.com',
    timestamp: '2024-01-09T15:10:00Z',
    severity: 'error',
    details: 'Reason: Changed mind',
  },
  {
    id: 10,
    type: 'security',
    action: 'Admin Login',
    description: 'Admin user logged in successfully',
    user: 'Admin',
    userEmail: 'admin@store.com',
    timestamp: '2024-01-09T14:00:00Z',
    severity: 'info',
    ip: '192.168.1.1',
  },
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'order': return ShoppingCart;
    case 'user': return Users;
    case 'product': return Package;
    case 'security': return Shield;
    case 'system': return Settings;
    case 'admin': return User;
    default: return Activity;
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'success': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'warning': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'error': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-blue-100 text-blue-700 border-blue-200';
  }
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'success': return CheckCircle;
    case 'warning': return AlertTriangle;
    case 'error': return Trash2;
    default: return Activity;
  }
};

export default function ActivityPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const filteredActivities = mockActivities.filter((activity) => {
    const matchesSearch =
      activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.user.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || activity.type === typeFilter;
    const matchesSeverity = severityFilter === 'all' || activity.severity === severityFilter;
    return matchesSearch && matchesType && matchesSeverity;
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hours ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const activityStats = {
    total: mockActivities.length,
    today: mockActivities.filter((a) => new Date(a.timestamp).toDateString() === new Date().toDateString()).length,
    warnings: mockActivities.filter((a) => a.severity === 'warning').length,
    errors: mockActivities.filter((a) => a.severity === 'error').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Activity Log
          </h1>
          <p className="text-muted-foreground">Track all actions and events in your store</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{activityStats.total}</p>
              </div>
              <Activity className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">{activityStats.today}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold">{activityStats.warnings}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold">{activityStats.errors}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500 opacity-50" />
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
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="order">Orders</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="product">Products</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>
            Showing {filteredActivities.length} of {mockActivities.length} events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-6">
              {filteredActivities.map((activity, index) => {
                const TypeIcon = getTypeIcon(activity.type);
                const SeverityIcon = getSeverityIcon(activity.severity);
                
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative flex gap-4 pl-14"
                  >
                    <div className={`absolute left-0 p-2 rounded-full border-2 bg-card ${getSeverityColor(activity.severity)}`}>
                      <TypeIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 bg-secondary/30 rounded-lg p-4 hover:bg-secondary/50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{activity.action}</span>
                          <Badge variant="outline" className={getSeverityColor(activity.severity)}>
                            {activity.severity}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(activity.timestamp)}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                              {activity.user.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{activity.user}</span>
                        </div>
                        {activity.ip && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">IP:</span>
                            <code className="bg-secondary px-1 rounded">{activity.ip}</code>
                          </div>
                        )}
                        {activity.details && (
                          <span className="text-muted-foreground">{activity.details}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
          
          {filteredActivities.length === 0 && (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No activities found</h3>
              <p className="text-muted-foreground">Try adjusting your filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}