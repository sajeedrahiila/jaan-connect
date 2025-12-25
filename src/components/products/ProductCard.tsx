import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Eye, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/lib/types';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addToCart } = useCart();
  
  const stockStatusStyles = {
    in_stock: 'bg-success/10 text-success border-success/20',
    low_stock: 'bg-accent/10 text-accent-foreground border-accent/20',
    out_of_stock: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  const stockStatusText = {
    in_stock: 'In Stock',
    low_stock: 'Low Stock',
    out_of_stock: 'Out of Stock',
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.stock_status !== 'out_of_stock') {
      addToCart(product, 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -8 }}
      className="group"
    >
      <Link to={`/products/${product.slug}`}>
        <div className="relative bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
          {/* Image Container */}
          <div className="relative aspect-square bg-secondary/50 overflow-hidden">
            <motion.img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {product.is_new && (
                <Badge className="bg-primary text-primary-foreground">New</Badge>
              )}
              {product.compare_price && (
                <Badge className="bg-destructive text-destructive-foreground">
                  Sale
                </Badge>
              )}
            </div>

            {/* Quick actions overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileHover={{ opacity: 1, y: 0 }}
              className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 bg-white/90 hover:bg-white text-foreground backdrop-blur-sm"
                onClick={handleAddToCart}
                disabled={product.stock_status === 'out_of_stock'}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Add to Cart
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="bg-white/90 hover:bg-white text-foreground backdrop-blur-sm"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {product.category_name}
              </span>
              <Badge 
                variant="outline" 
                className={cn('text-xs', stockStatusStyles[product.stock_status])}
              >
                {stockStatusText[product.stock_status]}
              </Badge>
            </div>
            
            <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2">
              {product.name}
            </h3>
            
            <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
              {product.short_description || product.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-primary">
                  ${product.price.toFixed(2)}
                </span>
                {product.compare_price && (
                  <span className="text-sm text-muted-foreground line-through">
                    ${product.compare_price.toFixed(2)}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                per {product.unit}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
