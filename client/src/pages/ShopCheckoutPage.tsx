import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Package, Lock, CheckCircle, ShoppingCart } from 'lucide-react';
import { buildApiUrl } from '@/lib/api-config';

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

function CheckoutForm({ priceDetails, clientSecret }: { priceDetails: PriceDetails; clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/shop/success?priceId=${priceDetails.id}`,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-4 mb-4">
          {priceDetails.product.images?.[0] ? (
            <img
              src={priceDetails.product.images[0]}
              alt={priceDetails.product.name}
              className="w-16 h-16 rounded object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded bg-gray-200 flex items-center justify-center">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div>
            <h3 className="font-semibold">{priceDetails.product.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1">{priceDetails.product.description}</p>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="flex justify-between items-center">
          <span className="font-semibold">Total</span>
          <span className="font-bold text-lg">
            {formatPrice(priceDetails.unit_amount, priceDetails.currency)}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Payment Method</h3>
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

      <div className="flex items-center justify-center text-sm text-gray-500">
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-lg">
          <Skeleton className="h-8 w-32 mb-6" />
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-20 w-full mb-4" />
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!priceDetails) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-lg">
          <Card>
            <CardContent className="pt-6 text-center">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
              <p className="text-muted-foreground mb-4">The product you're looking for doesn't exist.</p>
              <Button onClick={() => navigate('/shop')}>Back to Shop</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Helmet>
        <title>Checkout | Christ Collective Shop</title>
      </Helmet>

      <div className="container mx-auto px-4 max-w-lg">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/shop')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Shop
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Checkout
            </CardTitle>
            <CardDescription>Complete your purchase</CardDescription>
          </CardHeader>
          <CardContent>
            {stripePromise && clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm priceDetails={priceDetails} clientSecret={clientSecret} />
              </Elements>
            ) : (
              <div className="py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37] mx-auto mb-4" />
                <p className="text-muted-foreground">Initializing payment...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
