import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Barcode, Info, AlertTriangle, DollarSign, Package, Truck, Upload, X, ImagePlus } from 'lucide-react';
import { VariantsDialog } from './VariantsDialog';

interface EnhancedProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  product?: any;
  onSubmit: (data: any) => Promise<void>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const categories = ['Grains', 'Cooking Oils', 'Beverages', 'Sweeteners', 'Spices', 'Dairy', 'Snacks', 'Canned Goods'];
const taxCategories = [
  { value: 'grocery', label: 'Grocery (Tax-Exempt)', taxable: false },
  { value: 'prepared_food', label: 'Prepared Food', taxable: true },
  { value: 'beverage', label: 'Beverage', taxable: true },
  { value: 'alcohol', label: 'Alcohol', taxable: true },
];
const adjustmentReasons = ['Restock', 'Spoilage', 'Damage', 'Theft', 'Correction', 'Return'];

export function EnhancedProductDialog({ open, onOpenChange, mode, product, onSubmit }: EnhancedProductDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [variantsDialogOpen, setVariantsDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Images
  const [images, setImages] = useState<string[]>(product?.images || []);
  
  // Basic Info
  const [name, setName] = useState(product?.name || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [description, setDescription] = useState(product?.description || '');
  const [category, setCategory] = useState(product?.category || '');
  const [isFeatured, setIsFeatured] = useState(product?.is_featured || false);
  const [isNew, setIsNew] = useState(product?.is_new || false);
  
  // Barcode & UPC
  const [upcCode, setUpcCode] = useState(product?.upc_code || '');
  
  // Pricing
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [comparePrice, setComparePrice] = useState(product?.compare_price?.toString() || '');
  const [unit, setUnit] = useState(product?.unit || 'kg');
  const [weight, setWeight] = useState(product?.weight?.toString() || '');
  const [pricePerUnit, setPricePerUnit] = useState(product?.price_per_unit || 0);
  
  // Inventory Control
  const [onHandQuantity, setOnHandQuantity] = useState(product?.on_hand_quantity?.toString() || '0');
  const [lowStockThreshold, setLowStockThreshold] = useState(product?.low_stock_threshold?.toString() || '10');
  const [allowNegativeStock, setAllowNegativeStock] = useState(product?.allow_negative_stock || false);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  
  // Tax Controls
  const [isTaxable, setIsTaxable] = useState(product?.is_taxable || false);
  const [taxCategory, setTaxCategory] = useState(product?.tax_category || 'grocery');
  
  // Expiry & Batch
  const [expiryDate, setExpiryDate] = useState(product?.expiry_date || '');
  const [batchNumber, setBatchNumber] = useState(product?.batch_number || '');
  const [lotNumber, setLotNumber] = useState(product?.lot_number || '');
  const [expiryAlertDays, setExpiryAlertDays] = useState(product?.expiry_alert_days?.toString() || '7');
  
  // Cost & Margin (Admin only)
  const [costPrice, setCostPrice] = useState(product?.cost_price?.toString() || '');
  const [marginPercentage, setMarginPercentage] = useState(product?.margin_percentage || 0);
  
  // Supplier Info
  const [supplierName, setSupplierName] = useState(product?.supplier_name || '');
  const [caseSize, setCaseSize] = useState(product?.case_size?.toString() || '');
  const [leadTimeDays, setLeadTimeDays] = useState(product?.lead_time_days?.toString() || '');
  
  // Variants
  const [hasVariants, setHasVariants] = useState(product?.has_variants || false);

  // Auto-calculate price per unit when price or weight changes
  useEffect(() => {
    if (price && weight) {
      const p = parseFloat(price);
      const w = parseFloat(weight);
      if (!isNaN(p) && !isNaN(w) && w > 0) {
        let perUnit = p / w;
        // Convert to oz if needed
        if (unit === 'kg') perUnit = p / (w * 35.274);
        else if (unit === 'g') perUnit = p / (w * 0.035274);
        else if (unit === 'lb') perUnit = p / (w * 16);
        setPricePerUnit(perUnit);
      }
    }
  }, [price, weight, unit]);

  // Auto-calculate margin percentage
  useEffect(() => {
    if (costPrice && price) {
      const cost = parseFloat(costPrice);
      const sell = parseFloat(price);
      if (!isNaN(cost) && !isNaN(sell) && sell > 0) {
        const margin = ((sell - cost) / sell) * 100;
        setMarginPercentage(margin);
      }
    }
  }, [costPrice, price]);

  const generateUPC = () => {
    // Generate UPC-A (12 digits)
    const randomDigits = Math.floor(Math.random() * 100000000000).toString().padStart(11, '0');
    
    // Calculate check digit
    let sumOdd = 0;
    let sumEven = 0;
    for (let i = 0; i < 11; i++) {
      if (i % 2 === 0) {
        sumOdd += parseInt(randomDigits[i]);
      } else {
        sumEven += parseInt(randomDigits[i]);
      }
    }
    const checkDigit = (10 - ((sumOdd * 3 + sumEven) % 10)) % 10;
    const upc = randomDigits + checkDigit.toString();
    
    setUpcCode(upc);
    toast({ title: 'UPC Generated', description: `UPC-A: ${upc}` });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
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
      toast({ title: 'Images uploaded', description: `${data.data.urls.length} image(s) added` });
    } catch (error) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const data = {
        name, sku, description, category, isFeatured, isNew, images,
        upcCode, price: parseFloat(price), comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        unit, weight: weight ? parseFloat(weight) : null,
        onHandQuantity: parseInt(onHandQuantity), lowStockThreshold: parseInt(lowStockThreshold),
        allowNegativeStock, adjustmentReason,
        isTaxable, taxCategory,
        expiryDate: expiryDate || null, batchNumber, lotNumber, expiryAlertDays: parseInt(expiryAlertDays),
        costPrice: costPrice ? parseFloat(costPrice) : null,
        supplierName, caseSize: caseSize ? parseInt(caseSize) : null,
        leadTimeDays: leadTimeDays ? parseInt(leadTimeDays) : null,
        hasVariants,
        stock: parseInt(onHandQuantity), // For compatibility
      };
      
      await onSubmit(data);
      toast({ title: 'Success', description: `Product ${mode === 'create' ? 'created' : 'updated'} successfully` });
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save product', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const showBelowCostWarning = costPrice && price && parseFloat(price) < parseFloat(costPrice);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add New Product' : 'Edit Product'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="pricing">Pricing & Tax</TabsTrigger>
              <TabsTrigger value="expiry">Expiry & Batch</TabsTrigger>
              <TabsTrigger value="supplier">Supplier</TabsTrigger>
            </TabsList>

            {/* BASIC INFO TAB */}
            <TabsContent value="basic" className="space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Organic Whole Wheat Flour" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="FLR-001" required />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="upc">Barcode (UPC-A)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger><Info className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>Standard US grocery barcode (12 digits)</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex gap-2">
                  <Input 
                    id="upc" 
                    value={upcCode} 
                    onChange={(e) => setUpcCode(e.target.value)} 
                    placeholder="012345678905" 
                    maxLength={12}
                    className="font-mono"
                  />
                  <Button type="button" variant="outline" onClick={generateUPC}>
                    <Barcode className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                    <Label>Featured</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={isNew} onCheckedChange={setIsNew} />
                    <Label>Mark as New</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required />
              </div>
            </TabsContent>

            {/* INVENTORY CONTROL TAB */}
            <TabsContent value="inventory" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="onHand">On-Hand Quantity *</Label>
                  <Input 
                    id="onHand" 
                    type="number" 
                    value={onHandQuantity} 
                    onChange={(e) => setOnHandQuantity(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="lowStock">Low Stock Alert</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger><Info className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                        <TooltipContent>Alert when stock falls below this number</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input id="lowStock" type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Unit *</Label>
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilogram (kg)</SelectItem>
                      <SelectItem value="g">Gram (g)</SelectItem>
                      <SelectItem value="lb">Pound (lb)</SelectItem>
                      <SelectItem value="oz">Ounce (oz)</SelectItem>
                      <SelectItem value="L">Liter (L)</SelectItem>
                      <SelectItem value="ml">Milliliter (ml)</SelectItem>
                      <SelectItem value="pcs">Pieces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight</Label>
                  <Input id="weight" type="number" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Inventory Adjustment Reason</Label>
                  <Select value={adjustmentReason} onValueChange={setAdjustmentReason}>
                    <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                    <SelectContent>
                      {adjustmentReasons.map(r => <SelectItem key={r} value={r.toLowerCase()}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Switch checked={allowNegativeStock} onCheckedChange={setAllowNegativeStock} />
                <Label>Allow Negative Stock</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger><Info className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent>Enable backorders when out of stock</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <Separator />

              <div className="flex items-center gap-2 pt-2">
                <Switch checked={hasVariants} onCheckedChange={setHasVariants} />
                <Label>This product has variants (sizes, flavors, etc.)</Label>
              </div>
              {hasVariants && mode === 'edit' && product?.id && (
                <div className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setVariantsDialogOpen(true)}>
                    <Package className="h-4 w-4 mr-2" />
                    Manage Variants
                  </Button>
                </div>
              )}
              {hasVariants && mode === 'create' && (
                <p className="text-sm text-muted-foreground">
                  Variants can be managed after creating the product.
                </p>
              )}
            </TabsContent>

            {/* PRICING & TAX TAB */}
            <TabsContent value="pricing" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($) *</Label>
                  <Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comparePrice">Compare Price ($)</Label>
                  <Input id="comparePrice" type="number" step="0.01" value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} />
                </div>
              </div>

              {pricePerUnit > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Unit Pricing</p>
                  <p className="text-lg font-bold text-primary">${pricePerUnit.toFixed(4)} / oz</p>
                  <p className="text-xs text-muted-foreground">Auto-calculated for US compliance</p>
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Switch checked={isTaxable} onCheckedChange={setIsTaxable} />
                  <Label>Taxable Product</Label>
                </div>

                <div className="space-y-2">
                  <Label>Tax Category</Label>
                  <Select value={taxCategory} onValueChange={setTaxCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {taxCategories.map(tc => (
                        <SelectItem key={tc.value} value={tc.value}>
                          {tc.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {taxCategories.find(t => t.value === taxCategory)?.taxable 
                      ? '✓ Subject to sales tax' 
                      : '✓ Tax-exempt (standard grocery)'}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <p className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Cost & Margin (Admin Only)
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="costPrice">Cost Price ($)</Label>
                    <Input id="costPrice" type="number" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Margin %</Label>
                    <Input value={marginPercentage.toFixed(2) + '%'} disabled className="bg-muted" />
                  </div>
                </div>

                {showBelowCostWarning && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    Warning: Selling below cost price!
                  </div>
                )}
              </div>
            </TabsContent>

            {/* EXPIRY & BATCH TAB */}
            <TabsContent value="expiry" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input id="expiryDate" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryAlert">Expiry Alert (days before)</Label>
                  <Input id="expiryAlert" type="number" value={expiryAlertDays} onChange={(e) => setExpiryAlertDays(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batchNumber">Batch Number</Label>
                  <Input id="batchNumber" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} placeholder="BATCH-2024-001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lotNumber">Lot Number</Label>
                  <Input id="lotNumber" value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} placeholder="LOT-A123" />
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                <Info className="h-4 w-4 inline mr-1" />
                Expiry tracking helps comply with food safety regulations and reduce waste.
              </p>
            </TabsContent>

            {/* SUPPLIER TAB */}
            <TabsContent value="supplier" className="space-y-4">
              <p className="text-sm font-medium flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Supplier & Purchasing Info
              </p>

              <div className="space-y-2">
                <Label htmlFor="supplierName">Supplier Name</Label>
                <Input id="supplierName" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Sysco Foods" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="caseSize">Case Size (units per case)</Label>
                  <Input id="caseSize" type="number" value={caseSize} onChange={(e) => setCaseSize(e.target.value)} placeholder="12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leadTime">Lead Time (days)</Label>
                  <Input id="leadTime" type="number" value={leadTimeDays} onChange={(e) => setLeadTimeDays(e.target.value)} placeholder="3" />
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                This information helps with reorder planning and inventory forecasting.
              </p>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === 'create' ? 'Create Product' : 'Save Changes'}
            </Button>
          </div>
        </form>

        {/* Variants Dialog */}
        {product?.id && (
          <VariantsDialog
            open={variantsDialogOpen}
            onOpenChange={setVariantsDialogOpen}
            productId={product.id}
            productName={product.name}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
