import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package,
  Bell,
  RefreshCw,
  Download,
  Filter,
  ArrowUpDown,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  Boxes,
  Truck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

// Mock inventory data with sales velocity
const mockInventory = [
  {
    id: 1,
    name: 'Organic Whole Wheat Flour',
    sku: 'FLR-001',
    currentStock: 45,
    minStock: 50,
    maxStock: 300,
    reorderPoint: 75,
    reorderQty: 100,
    avgDailySales: 8.5,
    lastRestocked: '2026-01-05',
    supplier: 'Organic Mills Co.',
    unitCost: 35.00,
    category: 'Grains',
    location: 'Warehouse A - Shelf 1',
  },
  {
    id: 2,
    name: 'Premium Basmati Rice (25kg)',
    sku: 'RIC-002',
    currentStock: 180,
    minStock: 50,
    maxStock: 400,
    reorderPoint: 100,
    reorderQty: 150,
    avgDailySales: 5.2,
    lastRestocked: '2026-01-08',
    supplier: 'Golden Harvest Ltd.',
    unitCost: 65.00,
    category: 'Grains',
    location: 'Warehouse A - Shelf 2',
  },
  {
    id: 3,
    name: 'Cold Pressed Coconut Oil',
    sku: 'OIL-003',
    currentStock: 0,
    minStock: 30,
    maxStock: 200,
    reorderPoint: 50,
    reorderQty: 80,
    avgDailySales: 3.8,
    lastRestocked: '2025-12-20',
    supplier: 'Tropical Oils Inc.',
    unitCost: 18.00,
    category: 'Cooking Oils',
    location: 'Warehouse B - Shelf 1',
  },
  {
    id: 4,
    name: 'Organic Honey (500g)',
    sku: 'HON-004',
    currentStock: 75,
    minStock: 25,
    maxStock: 150,
    reorderPoint: 40,
    reorderQty: 50,
    avgDailySales: 2.1,
    lastRestocked: '2026-01-03',
    supplier: 'Nature\'s Best Apiaries',
    unitCost: 12.00,
    category: 'Sweeteners',
    location: 'Warehouse B - Shelf 3',
  },
  {
    id: 5,
    name: 'Green Tea Premium Pack',
    sku: 'TEA-005',
    currentStock: 15,
    minStock: 20,
    maxStock: 100,
    reorderPoint: 30,
    reorderQty: 40,
    avgDailySales: 4.2,
    lastRestocked: '2025-12-28',
    supplier: 'Asian Tea Traders',
    unitCost: 22.00,
    category: 'Beverages',
    location: 'Warehouse A - Shelf 5',
  },
  {
    id: 6,
    name: 'Extra Virgin Olive Oil',
    sku: 'OIL-006',
    currentStock: 92,
    minStock: 40,
    maxStock: 250,
    reorderPoint: 60,
    reorderQty: 100,
    avgDailySales: 6.3,
    lastRestocked: '2026-01-10',
    supplier: 'Mediterranean Imports',
    unitCost: 28.00,
    category: 'Cooking Oils',
    location: 'Warehouse B - Shelf 1',
  },
  {
    id: 7,
    name: 'Quinoa Organic (1kg)',
    sku: 'GRN-007',
    currentStock: 28,
    minStock: 30,
    maxStock: 120,
    reorderPoint: 45,
    reorderQty: 60,
    avgDailySales: 2.8,
    lastRestocked: '2026-01-02',
    supplier: 'Andean Superfoods',
    unitCost: 45.00,
    category: 'Grains',
    location: 'Warehouse A - Shelf 3',
  },
  {
    id: 8,
    name: 'Almond Butter (340g)',
    sku: 'NUT-008',
    currentStock: 156,
    minStock: 35,
    maxStock: 200,
    reorderPoint: 50,
    reorderQty: 75,
    avgDailySales: 1.9,
    lastRestocked: '2026-01-09',
    supplier: 'Nutty Delights Co.',
    unitCost: 15.00,
    category: 'Spreads',
    location: 'Warehouse C - Shelf 2',
  },
];

type InventoryItem = typeof mockInventory[0];

