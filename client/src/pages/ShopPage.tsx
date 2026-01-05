import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, Search, Filter, Package, DollarSign, Star, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { buildApiUrl, getImageUrl } from '@/lib/api-config';

interface ProductPrice {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: any;
  active: boolean;
  metadata?: Record<string, string>;
}

interface Product {
  id: string;
  name: string;
  description: string;
  active: boolean;
  images: string[];
  metadata: Record<string, string>;
  prices: ProductPrice[];
}

export default function ShopPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [category, setCategory] = useState('all');

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/shop/products'],
    queryFn: async () => {
      const response = await fetch(buildApiUrl('/api/shop/products'), {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      return data.data || [];
    }
  });

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const getUniqueColors = (prices: ProductPrice[]) => {
    const colors = prices.map(p => p.metadata?.color).filter(Boolean) as string[];
    return Array.from(new Set(colors));
  };

  const getPriceRange = (prices: ProductPrice[]) => {
    if (!prices || prices.length === 0) return null;
    const amounts = prices.map(p => p.unit_amount);
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    if (min === max) {
      return formatPrice(min, prices[0].currency);
    }
    return `${formatPrice(min, prices[0].currency)} - ${formatPrice(max, prices[0].currency)}`;
  };

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = category === 'all' || product.metadata?.category === category;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price-low') {
        const priceA = a.prices[0]?.unit_amount || 0;
        const priceB = b.prices[0]?.unit_amount || 0;
        return priceA - priceB;
      }
      if (sortBy === 'price-high') {
        const priceA = a.prices[0]?.unit_amount || 0;
        const priceB = b.prices[0]?.unit_amount || 0;
        return priceB - priceA;
      }
      return 0;
    });

  const categories = ['all', ...Array.from(new Set(products.map(p => p.metadata?.category).filter(Boolean)))];

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Shop | Christ Collective</title>
        <meta name="description" content="Browse our collection of faith-based products and merchandise from Christ Collective." />
      </Helmet>

      {/* Hero Section - Black Background */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Christ Collective <span className="text-[#D4AF37]">Shop</span>
          </h1>
          <div className="w-16 h-1 bg-[#D4AF37] mx-auto mb-6"></div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Faith-inspired products to support your journey and our mission
          </p>
          {user?.isAdmin && (
            <Link href="/admin/products">
              <Button className="mt-6 bg-[#D4AF37] hover:bg-[#C4A030] text-black">
                <Settings className="w-4 h-4 mr-2" />
                Manage Products
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Content Section - White Background */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-products"
            />
          </div>
          <div className="flex gap-4">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[180px]" data-testid="select-category">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]" data-testid="select-sort">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden bg-black border-gray-800">
                <Skeleton className="h-48 w-full bg-gray-800" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try adjusting your search or filters' : 'Check back soon for new products!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const colors = getUniqueColors(product.prices || []);
              const hasVariants = colors.length > 0;

              return (
                <Link key={product.id} href={`/shop/product/${product.id}`}>
                  <Card 
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer bg-black text-white border-gray-800 h-full" 
                    data-testid={`card-product-${product.id}`}
                  >
                    <div className="aspect-square bg-gray-900 relative">
                      {product.images && product.images[0] ? (
                        <img
                          src={getImageUrl(product.images[0])}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-16 h-16 text-gray-300" />
                        </div>
                      )}
                      {product.metadata?.featured === 'true' && (
                        <Badge className="absolute top-2 right-2 bg-[#D4AF37] text-black">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                      {product.metadata?.category && (
                        <Badge variant="outline" className="w-fit">
                          {product.metadata.category}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {product.description || 'No description available'}
                      </p>
                      {product.prices && product.prices.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-[#D4AF37]" />
                          <span className="text-lg font-bold">
                            {getPriceRange(product.prices)}
                          </span>
                        </div>
                      )}
                      {hasVariants && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {colors.slice(0, 3).map(color => (
                            <Badge key={color} variant="secondary" className="text-xs">{color}</Badge>
                          ))}
                          {colors.length > 3 && (
                            <Badge variant="secondary" className="text-xs">+{colors.length - 3}</Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full bg-[#D4AF37] hover:bg-[#C4A030] text-black" 
                        data-testid={`button-view-${product.id}`}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        View Product
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
        </div>
      </section>
    </div>
  );
}
