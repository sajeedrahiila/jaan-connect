import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Upload, X, ImagePlus, Barcode } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Price must be a positive number'),
  comparePrice: z.string().optional(),
  category: z.string().min(1, 'Please select a category'),
  stock: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Stock must be a non-negative number'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  unit: z.string().min(1, 'Please enter a unit'),
  weight: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  product?: {
    id: number;
    name: string;
    sku: string;
    price: number;
    comparePrice?: number;
    category: string;
    stock: number;
    description: string;
    unit: string;
    weight?: number;
    isFeatured?: boolean;
    isNew?: boolean;
    images?: string[];
  };
  onSubmit: (data: ProductFormData & { images?: string[] }) => Promise<void>;
}

const categories = [
  'Grains',
  'Cooking Oils',
  'Beverages',
  'Sweeteners',
  'Spices',
  'Dairy',
  'Snacks',
  'Canned Goods',
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function ProductDialog({ open, onOpenChange, mode, product, onSubmit }: ProductDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>(product?.images || []);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      sku: product?.sku || '',
      barcode: '',
      price: product?.price?.toString() || '',
      comparePrice: product?.comparePrice?.toString() || '',
      category: product?.category || '',
      stock: product?.stock?.toString() || '',
      description: product?.description || '',
      unit: product?.unit || 'kg',
      weight: product?.weight?.toString() || '',
      isFeatured: product?.isFeatured || false,
      isNew: product?.isNew || false,
    },
  });

  const isFeatured = watch('isFeatured');
  const isNew = watch('isNew');

  const generateBarcode = () => {
    // Generate EAN-13 format barcode
    const prefix = '200'; // 200-299 for internal use
    const randomDigits = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    const barcode12 = prefix + randomDigits;
    
    // Calculate check digit
    let sumOdd = 0;
    let sumEven = 0;
    for (let i = 0; i < 12; i++) {
      if (i % 2 === 0) {
        sumOdd += parseInt(barcode12[i]);
      } else {
        sumEven += parseInt(barcode12[i]);
      }
    }
    const checkDigit = (10 - ((sumOdd + (sumEven * 3)) % 10)) % 10;
    const fullBarcode = barcode12 + checkDigit.toString();
    
    setValue('barcode', fullBarcode);
    toast({
      title: 'Barcode generated',
      description: `Generated barcode: ${fullBarcode}`,
    });
  };

  const handleFormSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({ ...data, images });
      toast({
        title: mode === 'create' ? 'Product created' : 'Product updated',
        description: `${data.name} has been ${mode === 'create' ? 'created' : 'updated'} successfully.`,
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${mode} product. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = async (e: any) => {
    const files = e.target.files as FileList | null;
    if (!files || !files.length) return;
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append('files', f));
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`${API_URL}/api/admin/uploads`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error('Upload failed');
      setImages([...images, ...data.data.urls]);
      e.target.value = '';
    } catch {
      toast({
        title: 'Upload failed',
        description: 'Could not upload images',
        variant: 'destructive',
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add New Product' : 'Edit Product'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Fill in the details to add a new product to your catalog.'
              : 'Update the product information below.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Images Section */}
          <div className="space-y-3">
            <Label>Product Images</Label>
            <div className="flex flex-wrap gap-3">
              {images.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img}
                    alt={`Product ${index + 1}`}
                    className="h-20 w-20 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="h-20 w-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs mt-1">Add</span>
              </label>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., Organic Whole Wheat Flour"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input id="sku" {...register('sku')} placeholder="e.g., FLR-001" />
              {errors.sku && (
                <p className="text-sm text-destructive">{errors.sku.message}</p>
              )}
            </div>
          </div>

          {/* Barcode */}
          <div className="space-y-2">
            <Label htmlFor="barcode">Barcode (EAN-13)</Label>
            <div className="flex gap-2">
              <Input
                id="barcode"
                {...register('barcode')}
                placeholder="e.g., 2001234567890"
                className="font-mono"
              />
              <Button type="button" variant="outline" onClick={generateBarcode}>
                <Barcode className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty to generate automatically, or enter a custom barcode
            </p>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register('price')}
                placeholder="0.00"
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="comparePrice">Compare Price ($)</Label>
              <Input
                id="comparePrice"
                type="number"
                step="0.01"
                {...register('comparePrice')}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock *</Label>
              <Input
                id="stock"
                type="number"
                {...register('stock')}
                placeholder="0"
              />
              {errors.stock && (
                <p className="text-sm text-destructive">{errors.stock.message}</p>
              )}
            </div>
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={watch('category')}
                onValueChange={(val) => setValue('category', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Input id="unit" {...register('unit')} placeholder="e.g., kg, L, pcs" />
              {errors.unit && (
                <p className="text-sm text-destructive">{errors.unit.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                {...register('weight')}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Enter product description..."
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <Switch
                id="isFeatured"
                checked={isFeatured}
                onCheckedChange={(checked) => setValue('isFeatured', checked)}
              />
              <Label htmlFor="isFeatured" className="cursor-pointer">
                Featured Product
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="isNew"
                checked={isNew}
                onCheckedChange={(checked) => setValue('isNew', checked)}
              />
              <Label htmlFor="isNew" className="cursor-pointer">
                Mark as New
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === 'create' ? 'Create Product' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}