// Stock alert types
interface StockAlert {
  id: number;
  type: 'out_of_stock' | 'low_stock' | 'below_reorder';
  item: InventoryItem;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  createdAt: string;
  acknowledged: boolean;
}

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [reorderDialogOpen, setReorderDialogOpen] = useState(false);
  const [alertsDialogOpen, setAlertsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Calculate stock status for each item
  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) return 'out_of_stock';
    if (item.currentStock <= item.minStock) return 'critical';
    if (item.currentStock <= item.reorderPoint) return 'low';
    return 'healthy';
  };

  // Calculate days until stockout
  const getDaysUntilStockout = (item: InventoryItem) => {
    if (item.avgDailySales === 0) return Infinity;
    return Math.floor(item.currentStock / item.avgDailySales);
  };

  // Calculate reorder suggestion
  const getReorderSuggestion = (item: InventoryItem) => {
    const daysToStockout = getDaysUntilStockout(item);
    const leadTimeDays = 7; // Assume 7 days lead time
    
    if (daysToStockout <= leadTimeDays || item.currentStock <= item.reorderPoint) {
      // Calculate optimal order quantity based on sales velocity
      const safetyStock = Math.ceil(item.avgDailySales * 14); // 2 weeks safety
      const orderUpToLevel = item.maxStock;
      const suggestedQty = Math.max(item.reorderQty, orderUpToLevel - item.currentStock);
      
      return {
        shouldReorder: true,
        suggestedQty,
        urgency: daysToStockout <= 3 ? 'urgent' : daysToStockout <= 7 ? 'soon' : 'planned',
        estimatedCost: suggestedQty * item.unitCost,
      };
    }
    
    return { shouldReorder: false, suggestedQty: 0, urgency: 'none', estimatedCost: 0 };
  };

  // Generate stock alerts
  const stockAlerts = useMemo<StockAlert[]>(() => {
    const alerts: StockAlert[] = [];
    
    mockInventory.forEach((item) => {
      const status = getStockStatus(item);
      const daysLeft = getDaysUntilStockout(item);
      
      if (status === 'out_of_stock') {
        alerts.push({
          id: alerts.length + 1,
          type: 'out_of_stock',
          item,
          message: `${item.name} is out of stock! Immediate reorder required.`,
          severity: 'critical',
          createdAt: new Date().toISOString(),
          acknowledged: false,
        });
      } else if (status === 'critical') {
        alerts.push({
          id: alerts.length + 1,
          type: 'low_stock',
          item,
          message: `${item.name} is critically low (${item.currentStock} units). ${daysLeft} days until stockout.`,
          severity: 'critical',
          createdAt: new Date().toISOString(),
          acknowledged: false,
        });
      } else if (status === 'low') {
        alerts.push({
          id: alerts.length + 1,
          type: 'below_reorder',
          item,
          message: `${item.name} is below reorder point (${item.currentStock}/${item.reorderPoint}). Consider reordering.`,
          severity: 'warning',
          createdAt: new Date().toISOString(),
          acknowledged: false,
        });
      }
    });
    
    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, []);

  // Items needing reorder
  const reorderItems = useMemo(() => {
    return mockInventory
      .map((item) => ({ item, suggestion: getReorderSuggestion(item) }))
      .filter(({ suggestion }) => suggestion.shouldReorder)
      .sort((a, b) => {
        const urgencyOrder = { urgent: 0, soon: 1, planned: 2, none: 3 };
        return urgencyOrder[a.suggestion.urgency as keyof typeof urgencyOrder] - 
               urgencyOrder[b.suggestion.urgency as keyof typeof urgencyOrder];
      });
  }, []);

  // Filter inventory
  const filteredInventory = mockInventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    
    const status = getStockStatus(item);
    if (statusFilter === 'out_of_stock') return matchesSearch && status === 'out_of_stock';
    if (statusFilter === 'low') return matchesSearch && (status === 'critical' || status === 'low');
    if (statusFilter === 'healthy') return matchesSearch && status === 'healthy';
    
    return matchesSearch;
  });

  // Stats
  const totalItems = mockInventory.length;
  const outOfStockCount = mockInventory.filter((i) => getStockStatus(i) === 'out_of_stock').length;
  const lowStockCount = mockInventory.filter((i) => ['critical', 'low'].includes(getStockStatus(i))).length;
  const totalValue = mockInventory.reduce((sum, i) => sum + i.currentStock * i.unitCost, 0);

  const getStatusBadge = (item: InventoryItem) => {
    const status = getStockStatus(item);
    switch (status) {
      case 'out_of_stock':
        return <Badge variant="destructive">Out of Stock</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Critical</Badge>;
      case 'low':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Low Stock</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Healthy</Badge>;
    }
  };

  const getStockPercentage = (item: InventoryItem) => {
    return Math.min((item.currentStock / item.maxStock) * 100, 100);
  };

  const handleViewItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setDetailDialogOpen(true);
  };

  const handleCreateReorder = () => {
    toast({
      title: 'Reorder created',
      description: `Purchase orders have been generated for ${reorderItems.length} items.`,
    });
    setReorderDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Monitor stock levels and manage reorders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAlertsDialogOpen(true)} className="relative">
            <Bell className="h-4 w-4 mr-2" />
            Alerts
            {stockAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                {stockAlerts.length}
              </span>
            )}
          </Button>
          <Button onClick={() => setReorderDialogOpen(true)} disabled={reorderItems.length === 0}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Reorder ({reorderItems.length})
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total SKUs</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
              <Boxes className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-destructive">{outOfStockCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{lowStockCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inventory Value</p>
                <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-emerald-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts Banner */}
      {stockAlerts.filter((a) => a.severity === 'critical').length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-destructive">Critical Stock Alerts</h3>
                <p className="text-sm text-muted-foreground">
                  {stockAlerts.filter((a) => a.severity === 'critical').length} items require immediate attention
                </p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => setAlertsDialogOpen(true)}>
                View All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="healthy">Healthy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory ({filteredInventory.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Daily Sales</TableHead>
                  <TableHead>Days Left</TableHead>
                  <TableHead>Reorder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item, index) => {
                  const daysLeft = getDaysUntilStockout(item);
                  const suggestion = getReorderSuggestion(item);
                  
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleViewItem(item)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5 min-w-[120px]">
                          <div className="flex justify-between text-sm">
                            <span>{item.currentStock}</span>
                            <span className="text-muted-foreground">/ {item.maxStock}</span>
                          </div>
                          <Progress
                            value={getStockPercentage(item)}
                            className={`h-2 ${
                              getStockStatus(item) === 'out_of_stock'
                                ? '[&>div]:bg-destructive'
                                : getStockStatus(item) === 'critical'
                                ? '[&>div]:bg-red-500'
                                : getStockStatus(item) === 'low'
                                ? '[&>div]:bg-yellow-500'
                                : '[&>div]:bg-green-500'
                            }`}
                          />
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(item)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {item.avgDailySales > 5 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span>{item.avgDailySales.toFixed(1)}/day</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-medium ${
                            daysLeft <= 3
                              ? 'text-destructive'
                              : daysLeft <= 7
                              ? 'text-yellow-600'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {daysLeft === Infinity ? '∞' : `${daysLeft} days`}
                        </span>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {suggestion.shouldReorder && (
                          <Badge
                            variant="outline"
                            className={`cursor-pointer ${
                              suggestion.urgency === 'urgent'
                                ? 'border-destructive text-destructive'
                                : suggestion.urgency === 'soon'
                                ? 'border-yellow-500 text-yellow-700'
                                : 'border-blue-500 text-blue-700'
                            }`}
                          >
                            +{suggestion.suggestedQty} units
                          </Badge>
                        )}
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Item Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedItem.name}</DialogTitle>
                <DialogDescription>SKU: {selectedItem.sku}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Stock Overview */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold">{selectedItem.currentStock}</p>
                      <p className="text-sm text-muted-foreground">Current Stock</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold">{selectedItem.reorderPoint}</p>
                      <p className="text-sm text-muted-foreground">Reorder Point</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold">{getDaysUntilStockout(selectedItem)}</p>
                      <p className="text-sm text-muted-foreground">Days Until Stockout</p>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Category</p>
                    <p className="font-medium">{selectedItem.category}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Location</p>
                    <p className="font-medium">{selectedItem.location}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Supplier</p>
                    <p className="font-medium">{selectedItem.supplier}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Unit Cost</p>
                    <p className="font-medium">${selectedItem.unitCost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Restocked</p>
                    <p className="font-medium">
                      {new Date(selectedItem.lastRestocked).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg. Daily Sales</p>
                    <p className="font-medium">{selectedItem.avgDailySales} units/day</p>
                  </div>
                </div>

                {/* Stock Level Visual */}
                <div>
                  <div className="flex justify-between mb-2 text-sm">
                    <span>Stock Level</span>
                    <span>{selectedItem.currentStock} / {selectedItem.maxStock}</span>
                  </div>
                  <div className="relative h-4 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full transition-all ${
                        getStockStatus(selectedItem) === 'healthy'
                          ? 'bg-green-500'
                          : getStockStatus(selectedItem) === 'low'
                          ? 'bg-yellow-500'
                          : 'bg-destructive'
                      }`}
                      style={{ width: `${getStockPercentage(selectedItem)}%` }}
                    />
                    {/* Reorder point marker */}
                    <div
                      className="absolute top-0 h-full w-0.5 bg-orange-500"
                      style={{ left: `${(selectedItem.reorderPoint / selectedItem.maxStock) * 100}%` }}
                    />
                    {/* Min stock marker */}
                    <div
                      className="absolute top-0 h-full w-0.5 bg-destructive"
                      style={{ left: `${(selectedItem.minStock / selectedItem.maxStock) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>Min: {selectedItem.minStock}</span>
                    <span>Reorder: {selectedItem.reorderPoint}</span>
                    <span>Max: {selectedItem.maxStock}</span>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                  Close
                </Button>
                {getReorderSuggestion(selectedItem).shouldReorder && (
                  <Button>
                    <Truck className="h-4 w-4 mr-2" />
                    Create Reorder
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Stock Alerts Dialog */}
      <Dialog open={alertsDialogOpen} onOpenChange={setAlertsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Stock Alerts ({stockAlerts.length})
            </DialogTitle>
            <DialogDescription>
              Review and manage inventory alerts
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {stockAlerts.length > 0 ? (
              stockAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${
                    alert.severity === 'critical'
                      ? 'border-destructive bg-destructive/5'
                      : alert.severity === 'warning'
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {alert.severity === 'critical' ? (
                      <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{alert.item.name}</p>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Reorder
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="font-medium">All Clear!</p>
                <p className="text-sm text-muted-foreground">No stock alerts at this time</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reorder Dialog */}
      <Dialog open={reorderDialogOpen} onOpenChange={setReorderDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Suggested Reorders
            </DialogTitle>
            <DialogDescription>
              Review and create purchase orders based on sales velocity and stock levels
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {reorderItems.map(({ item, suggestion }) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2 rounded-lg ${
                      suggestion.urgency === 'urgent'
                        ? 'bg-destructive/10'
                        : suggestion.urgency === 'soon'
                        ? 'bg-yellow-100'
                        : 'bg-blue-100'
                    }`}
                  >
                    <Package
                      className={`h-5 w-5 ${
                        suggestion.urgency === 'urgent'
                          ? 'text-destructive'
                          : suggestion.urgency === 'soon'
                          ? 'text-yellow-600'
                          : 'text-blue-600'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Current: {item.currentStock} | Supplier: {item.supplier}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">+{suggestion.suggestedQty} units</p>
                  <p className="text-sm text-muted-foreground">
                    ${suggestion.estimatedCost.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Total Estimated Cost</p>
              <p className="text-2xl font-bold">
                ${reorderItems.reduce((sum, { suggestion }) => sum + suggestion.estimatedCost, 0).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setReorderDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateReorder}>
                <Truck className="h-4 w-4 mr-2" />
                Create Purchase Orders
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
