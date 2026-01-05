import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Package, Lock, ShoppingCart, MapPin } from 'lucide-react';
import { buildApiUrl, getImageUrl } from '@/lib/api-config';

interface PriceDetails {
  id: string;
  unit_amount: number;
  currency: string;
  product: {
    id: string;
    name: string;
    description: string;
    images: string[];
  };
}

interface ShippingInfo {
  name: string;
  address: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
}

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' },
];

function CheckoutForm({ priceDetails, clientSecret }: { priceDetails: PriceDetails; clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    name: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [shippingErrors, setShippingErrors] = useState<Partial<ShippingInfo>>({});

  const validateShipping = (): boolean => {
    const errors: Partial<ShippingInfo> = {};
    
    if (!shippingInfo.name.trim()) {
      errors.name = 'Full name is required';
    }
    if (!shippingInfo.address.trim()) {
      errors.address = 'Street address is required';
    }
    if (!shippingInfo.city.trim()) {
      errors.city = 'City is required';
    }
    if (!shippingInfo.state) {
      errors.state = 'State is required';
    }
    if (!shippingInfo.zipCode.trim()) {
      errors.zipCode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(shippingInfo.zipCode.trim())) {
      errors.zipCode = 'Invalid ZIP code format';
    }

    setShippingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateShipping()) {
      toast({
        title: 'Shipping Information Required',
        description: 'Please fill in all shipping fields correctly.',
        variant: 'destructive',
      });
      return;
    }

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/shop/success?priceId=${priceDetails.id}`,
          shipping: {
            name: shippingInfo.name,
            address: {
              line1: shippingInfo.address,
              line2: shippingInfo.address2 || undefined,
              city: shippingInfo.city,
              state: shippingInfo.state,
              postal_code: shippingInfo.zipCode,
              country: 'US',
            },
          },
        },
      });

      if (error) {
        toast({
          title: 'Payment Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Payment Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const updateShippingField = (field: keyof ShippingInfo, value: string) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }));
    if (shippingErrors[field]) {
      setShippingErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center gap-4 mb-4">
          {priceDetails.product.images?.[0] ? (
            <img
              src={getImageUrl(priceDetails.product.images[0])}
              alt={priceDetails.product.name}
              className="w-16 h-16 rounded object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded bg-gray-700 flex items-center justify-center">
              <Package className="w-8 h-8 text-gray-500" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-white">{priceDetails.product.name}</h3>
            <p className="text-sm text-gray-400 line-clamp-1">{priceDetails.product.description}</p>
          </div>
        </div>
        <Separator className="my-4 bg-gray-700" />
        <div className="flex justify-between items-center">
          <span className="font-semibold text-white">Total</span>
          <span className="font-bold text-lg text-[#D4AF37]">
            {formatPrice(priceDetails.unit_amount, priceDetails.currency)}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#D4AF37]" />
          <h3 className="font-semibold text-lg text-[#D4AF37]">Shipping Address</h3>
        </div>
        <p className="text-sm text-gray-400">We currently only ship within the United States.</p>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-white">Full Name *</Label>
            <Input
              id="name"
              value={shippingInfo.name}
              onChange={(e) => updateShippingField('name', e.target.value)}
              placeholder="John Doe"
              className={`mt-1 bg-white text-black ${shippingErrors.name ? 'border-red-500' : ''}`}
              data-testid="input-shipping-name"
            />
            {shippingErrors.name && (
              <p className="text-sm text-red-500 mt-1">{shippingErrors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="address" className="text-white">Street Address *</Label>
            <Input
              id="address"
              value={shippingInfo.address}
              onChange={(e) => updateShippingField('address', e.target.value)}
              placeholder="123 Main St"
              className={`mt-1 bg-white text-black ${shippingErrors.address ? 'border-red-500' : ''}`}
              data-testid="input-shipping-address"
            />
            {shippingErrors.address && (
              <p className="text-sm text-red-500 mt-1">{shippingErrors.address}</p>
            )}
          </div>

          <div>
            <Label htmlFor="address2" className="text-white">Address Line 2 <span className="text-gray-400">(Optional)</span></Label>
            <Input
              id="address2"
              value={shippingInfo.address2}
              onChange={(e) => updateShippingField('address2', e.target.value)}
              placeholder="Apt, Suite, Unit, etc."
              className="mt-1 bg-white text-black"
              data-testid="input-shipping-address2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city" className="text-white">City *</Label>
              <Input
                id="city"
                value={shippingInfo.city}
                onChange={(e) => updateShippingField('city', e.target.value)}
                placeholder="New York"
                className={`mt-1 bg-white text-black ${shippingErrors.city ? 'border-red-500' : ''}`}
                data-testid="input-shipping-city"
              />
              {shippingErrors.city && (
                <p className="text-sm text-red-500 mt-1">{shippingErrors.city}</p>
              )}
            </div>

            <div>
              <Label htmlFor="state" className="text-white">State *</Label>
              <Select
                value={shippingInfo.state}
                onValueChange={(value) => updateShippingField('state', value)}
              >
                <SelectTrigger 
                  className={`mt-1 bg-white text-black ${shippingErrors.state ? 'border-red-500' : ''}`}
                  data-testid="select-shipping-state"
                >
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {US_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {shippingErrors.state && (
                <p className="text-sm text-red-500 mt-1">{shippingErrors.state}</p>
              )}
            </div>
          </div>

          <div className="w-1/2">
            <Label htmlFor="zipCode" className="text-white">ZIP Code *</Label>
            <Input
              id="zipCode"
              value={shippingInfo.zipCode}
              onChange={(e) => updateShippingField('zipCode', e.target.value)}
              placeholder="10001"
              className={`mt-1 bg-white text-black ${shippingErrors.zipCode ? 'border-red-500' : ''}`}
              data-testid="input-shipping-zip"
            />
            {shippingErrors.zipCode && (
              <p className="text-sm text-red-500 mt-1">{shippingErrors.zipCode}</p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-white">Payment Method</h3>
        <PaymentElement />
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-[#D4AF37] hover:bg-[#C4A030] text-black font-semibold py-3 text-lg"
        data-testid="button-pay"
      >
        {isProcessing ? 'Processing...' : `Pay ${formatPrice(priceDetails.unit_amount, priceDetails.currency)}`}
      </Button>

      <div className="flex items-center justify-center text-sm text-gray-400">
        <Lock className="w-4 h-4 mr-1" />
        Your payment information is secure and encrypted
      </div>
    </form>
  );
}

export default function ShopCheckoutPage() {
  const { priceId } = useParams<{ priceId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublishableKey = async () => {
      try {
        const response = await fetch(buildApiUrl('/api/stripe/publishable-key'), {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setStripePromise(loadStripe(data.publishableKey));
        }
      } catch (error) {
        console.error('Failed to load Stripe:', error);
      }
    };
    fetchPublishableKey();
  }, []);

  const { data: priceDetails, isLoading: isPriceLoading } = useQuery<PriceDetails>({
    queryKey: ['/api/shop/price', priceId],
    queryFn: async () => {
      const response = await fetch(buildApiUrl(`/api/shop/price/${priceId}`), {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch price details');
      return response.json();
    },
    enabled: !!priceId,
  });

  const createPaymentIntentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(buildApiUrl('/api/shop/create-payment-intent'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ priceId }),
      });
      if (!response.ok) throw new Error('Failed to create payment intent');
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to initialize payment',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (priceId && priceDetails && !clientSecret) {
      createPaymentIntentMutation.mutate();
    }
  }, [priceId, priceDetails]);

  if (isPriceLoading) {
    return (
      <div className="min-h-screen bg-black py-8">
        <div className="container mx-auto px-4 max-w-lg">
          <Skeleton className="h-8 w-32 mb-6 bg-gray-800" />
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <Skeleton className="h-20 w-full mb-4 bg-gray-800" />
              <Skeleton className="h-40 w-full bg-gray-800" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!priceDetails) {
    return (
      <div className="min-h-screen bg-black py-8">
        <div className="container mx-auto px-4 max-w-lg">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6 text-center">
              <Package className="w-16 h-16 mx-auto text-gray-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2 text-white">Product Not Found</h2>
              <p className="text-gray-400 mb-4">The product you're looking for doesn't exist.</p>
              <Button onClick={() => navigate('/shop')} className="bg-[#D4AF37] hover:bg-[#C4A030] text-black">Back to Shop</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8">
      <Helmet>
        <title>Checkout | Christ Collective Shop</title>
      </Helmet>

      <div className="container mx-auto px-4 max-w-lg">
        <Button
          variant="ghost"
          className="mb-6 text-white hover:text-[#D4AF37]"
          onClick={() => navigate('/shop')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Shop
        </Button>

        <Card className="bg-black border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#D4AF37]">
              <ShoppingCart className="w-5 h-5" />
              Checkout
            </CardTitle>
            <CardDescription className="text-gray-400">Complete your purchase</CardDescription>
          </CardHeader>
          <CardContent>
            {stripePromise && clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#D4AF37' } } }}>
                <CheckoutForm priceDetails={priceDetails} clientSecret={clientSecret} />
              </Elements>
            ) : (
              <div className="py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37] mx-auto mb-4" />
                <p className="text-gray-400">Initializing payment...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
