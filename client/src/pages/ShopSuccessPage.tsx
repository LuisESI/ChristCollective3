import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, ArrowRight, ShoppingBag } from 'lucide-react';

export default function ShopSuccessPage() {
  const [, navigate] = useLocation();
  const [paymentIntent, setPaymentIntent] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const piId = urlParams.get('payment_intent');
    setPaymentIntent(piId);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <Helmet>
        <title>Order Confirmed | Christ Collective Shop</title>
      </Helmet>

      <div className="container mx-auto px-4 max-w-lg">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Order Confirmed!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              Thank you for your purchase! Your order has been successfully processed.
            </p>

            {paymentIntent && (
              <div className="bg-gray-100 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Order Reference</p>
                <p className="font-mono text-sm">{paymentIntent}</p>
              </div>
            )}

            <div className="bg-[#D4AF37]/10 rounded-lg p-4">
              <Package className="w-8 h-8 text-[#D4AF37] mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                You will receive an email confirmation shortly with your order details.
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
