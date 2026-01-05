import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Plus, Package, ArrowLeft, Trash2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { buildApiUrl, getImageUrl } from '@/lib/api-config';
import { queryClient } from '@/lib/queryClient';

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
    metadata?: Record<string, string>;
  }[];
}

const variantSchema = z.object({
  color: z.string().optional(),
  size: z.string().optional(),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  sku: z.string().optional(),
});

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  featured: z.boolean().default(false),
  images: z.array(z.string()).default([]),
  variants: z.array(variantSchema).min(1, 'At least one variant is required'),
});

type VariantFormData = z.infer<typeof variantSchema>;
type ProductFormData = z.infer<typeof productSchema>;

export default function AdminProductsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      featured: false,
      images: [],
      variants: [{ color: '', size: '', price: 0, sku: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variants',
  });

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/shop/products'],
    queryFn: async () => {
      const response = await fetch(buildApiUrl('/api/shop/products'), {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!user?.isAdmin,
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const response = await fetch(buildApiUrl('/api/admin/products'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          category: data.category || '',
          featured: data.featured || false,
          images: data.images,
          variants: data.variants.filter(v => v.price > 0),
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create product');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop/products'] });
      setIsDialogOpen(false);
      form.reset({
        name: '',
        description: '',
        category: '',
        featured: false,
        images: [],
        variants: [{ color: '', size: '', price: 0, sku: '' }],
      });
      toast({
        title: 'Product Created',
        description: 'The product has been added to your shop.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create product',
        variant: 'destructive',
      });
    },
  });

  const toggleProductMutation = useMutation({
    mutationFn: async ({ productId, active }: { productId: string; active: boolean }) => {
      const response = await fetch(buildApiUrl(`/api/admin/products/${productId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ active }),
      });
      if (!response.ok) throw new Error('Failed to update product');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop/products'] });
      toast({
        title: 'Product Updated',
        description: 'Product status has been updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update product',
        variant: 'destructive',
      });
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('productImage', file);

      const response = await fetch(buildApiUrl('/api/admin/products/upload-image'), {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      const currentImages = form.getValues('images') || [];
      form.setValue('images', [...currentImages, result.imageUrl]);
      
      toast({
        title: "Image uploaded",
        description: "Product image has been added",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const currentImages = form.getValues('images') || [];
    form.setValue('images', currentImages.filter((_, i) => i !== index));
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const getVariantLabel = (price: { metadata?: Record<string, string> }) => {
    const parts = [];
    if (price.metadata?.color) parts.push(price.metadata.color);
    if (price.metadata?.size) parts.push(price.metadata.size);
    return parts.length > 0 ? parts.join(' / ') : 'Default';
  };

  const onSubmit = (data: ProductFormData) => {
    createProductMutation.mutate(data);
  };

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You need admin privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const watchedImages = form.watch('images') || [];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Manage Products | Christ Collective</title>
      </Helmet>

      <div className="bg-gradient-to-r from-black to-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            className="text-white mb-4 hover:bg-white/10"
            onClick={() => navigate('/shop')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shop
          </Button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Product Management</h1>
              <p className="text-gray-300 mt-2">Create and manage products for your shop</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#D4AF37] hover:bg-[#C4A030] text-black" data-testid="button-add-product">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Create New Product</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter product name" {...field} data-testid="input-product-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Product description" {...field} data-testid="input-product-description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Apparel, Books, Accessories" {...field} data-testid="input-product-category" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="featured"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                              <FormLabel>Featured Product</FormLabel>
                              <FormDescription>Display this product prominently</FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-product-featured"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="space-y-3">
                        <FormLabel>Product Images</FormLabel>
                        <div className="flex flex-wrap gap-3">
                          {watchedImages.map((image, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={getImageUrl(image)}
                                alt={`Product ${index + 1}`}
                                className="w-24 h-24 object-cover rounded-lg border"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#D4AF37] transition-colors">
                            {uploadingImage ? (
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#D4AF37]" />
                            ) : (
                              <>
                                <Upload className="w-6 h-6 text-gray-400" />
                                <span className="text-xs text-gray-400 mt-1">Upload</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              disabled={uploadingImage}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-muted-foreground">Upload product images (JPG, PNG, max 5MB each)</p>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-base">Product Variants *</FormLabel>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ color: '', size: '', price: 0, sku: '' })}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Variant
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Add different variations of your product (colors, sizes, etc.) with their prices
                        </p>

                        {fields.map((field, index) => (
                          <Card key={field.id} className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-sm font-medium">Variant {index + 1}</span>
                              {fields.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => remove(index)}
                                  className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <FormField
                                control={form.control}
                                name={`variants.${index}.color`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">Color</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g., Black, White" {...field} data-testid={`input-variant-color-${index}`} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`variants.${index}.size`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">Size</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g., S, M, L, XL" {...field} data-testid={`input-variant-size-${index}`} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`variants.${index}.price`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">Price (USD) *</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        data-testid={`input-variant-price-${index}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`variants.${index}.sku`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">SKU (Optional)</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g., SHIRT-BLK-M" {...field} data-testid={`input-variant-sku-${index}`} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </Card>
                        ))}
                        {form.formState.errors.variants && (
                          <p className="text-sm text-red-500">{form.formState.errors.variants.message}</p>
                        )}
                      </div>

                      <DialogFooter>
                        <Button
                          type="submit"
                          className="w-full bg-[#D4AF37] hover:bg-[#C4A030] text-black"
                          disabled={createProductMutation.isPending}
                          data-testid="button-submit-product"
                        >
                          {createProductMutation.isPending ? 'Creating...' : 'Create Product'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Products ({products.length})
            </CardTitle>
            <CardDescription>Manage your shop products and prices</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Products Yet</h3>
                <p className="text-muted-foreground mb-4">Start by adding your first product to the shop.</p>
                <Button onClick={() => setIsDialogOpen(true)} className="bg-[#D4AF37] hover:bg-[#C4A030] text-black">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Product
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Variants</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                            {product.images?.[0] ? (
                              <img src={getImageUrl(product.images[0])} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.metadata?.category ? (
                          <Badge variant="outline">{product.metadata.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {product.prices?.slice(0, 3).map((price, idx) => (
                            <div key={price.id} className="text-sm">
                              <span className="font-medium">{formatPrice(price.unit_amount, price.currency)}</span>
                              <span className="text-muted-foreground ml-1">({getVariantLabel(price)})</span>
                            </div>
                          ))}
                          {product.prices?.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{product.prices.length - 3} more</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.active ? 'default' : 'secondary'}>
                          {product.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={product.active}
                            onCheckedChange={(active) => toggleProductMutation.mutate({ productId: product.id, active })}
                            data-testid={`switch-product-active-${product.id}`}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
