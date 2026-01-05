import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, ArrowRight, ShoppingBag, Loader2 } from 'lucide-react';
import { buildApiUrl } from '@/lib/api-config';

export default function ShopSuccessPage() {
  const [, navigate] = useLocation();
  const [orderId, setOrderId] = useState<number | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const orderCreatedRef = useRef(false);

  useEffect(() => {
    const createOrder = async () => {
      if (orderCreatedRef.current) return;
      orderCreatedRef.current = true;

      const urlParams = new URLSearchParams(window.location.search);
      const paymentIntentId = urlParams.get('payment_intent');
      const priceId = urlParams.get('priceId');

      if (!paymentIntentId || !priceId) {
        setError('Missing payment information');
        setIsCreatingOrder(false);
        return;
      }

      try {
        const response = await fetch(buildApiUrl('/api/shop/create-order'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            paymentIntentId,
            priceId,
            quantity: parseInt(urlParams.get('qty') || '1', 10),
            customerEmail: urlParams.get('email') || '',
            customerPhone: urlParams.get('phone') || '',
            customerName: urlParams.get('customerName') || urlParams.get('shippingName') || '',
            shippingName: urlParams.get('shippingName') || urlParams.get('customerName') || '',
            shippingAddress: urlParams.get('address') || '',
            shippingAddress2: urlParams.get('address2') || '',
            shippingCity: urlParams.get('city') || '',
            shippingState: urlParams.get('state') || '',
            shippingZipCode: urlParams.get('zip') || '',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setOrderId(data.orderId);
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Failed to create order');
        }
      } catch (err) {
        console.error('Error creating order:', err);
        setError('Failed to process order');
      } finally {
        setIsCreatingOrder(false);
      }
    };

    createOrder();
  }, []);

  if (isCreatingOrder) {
    return (
      <div className="min-h-screen bg-black py-16">
        <Helmet>
          <title>Processing Order | Christ Collective Shop</title>
        </Helmet>

        <div className="container mx-auto px-4 max-w-lg">
          <Card className="bg-gray-900 border-gray-800 text-center">
            <CardContent className="pt-10 pb-10">
              <Loader2 className="w-12 h-12 text-[#D4AF37] mx-auto mb-4 animate-spin" />
              <p className="text-white text-lg">Processing your order...</p>
              <p className="text-gray-400 text-sm mt-2">Please wait while we confirm your purchase.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-16">
      <Helmet>
        <title>Order Confirmed | Christ Collective Shop</title>
      </Helmet>

      <div className="container mx-auto px-4 max-w-lg">
        <Card className="bg-gray-900 border-gray-800 text-center">
          <CardHeader className="pb-4">
            <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-[#D4AF37]">Order Confirmed!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-300">
              Thank you for your purchase! Your order has been successfully processed.
            </p>

            {orderId && (
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Order Number</p>
                <p className="font-bold text-white text-xl">#{orderId}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-900/30 rounded-lg p-4">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="bg-[#D4AF37]/10 rounded-lg p-4">
              <Package className="w-8 h-8 text-[#D4AF37] mx-auto mb-2" />
              <p className="text-sm text-gray-300">
                You will receive an email confirmation shortly with your order details and tracking information once shipped.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button
                onClick={() => navigate('/shop')}
                className="bg-[#D4AF37] hover:bg-[#C4A030] text-black"
                data-testid="button-continue-shopping"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="border-gray-700 text-white hover:bg-gray-800"
              >
                Go to Home
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
