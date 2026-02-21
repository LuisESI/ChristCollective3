import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useParams, Link } from 'wouter';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ShoppingCart, ArrowLeft, Package, Minus, Plus, Star } from 'lucide-react';
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

export default function ShopProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const [, navigate] = useLocation();
  const [selectedPriceId, setSelectedPriceId] = useState<string>('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ['/api/shop/products', productId],
    queryFn: async () => {
      const response = await fetch(buildApiUrl(`/api/shop/products/${productId}`), {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Product not found');
        }
        throw new Error('Failed to fetch product');
      }
      return response.json();
    },
    enabled: !!productId,
  });

  // Set default selected price when product loads
  if (product && !selectedPriceId && product.prices?.length > 0) {
    setSelectedPriceId(product.prices[0].id);
  }

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const getVariantLabel = (price: ProductPrice) => {
    const parts = [];
    if (price.metadata?.color) parts.push(price.metadata.color);
    if (price.metadata?.size) parts.push(price.metadata.size);
    return parts.length > 0 ? parts.join(' / ') : 'Standard';
  };

  const selectedPrice = product?.prices?.find(p => p.id === selectedPriceId);

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  const handleCheckout = () => {
    if (selectedPriceId) {
      navigate(`/shop/checkout/${selectedPriceId}?qty=${quantity}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <section className="py-8 bg-black">
          <div className="container mx-auto px-4">
            <Skeleton className="h-8 w-48 bg-gray-800" />
          </div>
        </section>
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <Skeleton className="aspect-square w-full bg-gray-200" />
                <div className="flex gap-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="w-20 h-20 bg-gray-200" />
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <Skeleton className="h-10 w-3/4 bg-gray-200" />
                <Skeleton className="h-24 w-full bg-gray-200" />
                <Skeleton className="h-8 w-32 bg-gray-200" />
                <Skeleton className="h-12 w-full bg-gray-200" />
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white">
        <section className="py-8 bg-black">
          <div className="container mx-auto px-4">
            <Link href="/shop">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Shop
              </Button>
            </Link>
          </div>
        </section>
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 text-center">
            <Package className="w-20 h-20 mx-auto text-gray-300 mb-6" />
            <h1 className="text-2xl font-bold text-black mb-4">Product Not Found</h1>
            <p className="text-gray-600 mb-8">The product you're looking for doesn't exist or has been removed.</p>
            <Link href="/shop">
              <Button className="bg-[#D4AF37] hover:bg-[#C4A030] text-black">
                Return to Shop
              </Button>
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{product.name} | Christ Collective Shop</title>
        <meta name="description" content={product.description || `Shop ${product.name} at Christ Collective`} />
        <meta property="og:title" content={`${product.name} | Christ Collective Shop`} />
        <meta property="og:description" content={product.description || `Shop ${product.name} at Christ Collective`} />
        {product.images?.[0] && <meta property="og:image" content={getImageUrl(product.images[0])} />}
      </Helmet>

      {/* Header */}
      <section className="py-6 bg-black">
        <div className="container mx-auto px-4">
          <Link href="/shop">
            <Button variant="ghost" className="text-white hover:bg-white/10" data-testid="button-back-to-shop">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Shop
            </Button>
          </Link>
        </div>
      </section>

      {/* Product Content */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Side - Images, Title, Description */}
            <div className="space-y-6">
              {/* Main Image */}
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {product.images && product.images[selectedImageIndex] ? (
                  <img
                    src={getImageUrl(product.images[selectedImageIndex])}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    data-testid="img-product-main"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-24 h-24 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                        index === selectedImageIndex ? 'border-[#D4AF37]' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      data-testid={`button-thumbnail-${index}`}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Title (visible on mobile, hidden on desktop) */}
              <div className="lg:hidden">
                <div className="flex items-center gap-3 mb-2">
                  {product.metadata?.category && (
                    <Badge variant="outline" className="text-black border-gray-300">
                      {product.metadata.category}
                    </Badge>
                  )}
                  {product.metadata?.featured === 'true' && (
                    <Badge className="bg-[#D4AF37] text-black">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-black mb-4" data-testid="text-product-name-mobile">
                  {product.name}
                </h1>
              </div>
            </div>

            {/* Right Side - Price, Variations, Quantity, Buy Button */}
            <div className="space-y-6">
              {/* Title (hidden on mobile, visible on desktop) */}
              <div className="hidden lg:block">
                <div className="flex items-center gap-3 mb-2">
                  {product.metadata?.category && (
                    <Badge variant="outline" className="text-black border-gray-300">
                      {product.metadata.category}
                    </Badge>
                  )}
                  {product.metadata?.featured === 'true' && (
                    <Badge className="bg-[#D4AF37] text-black">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-black" data-testid="text-product-name">
                  {product.name}
                </h1>
              </div>

              <Separator />

              {/* Price Display */}
              {selectedPrice && (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[#D4AF37]" data-testid="text-product-price">
                    {formatPrice(selectedPrice.unit_amount, selectedPrice.currency)}
                  </span>
                  {quantity > 1 && (
                    <span className="text-lg text-gray-500">
                      ({formatPrice(selectedPrice.unit_amount * quantity, selectedPrice.currency)} total)
                    </span>
                  )}
                </div>
              )}

              {/* Variant Selection */}
              {product.prices && product.prices.length > 1 && (
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-black">Select Variant</Label>
                  <RadioGroup value={selectedPriceId} onValueChange={setSelectedPriceId}>
                    {product.prices.map((price) => (
                      <div
                        key={price.id}
                        className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedPriceId === price.id 
                            ? 'border-[#D4AF37] bg-[#D4AF37]/5' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedPriceId(price.id)}
                        data-testid={`variant-${price.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={price.id} id={price.id} />
                          <Label htmlFor={price.id} className="cursor-pointer text-black">
                            <span className="font-medium">{getVariantLabel(price)}</span>
                            {price.metadata?.sku && (
                              <span className="text-xs text-gray-500 ml-2">
                                SKU: {price.metadata.sku}
                              </span>
                            )}
                          </Label>
                        </div>
                        <span className="font-bold text-lg text-black">
                          {formatPrice(price.unit_amount, price.currency)}
                        </span>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              <Separator />

              {/* Quantity Selector */}
              <div className="space-y-3">
                <Label className="text-base font-semibold text-black">Quantity</Label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="h-10 w-10 text-black"
                      data-testid="button-quantity-decrease"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 h-10 text-center border-0 text-black bg-white"
                      min="1"
                      data-testid="input-quantity"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleQuantityChange(1)}
                      className="h-10 w-10 text-black"
                      data-testid="button-quantity-increase"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Selected Summary */}
              {selectedPrice && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Selected:</span>
                    <span className="font-medium text-black">{getVariantLabel(selectedPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium text-black">{quantity}</span>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-black">Total:</span>
                    <span className="text-2xl font-bold text-[#D4AF37]">
                      {formatPrice(selectedPrice.unit_amount * quantity, selectedPrice.currency)}
                    </span>
                  </div>
                </div>
              )}

              {/* Buy Now Button */}
              <Button
                className="w-full h-14 text-lg bg-[#D4AF37] hover:bg-[#C4A030] text-black font-semibold"
                onClick={handleCheckout}
                disabled={!selectedPriceId}
                data-testid="button-buy-now"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Buy Now
              </Button>

              {/* Additional Info */}
              <div className="text-sm text-gray-500 text-center">
                Secure checkout powered by Stripe
              </div>

              {/* Description */}
              <Separator />
              <div className="prose prose-gray max-w-none">
                <h3 className="text-lg font-semibold text-black mb-3">Description</h3>
                <p className="text-gray-700 whitespace-pre-line" data-testid="text-product-description">
                  {product.description || 'No description available.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
