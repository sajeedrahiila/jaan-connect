import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  MoreVertical,
  Package,
  Edit,
  Trash2,
  AlertTriangle,
  Copy,
  Eye,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ProductDialog } from '@/components/admin/ProductDialog';
import { useToast } from '@/hooks/use-toast';

// Product type definition
interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  comparePrice?: number;
  stock: number;
  category: string;
  status: string;
  description: string;
  unit: string;
  weight?: number;
  isFeatured?: boolean;
  isNew?: boolean;
  images?: string[];
}

// Mock products data - in a real app this would come from the database
const initialProducts: Product[] = [
  {
    id: 1,
    name: 'Organic Whole Wheat Flour',
    sku: 'FLR-001',
    price: 45.00,
    stock: 250,
    category: 'Grains',
    status: 'active',
    description: 'Premium organic whole wheat flour, perfect for baking healthy breads and pastries.',
    unit: 'kg',
    weight: 5,
    isFeatured: true,
    isNew: false,
  },
  {
    id: 2,
    name: 'Premium Basmati Rice (25kg)',
    sku: 'RIC-002',
    price: 89.99,
    stock: 180,
    category: 'Grains',
    status: 'active',
    description: 'Long-grain premium basmati rice imported from India. Perfect for biryanis and pilafs.',
    unit: 'bag',
    weight: 25,
    isFeatured: false,
    isNew: true,
  },
  {
    id: 3,
    name: 'Cold Pressed Coconut Oil',
    sku: 'OIL-003',
    price: 24.50,
    stock: 0,
    category: 'Cooking Oils',
    status: 'out_of_stock',
    description: 'Pure cold-pressed virgin coconut oil for cooking and health benefits.',
    unit: 'L',
    weight: 1,
    isFeatured: false,
    isNew: false,
  },
  {
    id: 4,
    name: 'Organic Honey (500g)',
    sku: 'HON-004',
    price: 18.99,
    stock: 75,
    category: 'Sweeteners',
    status: 'active',
    description: 'Raw organic honey sourced from local beekeepers. Unprocessed and full of nutrients.',
    unit: 'jar',
    weight: 0.5,
    isFeatured: true,
    isNew: false,
  },
  {
    id: 5,
    name: 'Green Tea Premium Pack',
    sku: 'TEA-005',
    price: 32.00,
    stock: 15,
    category: 'Beverages',
    status: 'low_stock',
    description: 'Premium Japanese green tea leaves for a refreshing and healthy beverage.',
    unit: 'box',
    weight: 0.25,
    isFeatured: false,
    isNew: true,
  },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const { toast } = useToast();

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case 'out_of_stock':
        return <Badge variant="destructive">Out of Stock</Badge>;
      case 'low_stock':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Low Stock</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleDuplicateProduct = (product: Product) => {
    const newProduct: Product = {
      ...product,
      id: Math.max(...products.map((p) => p.id)) + 1,
      name: `${product.name} (Copy)`,
      sku: `${product.sku}-COPY`,
    };
    setProducts([...products, newProduct]);
    toast({
      title: 'Product duplicated',
      description: `${newProduct.name} has been created.`,
    });
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      setProducts(products.filter((p) => p.id !== productToDelete.id));
      toast({
        title: 'Product deleted',
        description: `${productToDelete.name} has been removed.`,
      });
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleSubmitProduct = async (data: any) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (dialogMode === 'create') {
      const newProduct: Product = {
        id: Math.max(...products.map((p) => p.id)) + 1,
        name: data.name,
        sku: data.sku,
        price: parseFloat(data.price),
        comparePrice: data.comparePrice ? parseFloat(data.comparePrice) : undefined,
        stock: parseInt(data.stock),
        category: data.category,
        status: parseInt(data.stock) === 0 ? 'out_of_stock' : parseInt(data.stock) < 20 ? 'low_stock' : 'active',
        description: data.description,
        unit: data.unit,
        weight: data.weight ? parseFloat(data.weight) : undefined,
        isFeatured: data.isFeatured,
        isNew: data.isNew,
      };
      setProducts([...products, newProduct]);
    } else if (selectedProduct) {
      const stock = parseInt(data.stock);
      setProducts(
        products.map((p) =>
          p.id === selectedProduct.id
            ? {
                ...p,
                name: data.name,
                sku: data.sku,
                price: parseFloat(data.price),
                comparePrice: data.comparePrice ? parseFloat(data.comparePrice) : undefined,
                stock: stock,
                category: data.category,
                status: stock === 0 ? 'out_of_stock' : stock < 20 ? 'low_stock' : 'active',
                description: data.description,
                unit: data.unit,
                weight: data.weight ? parseFloat(data.weight) : undefined,
                isFeatured: data.isFeatured,
                isNew: data.isNew,
              }
            : p
        )
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Button onClick={handleAddProduct}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
              <Package className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Stock</p>
                <p className="text-2xl font-bold">
                  {products.filter((p) => p.status === 'active').length}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold">
                  {products.filter((p) => p.status === 'out_of_stock').length}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Products ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product, index) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <span className="font-medium">{product.name}</span>
                          <div className="flex gap-1 mt-0.5">
                            {product.isFeatured && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0">Featured</Badge>
                            )}
                            {product.isNew && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0 border-green-500 text-green-700">New</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {product.sku}
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="font-medium">
                      ${product.price.toFixed(2)}
                      {product.comparePrice && (
                        <span className="text-muted-foreground line-through ml-2 text-sm">
                          ${product.comparePrice.toFixed(2)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{getStatusBadge(product.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateProduct(product)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteClick(product)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No products found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Product Dialog */}
      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        product={selectedProduct || undefined}
        onSubmit={handleSubmitProduct}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Product
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{productToDelete?.name}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
