import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Save, X, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Variant {
  id?: number;
  name: string;
  sku: string;
  upc_code: string;
  price: number;
  cost_price: number | null;
  on_hand_quantity: number;
  sort_order: number;
  is_active: boolean;
}

interface VariantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: number;
  productName: string;
}

export function VariantsDialog({ open, onOpenChange, productId, productName }: VariantsDialogProps) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Variant>({
    name: '',
    sku: '',
    upc_code: '',
    price: 0,
    cost_price: null,
    on_hand_quantity: 0,
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    if (open) {
      fetchVariants();
    }
  }, [open, productId]);

  const fetchVariants = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}/variants`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setVariants(data);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load variants', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      name: '',
      sku: '',
      upc_code: '',
      price: 0,
      cost_price: null,
      on_hand_quantity: 0,
      sort_order: variants.length,
      is_active: true,
    });
  };

  const handleEdit = (variant: Variant) => {
    setEditingId(variant.id!);
    setIsAdding(false);
    setFormData(variant);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      name: '',
      sku: '',
      upc_code: '',
      price: 0,
      cost_price: null,
      on_hand_quantity: 0,
      sort_order: 0,
      is_active: true,
    });
  };

  const handleSave = async () => {
    try {
      if (isAdding) {
        // Create new variant
        const res = await fetch(`/api/admin/products/${productId}/variants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          toast({ title: 'Success', description: 'Variant created successfully' });
          fetchVariants();
          handleCancel();
        } else {
          throw new Error('Failed to create variant');
        }
      } else if (editingId) {
        // Update existing variant
        const res = await fetch(`/api/admin/variants/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          toast({ title: 'Success', description: 'Variant updated successfully' });
          fetchVariants();
          handleCancel();
        } else {
          throw new Error('Failed to update variant');
        }
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save variant', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this variant?')) return;

    try {
      const res = await fetch(`/api/admin/variants/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        toast({ title: 'Success', description: 'Variant deleted' });
        fetchVariants();
      } else {
        throw new Error('Failed to delete variant');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete variant', variant: 'destructive' });
    }
  };

  const calculateMargin = (price: number, cost: number | null) => {
    if (!cost || price === 0) return '-';
    const margin = ((price - cost) / price) * 100;
    return `${margin.toFixed(1)}%`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Variants: {productName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {variants.length} variant{variants.length !== 1 ? 's' : ''}
            </p>
            <Button onClick={handleAdd} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Variant
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>UPC</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Margin</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isAdding && (
                    <TableRow className="bg-accent/50">
                      <TableCell>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="1 lb"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={formData.sku}
                          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                          placeholder="SKU-001"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={formData.upc_code}
                          onChange={(e) => setFormData({ ...formData, upc_code: e.target.value })}
                          placeholder="012345678905"
                          maxLength={12}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.cost_price || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, cost_price: e.target.value ? parseFloat(e.target.value) : null })
                          }
                        />
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={formData.on_hand_quantity}
                          onChange={(e) => setFormData({ ...formData, on_hand_quantity: parseInt(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">Active</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={handleSave}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancel}>
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}

                  {variants.map((variant) =>
                    editingId === variant.id ? (
                      <TableRow key={variant.id} className="bg-accent/50">
                        <TableCell>
                          <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={formData.sku}
                            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={formData.upc_code}
                            onChange={(e) => setFormData({ ...formData, upc_code: e.target.value })}
                            maxLength={12}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.cost_price || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, cost_price: e.target.value ? parseFloat(e.target.value) : null })
                            }
                          />
                        </TableCell>
                        <TableCell>{calculateMargin(formData.price, formData.cost_price)}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={formData.on_hand_quantity}
                            onChange={(e) => setFormData({ ...formData, on_hand_quantity: parseInt(e.target.value) })}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant={formData.is_active ? 'default' : 'secondary'}>
                            {formData.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={handleSave}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleCancel}>
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow key={variant.id}>
                        <TableCell className="font-medium">{variant.name}</TableCell>
                        <TableCell>{variant.sku}</TableCell>
                        <TableCell className="font-mono text-xs">{variant.upc_code}</TableCell>
                        <TableCell>${variant.price.toFixed(2)}</TableCell>
                        <TableCell>${variant.cost_price ? variant.cost_price.toFixed(2) : '-'}</TableCell>
                        <TableCell>{calculateMargin(variant.price, variant.cost_price)}</TableCell>
                        <TableCell>
                          <Badge variant={variant.on_hand_quantity > 0 ? 'default' : 'destructive'}>
                            {variant.on_hand_quantity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={variant.is_active ? 'default' : 'secondary'}>
                            {variant.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(variant)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(variant.id!)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  )}

                  {variants.length === 0 && !isAdding && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No variants yet. Click "Add Variant" to create one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
