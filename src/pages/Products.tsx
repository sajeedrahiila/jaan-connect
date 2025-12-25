import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, Loader2, Grid3X3, LayoutList } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import {
  ProductFiltersDesktop,
  ProductFiltersMobile,
  ProductSort,
} from '@/components/products/ProductFilters';
import { getProducts, getCategories } from '@/lib/api';
import { Product, Category, ProductFilters } from '@/lib/types';
import { cn } from '@/lib/utils';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get initial category from URL
  const initialCategorySlug = searchParams.get('category');

  const [filters, setFilters] = useState<ProductFilters>({
    sort_by: 'newest',
    per_page: 12,
  });

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      const response = await getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
        
        // Set category from URL if exists
        if (initialCategorySlug) {
          const category = response.data.find(c => c.slug === initialCategorySlug);
          if (category) {
            setFilters(prev => ({ ...prev, category_id: category.id }));
          }
        }
      }
    };
    fetchCategories();
  }, [initialCategorySlug]);

  // Fetch products when filters change
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const response = await getProducts({
        ...filters,
        search: searchQuery || undefined,
      });
      if (response.success && response.data) {
        setProducts(response.data.data);
        setTotalProducts(response.data.total);
      }
      setLoading(false);
    };
    
    const debounce = setTimeout(fetchProducts, 300);
    return () => clearTimeout(debounce);
  }, [filters, searchQuery]);

  const handleFilterChange = (newFilters: ProductFilters) => {
    setFilters(newFilters);
    
    // Update URL with category
    if (newFilters.category_id) {
      const category = categories.find(c => c.id === newFilters.category_id);
      if (category) {
        setSearchParams({ category: category.slug });
      }
    } else {
      setSearchParams({});
    }
  };

  const handleClearFilters = () => {
    setFilters({ sort_by: 'newest', per_page: 12 });
    setSearchQuery('');
    setSearchParams({});
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const activeCategory = useMemo(() => 
    categories.find(c => c.id === filters.category_id),
    [categories, filters.category_id]
  );

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-secondary via-secondary/50 to-background py-12 lg:py-16">
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4"
            >
              {activeCategory ? activeCategory.name : 'Our Products'}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground text-lg mb-8"
            >
              {activeCategory 
                ? activeCategory.description 
                : 'Browse our wide selection of premium wholesale grocery products'}
            </motion.p>

            {/* Search Bar */}
            <motion.form 
              onSubmit={handleSearch}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative max-w-xl mx-auto"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 h-14 text-lg rounded-2xl border-border/50 bg-background/80 backdrop-blur-sm focus:border-primary"
              />
            </motion.form>
          </motion.div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-8 lg:py-12">
        <div className="container-wide">
          <div className="flex gap-8">
            {/* Desktop Filters */}
            <ProductFiltersDesktop
              categories={categories}
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-card rounded-xl border border-border p-4"
              >
                <div className="flex items-center gap-4">
                  <ProductFiltersMobile
                    categories={categories}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                  />
                  <span className="text-sm text-muted-foreground">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      <>{totalProducts} products</>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* View Toggle */}
                  <div className="hidden sm:flex items-center gap-1 bg-secondary rounded-lg p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewMode('list')}
                    >
                      <LayoutList className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <ProductSort
                    value={filters.sort_by || 'newest'}
                    onChange={(value) =>
                      handleFilterChange({
                        ...filters,
                        sort_by: value as ProductFilters['sort_by'],
                      })
                    }
                  />
                </div>
              </motion.div>

              {/* Products Grid */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading products...</p>
                  </div>
                </div>
              ) : products.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No products found</h3>
                  <p className="text-muted-foreground mb-6">
                    Try adjusting your filters or search terms
                  </p>
                  <Button onClick={handleClearFilters}>Clear Filters</Button>
                </motion.div>
              ) : (
                <motion.div
                  layout
                  className={cn(
                    'grid gap-6',
                    viewMode === 'grid'
                      ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                      : 'grid-cols-1'
                  )}
                >
                  <AnimatePresence mode="popLayout">
                    {products.map((product, index) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        index={index}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Load More (placeholder for pagination) */}
              {products.length > 0 && products.length < totalProducts && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center mt-12"
                >
                  <Button variant="outline" size="lg">
                    Load More Products
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Products;
