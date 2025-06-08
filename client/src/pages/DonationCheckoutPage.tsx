import { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, Heart, Users, Lock } from 'lucide-react';
import { Campaign } from '@shared/schema';

// Load Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

const PRESET_AMOUNTS = [100, 200, 300, 500, 1000, 1500];

function CheckoutForm({ campaign, amount, tip }: { campaign: Campaign; amount: number; tip: number }) {
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
          return_url: `${window.location.origin}/donate/${campaign.slug}?success=true`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const totalAmount = amount + tip;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Your donation</span>
          <span className="font-semibold text-black">${amount.toFixed(2)}</span>
        </div>
        {tip > 0 && (
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Tip Christ Collective</span>
            <span className="font-semibold text-black">${tip.toFixed(2)}</span>
          </div>
        )}
        <Separator className="my-2" />
        <div className="flex justify-between items-center">
          <span className="font-semibold text-black">Total</span>
          <span className="font-bold text-lg text-black">${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Payment method</h3>
        <PaymentElement />
      </div>

      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 text-lg"
      >
        {isProcessing ? 'Processing...' : `Donate $${totalAmount.toFixed(2)}`}
      </Button>

      <div className="flex items-center justify-center text-sm text-gray-500">
        <Lock className="w-4 h-4 mr-1" />
        Your payment information is secure and encrypted
      </div>
    </form>
  );
}

export default function DonationCheckoutPage() {
  const { campaignId } = useParams();
  const [amount, setAmount] = useState(200);
  const [customAmount, setCustomAmount] = useState('');
  const [tip, setTip] = useState(0);
  const [clientSecret, setClientSecret] = useState('');
  const { toast } = useToast();

  const { data: campaign, isLoading: isLoadingCampaign } = useQuery<Campaign>({
    queryKey: [`/api/campaigns/${campaignId}`],
  });

  const createPaymentIntentMutation = useMutation({
    mutationFn: async (donationAmount: number) => {
      const response = await apiRequest('POST', '/api/donations/create-payment-intent', {
        campaignId,
        amount: donationAmount + tip,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (campaignId && amount > 0) {
      createPaymentIntentMutation.mutate(amount);
    }
  }, [campaignId, amount, tip]);

  const handleAmountSelect = (selectedAmount: number) => {
    setAmount(selectedAmount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setAmount(numValue);
    }
  };

  const calculateTip = (percentage: number) => {
    setTip(amount * (percentage / 100));
  };

  function formatCurrency(amount: string | number): string {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value || 0);
  }

  if (isLoadingCampaign) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4 w-1/3" />
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="h-6 bg-gray-200 rounded mb-4 w-2/3" />
                <div className="h-4 bg-gray-100 rounded mb-2 w-full" />
                <div className="h-4 bg-gray-100 rounded mb-4 w-3/4" />
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-12 bg-gray-200 rounded" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Campaign Not Found</h1>
            <p className="text-gray-600 mb-6">The campaign you're trying to donate to doesn't exist.</p>
            <Link href="/donate" className="text-primary hover:text-primary/80 font-medium">
              ← Back to All Campaigns
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link href={`/donate/${campaign.slug}`} className="inline-flex items-center text-primary hover:text-primary/80 font-medium mb-4">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Fundraiser
            </Link>
          </div>

          {/* Main Content */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-4">
                {campaign.image ? (
                  <img 
                    src={campaign.image} 
                    alt={campaign.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Heart className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="text-sm text-[#D4AF37] mb-1">You're supporting</p>
                  <CardTitle className="text-xl">{campaign.title}</CardTitle>
                  <p className="text-sm text-[#D4AF37]">Your donation will benefit Christ Collective</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Amount Selection */}
              <div>
                <Label className="text-base font-semibold mb-4 block">Enter your donation</Label>
                
                {/* Preset amounts */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {PRESET_AMOUNTS.map((presetAmount) => (
                    <Button
                      key={presetAmount}
                      variant={amount === presetAmount && !customAmount ? "default" : "outline"}
                      className={`h-12 relative ${
                        amount === presetAmount && !customAmount 
                          ? "bg-primary text-white border-primary" 
                          : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                      onClick={() => handleAmountSelect(presetAmount)}
                    >
                      ${presetAmount}
                      {presetAmount === 200 && (
                        <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          SUGGESTED
                        </span>
                      )}
                    </Button>
                  ))}
                </div>

                {/* Custom amount */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-2xl font-bold text-[#D4AF37]">
                    $
                  </span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    className="pl-8 text-2xl font-bold h-14 text-right pr-16"
                    min="1"
                    step="0.01"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-lg text-gray-500">
                    USD
                  </span>
                </div>
              </div>

              {/* Tip Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="font-semibold text-black">Tip Christ Collective services</h4>
                    <p className="text-sm text-gray-600">
                      Christ Collective has a 0% platform fee for organizers. Christ Collective will continue offering its 
                      services thanks to donors who will leave an optional amount here:
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-2xl font-bold text-black">{amount > 0 ? ((tip / amount) * 100).toFixed(1) : '0.0'}%</span>
                </div>
                
                <div className="flex space-x-2 mb-4">
                  <Button
                    variant={Math.abs(tip - amount * 0.15) < 0.01 ? "default" : "outline"}
                    size="sm"
                    onClick={() => calculateTip(15)}
                    className="text-xs"
                  >
                    15%
                  </Button>
                  <Button
                    variant={Math.abs(tip - amount * 0.18) < 0.01 ? "default" : "outline"}
                    size="sm"
                    onClick={() => calculateTip(18)}
                    className="text-xs"
                  >
                    18%
                  </Button>
                  <Button
                    variant={Math.abs(tip - amount * 0.20) < 0.01 ? "default" : "outline"}
                    size="sm"
                    onClick={() => calculateTip(20)}
                    className="text-xs"
                  >
                    20%
                  </Button>
                  <Button
                    variant={tip === 0 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTip(0)}
                    className="text-xs"
                  >
                    0%
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-tip" className="text-sm font-medium text-[#D4AF37]">Enter custom tip amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="custom-tip"
                      type="number"
                      placeholder="0.00"
                      value={tip > 0 ? tip.toFixed(2) : ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value >= 0) {
                          setTip(value);
                        } else if (e.target.value === '') {
                          setTip(0);
                        }
                      }}
                      className="pl-8 pr-4"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Form */}
              {clientSecret && (
                <Elements 
                  stripe={stripePromise} 
                  options={{ 
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                    }
                  }}
                >
                  <CheckoutForm campaign={campaign} amount={amount} tip={tip} />
                </Elements>
              )}

              {!clientSecret && (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                  <p className="text-gray-600 mt-2">Initializing payment...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer Info */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              By continuing, you agree with Christ Collective's{' '}
              <Link href="/terms" className="text-primary hover:underline">terms</Link> and{' '}
              <Link href="/privacy" className="text-primary hover:underline">privacy policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}