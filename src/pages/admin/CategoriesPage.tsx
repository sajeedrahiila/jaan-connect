import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  FolderTree,
  Package,
  GripVertical,
  ChevronRight,
  Image as ImageIcon,
  Loader2,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image?: string;
  parentId: number | null;
  productCount: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

const mockCategories: Category[] = [
  {
    id: 1,
    name: 'Grains & Rice',
    slug: 'grains-rice',
    description: 'Premium quality grains and rice products',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200',
    parentId: null,
    productCount: 45,
    isActive: true,
    sortOrder: 1,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Basmati Rice',
    slug: 'basmati-rice',
    description: 'Long grain aromatic basmati rice varieties',
    parentId: 1,
    productCount: 12,
    isActive: true,
    sortOrder: 1,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    name: 'Cooking Oils',
    slug: 'cooking-oils',
    description: 'High-quality cooking oils for every kitchen',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200',
    parentId: null,
    productCount: 28,
    isActive: true,
    sortOrder: 2,
    createdAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 4,
    name: 'Beverages',
    slug: 'beverages',
    description: 'Refreshing beverages and drinks',
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=200',
    parentId: null,
    productCount: 35,
    isActive: true,
    sortOrder: 3,
    createdAt: '2024-01-03T00:00:00Z',
  },
  {
    id: 5,
    name: 'Tea',
    slug: 'tea',
    description: 'Premium tea collection',
    parentId: 4,
    productCount: 18,
    isActive: true,
    sortOrder: 1,
    createdAt: '2024-01-03T00:00:00Z',
  },
  {
    id: 6,
    name: 'Coffee',
    slug: 'coffee',
    description: 'Artisanal coffee selections',
    parentId: 4,
    productCount: 12,
    isActive: true,
    sortOrder: 2,
    createdAt: '2024-01-03T00:00:00Z',
  },
  {
    id: 7,
    name: 'Sweeteners',
    slug: 'sweeteners',
    description: 'Natural and organic sweeteners',
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=200',
    parentId: null,
    productCount: 15,
    isActive: true,
    sortOrder: 4,
    createdAt: '2024-01-04T00:00:00Z',
  },
  {
    id: 8,
    name: 'Spices',
    slug: 'spices',
    description: 'Authentic spices from around the world',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200',
    parentId: null,
    productCount: 52,
    isActive: true,
    sortOrder: 5,
    createdAt: '2024-01-05T00:00:00Z',
  },
  {
    id: 9,
    name: 'Snacks',
    slug: 'snacks',
    description: 'Delicious snacks and munchies',
    parentId: null,
    productCount: 0,
    isActive: false,
    sortOrder: 6,
    createdAt: '2024-01-06T00:00:00Z',
  },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parentId: '',
    isActive: true,
    image: '',
  });

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const parentCategories = categories.filter((cat) => cat.parentId === null);
  const totalProducts = categories.reduce((sum, cat) => sum + cat.productCount, 0);
  const activeCategories = categories.filter((cat) => cat.isActive).length;

  const getCategoryPath = (category: Category): string => {
    if (category.parentId === null) return category.name;
    const parent = categories.find((c) => c.id === category.parentId);
    return parent ? `${parent.name} → ${category.name}` : category.name;
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setSelectedCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description,
        parentId: category.parentId?.toString() || '',
        isActive: category.isActive,
        image: category.image || '',
      });
    } else {
      setSelectedCategory(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        parentId: '',
        isActive: true,
        image: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Category name is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (selectedCategory) {
      // Update existing category
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === selectedCategory.id
            ? {
                ...cat,
                name: formData.name,
                slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
                description: formData.description,
                parentId: formData.parentId ? parseInt(formData.parentId) : null,
                isActive: formData.isActive,
                image: formData.image || undefined,
              }
            : cat
        )
      );
      toast({
        title: 'Category updated',
        description: `${formData.name} has been updated successfully.`,
      });
    } else {
      // Create new category
      const newCategory: Category = {
        id: Math.max(...categories.map((c) => c.id)) + 1,
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description,
        parentId: formData.parentId ? parseInt(formData.parentId) : null,
        productCount: 0,
        isActive: formData.isActive,
        sortOrder: categories.length + 1,
        createdAt: new Date().toISOString(),
        image: formData.image || undefined,
      };
      setCategories((prev) => [...prev, newCategory]);
      toast({
        title: 'Category created',
        description: `${formData.name} has been created successfully.`,
      });
    }

    setIsSubmitting(false);
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    // Check if category has children
    const hasChildren = categories.some((c) => c.parentId === selectedCategory.id);
    if (hasChildren) {
      toast({
        title: 'Cannot delete',
        description: 'This category has subcategories. Please delete them first.',
        variant: 'destructive',
      });
      setDeleteDialogOpen(false);
      return;
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    setCategories((prev) => prev.filter((cat) => cat.id !== selectedCategory.id));
    toast({
      title: 'Category deleted',
      description: `${selectedCategory.name} has been deleted.`,
    });
    setDeleteDialogOpen(false);
    setSelectedCategory(null);
  };

  const handleToggleActive = async (category: Category) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === category.id ? { ...cat, isActive: !cat.isActive } : cat
      )
    );
    toast({
      title: category.isActive ? 'Category disabled' : 'Category enabled',
      description: `${category.name} has been ${category.isActive ? 'disabled' : 'enabled'}.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderTree className="h-6 w-6" />
            Categories
          </h1>
          <p className="text-muted-foreground">Organize your products with categories</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Categories</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
              <FolderTree className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Parent Categories</p>
                <p className="text-2xl font-bold">{parentCategories.length}</p>
              </div>
              <ChevronRight className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{activeCategories}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Categories ({filteredCategories.length})</CardTitle>
          <CardDescription>Manage your product categories and subcategories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <FolderTree className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No categories found</h3>
                      <p className="text-muted-foreground">Create your first category to get started</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category, index) => (
                    <motion.tr
                      key={category.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <TableCell>
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {category.image ? (
                            <img
                              src={category.image}
                              alt={category.name}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                              <FolderTree className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {category.parentId && (
                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              )}
                              {category.name}
                            </div>
                            {category.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {category.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {category.slug}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{category.productCount} products</Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={category.isActive}
                          onCheckedChange={() => handleToggleActive(category)}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(category.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog(category)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedCategory(category);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory
                ? 'Update the category information below.'
                : 'Fill in the details to create a new category.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                  });
                }}
                placeholder="e.g., Grains & Rice"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g., grains-rice"
              />
              <p className="text-xs text-muted-foreground">URL-friendly version of the name</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the category"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent">Parent Category</Label>
              <Select
                value={formData.parentId}
                onValueChange={(val) => setFormData({ ...formData, parentId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None (Top Level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (Top Level)</SelectItem>
                  {parentCategories
                    .filter((c) => c.id !== selectedCategory?.id)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
                {formData.image && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setFormData({ ...formData, image: '' })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {formData.image && (
                <img
                  src={formData.image}
                  alt="Preview"
                  className="h-20 w-20 rounded-lg object-cover mt-2"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedCategory?.name}"? This action cannot be
              undone.
              {selectedCategory && selectedCategory.productCount > 0 && (
                <span className="block mt-2 text-destructive">
                  Warning: This category has {selectedCategory.productCount} products. They will
                  become uncategorized.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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