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
import { buildApiUrl } from '@/lib/api-config';

interface Product {
  id: string;
  name: string;
  description: string;
  active: boolean;
  images: string[];
  metadata: Record<string, string>;
  prices: {
    id: string;
    unit_amount: number;
    currency: string;
    recurring: any;
    active: boolean;
  }[];
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
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Shop | Christ Collective</title>
        <meta name="description" content="Browse our collection of faith-based products and merchandise from Christ Collective." />
      </Helmet>

      <div className="bg-gradient-to-r from-black to-gray-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Christ Collective <span className="text-[#D4AF37]">Shop</span>
          </h1>
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
      </div>

      <div className="container mx-auto px-4 py-8">
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
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
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
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-product-${product.id}`}>
                <div className="aspect-square bg-gray-100 relative">
                  {product.images && product.images[0] ? (
                    <img
                      src={product.images[0]}
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
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description || 'No description available'}
                  </p>
                  {product.prices && product.prices[0] && (
                    <div className="mt-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-[#D4AF37]" />
                      <span className="text-lg font-bold">
                        {formatPrice(product.prices[0].unit_amount, product.prices[0].currency)}
                      </span>
                      {product.prices[0].recurring && (
                        <span className="text-sm text-muted-foreground">
                          /{product.prices[0].recurring.interval}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Link href={`/shop/checkout/${product.prices?.[0]?.id}`} className="w-full">
                    <Button className="w-full bg-[#D4AF37] hover:bg-[#C4A030] text-black" data-testid={`button-buy-${product.id}`}>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Buy Now
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
