import { motion } from 'framer-motion';
import { Filter, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Category, ProductFilters as Filters } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ProductFiltersProps {
  categories: Category[];
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onClearFilters: () => void;
  isMobile?: boolean;
}

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

function FilterContent({
  categories,
  filters,
  onFilterChange,
  onClearFilters,
}: ProductFiltersProps) {
  const hasActiveFilters = 
    filters.category_id || 
    filters.in_stock_only || 
    filters.min_price !== undefined || 
    filters.max_price !== undefined;

  return (
    <div className="space-y-6">
      {/* Clear Filters */}
      {hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="w-full"
          >
            <X className="h-4 w-4 mr-2" />
            Clear All Filters
          </Button>
        </motion.div>
      )}

      {/* Categories */}
      <div>
        <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
          Categories
        </h4>
        <div className="space-y-2">
          <button
            onClick={() => onFilterChange({ ...filters, category_id: undefined })}
            className={cn(
              'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
              !filters.category_id
                ? 'bg-primary/10 text-primary font-medium'
                : 'hover:bg-secondary text-foreground'
            )}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onFilterChange({ ...filters, category_id: category.id })}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between',
                filters.category_id === category.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-secondary text-foreground'
              )}
            >
              <span>{category.name}</span>
              <span className="text-xs text-muted-foreground">
                {category.product_count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
          Price Range
        </h4>
        <div className="px-2">
          <Slider
            defaultValue={[0, 50]}
            max={50}
            step={1}
            value={[filters.min_price || 0, filters.max_price || 50]}
            onValueChange={([min, max]) =>
              onFilterChange({ ...filters, min_price: min, max_price: max })
            }
            className="mb-4"
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              ${filters.min_price || 0}
            </span>
            <span className="text-muted-foreground">
              ${filters.max_price || 50}
            </span>
          </div>
        </div>
      </div>

      {/* Stock Filter */}
      <div>
        <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
          Availability
        </h4>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="in-stock"
            checked={filters.in_stock_only || false}
            onCheckedChange={(checked) =>
              onFilterChange({ ...filters, in_stock_only: checked as boolean })
            }
          />
          <Label htmlFor="in-stock" className="text-sm cursor-pointer">
            In Stock Only
          </Label>
        </div>
      </div>
    </div>
  );
}

export function ProductFiltersDesktop(props: ProductFiltersProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-64 shrink-0 hidden lg:block"
    >
      <div className="sticky top-24 bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2 mb-6">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Filters</h3>
        </div>
        <FilterContent {...props} />
      </div>
    </motion.aside>
  );
}

export function ProductFiltersMobile(props: ProductFiltersProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Filters
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <FilterContent {...props} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ProductSort({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        {sortOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
