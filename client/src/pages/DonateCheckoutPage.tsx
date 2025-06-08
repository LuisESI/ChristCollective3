import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ArrowLeft, Heart, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet";
import type { Campaign } from "@shared/schema";

// Make sure to call loadStripe outside of a component's render
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.warn('Missing Stripe public key. Payment functionality will be limited.');
}

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

function CheckoutForm({ 
  campaignId, 
  amount, 
  tip, 
  message, 
  isAnonymous 
}: { 
  campaignId: string;
  amount: number;
  tip: number;
  message: string;
  isAnonymous: boolean;
}) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  
  // Calculate total amount
  const totalAmount = amount + tip;
  
  // Fetch payment intent when amount or tip changes
  useEffect(() => {
    if (!campaignId || amount <= 0) return;
    
    const fetchPaymentIntent = async () => {
      try {
        const response = await apiRequest("POST", "/api/donations/create-payment-intent", {
          amount: amount,
          tip: tip,
          campaignId,
        });
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error("Error creating payment intent:", error);
        toast({
          title: "Error",
          description: "Unable to process your donation at this time. Please try again later.",
          variant: "destructive",
        });
      }
    };
    
    fetchPaymentIntent();
  }, [campaignId, amount, tip, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/donate/success?campaignId=${campaignId}`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Thank You!",
        description: "Your donation has been processed successfully.",
      });
      navigate("/donate");
    }

    setIsProcessing(false);
  };

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Initializing payment...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      <Button 
        type="submit" 
        disabled={isProcessing || !stripe || !elements}
        className="w-full bg-yellow-500 text-black hover:bg-yellow-600 font-semibold"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Processing...
          </>
        ) : (
          `Donate $${totalAmount.toFixed(2)}`
        )}
      </Button>
    </form>
  );
}

export default function DonateCheckoutPage() {
  const { campaignId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Donation state
  const [amount, setAmount] = useState(0);
  const [tip, setTip] = useState(0); // Default tip to 0%
  const [tipPercentage, setTipPercentage] = useState(0); // Default tip percentage to 0%
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  // Preset amounts
  const presetAmounts = [100, 200, 300, 500, 1000, 1500];
  const suggestedAmount = 200; // Suggested amount
  
  // Tip percentages
  const tipPercentages = [0, 15, 18, 20];
  
  // Fetch campaign data
  const { data: campaign, isLoading: isCampaignLoading, error: campaignError } = useQuery<Campaign>({
    queryKey: [`/api/campaigns/${campaignId}`],
    enabled: !!campaignId,
  });

  // Calculate tip amount based on percentage
  useEffect(() => {
    if (amount > 0) {
      setTip((amount * tipPercentage) / 100);
    }
  }, [amount, tipPercentage]);

  // Handle preset amount selection
  const handleAmountSelect = (selectedAmount: number) => {
    setAmount(selectedAmount);
  };

  // Handle custom amount input
  const handleCustomAmountChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setAmount(numValue);
    } else {
      setAmount(0);
    }
  };

  // Handle tip percentage selection
  const handleTipPercentageSelect = (percentage: number) => {
    setTipPercentage(percentage);
  };

  // Handle custom tip input
  const handleCustomTipChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setTip(numValue);
      // Calculate percentage for display
      if (amount > 0) {
        setTipPercentage((numValue / amount) * 100);
      }
    }
  };

  if (isCampaignLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (campaignError || !campaign) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Campaign not found</h1>
          <p className="text-gray-600 mb-6">The campaign you're trying to donate to doesn't exist or has ended.</p>
          <Button asChild>
            <Link href="/donate">Browse Campaigns</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Payment Not Available</h1>
          <p className="text-gray-600 mb-6">Payment processing is currently unavailable. Please try again later.</p>
          <Button asChild>
            <Link href="/donate">Back to Campaigns</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Donate to {campaign.title} | Christ Collective</title>
        <meta name="description" content={`Support ${campaign.title} - ${campaign.description.substring(0, 160)}`} />
      </Helmet>
      
      <div className="min-h-screen bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <Link href={`/donate/${campaign.slug}`} className="inline-flex items-center text-yellow-400 hover:text-yellow-300 font-medium mb-4">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Fundraiser
            </Link>
          </div>

          <div className="max-w-2xl mx-auto">
            {/* Campaign Info */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center bg-gray-800 rounded-full px-4 py-2 mb-4">
                <Heart className="w-4 h-4 mr-2 text-yellow-400" />
                <span className="text-sm text-gray-300">You're supporting</span>
              </div>
              <h1 className="text-2xl font-bold mb-2">{campaign.title}</h1>
              <p className="text-yellow-400 text-sm">Your donation will benefit Christ Collective</p>
            </div>

            {/* Donation Form */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Enter your donation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Preset Amount Buttons */}
                <div className="grid grid-cols-3 gap-3">
                  {presetAmounts.map((presetAmount) => (
                    <Button
                      key={presetAmount}
                      variant={amount === presetAmount ? "default" : "outline"}
                      className={`relative ${
                        amount === presetAmount 
                          ? "bg-yellow-500 text-black hover:bg-yellow-600" 
                          : "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                      }`}
                      onClick={() => handleAmountSelect(presetAmount)}
                    >
                      {presetAmount === suggestedAmount && (
                        <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          SUGGESTED
                        </span>
                      )}
                      ${presetAmount}
                    </Button>
                  ))}
                </div>

                {/* Custom Amount Input */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">$</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount > 0 ? amount.toString() : ""}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    className="pl-8 text-xl h-12 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    min="1"
                    step="0.01"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">USD</span>
                </div>

                {/* Tip Section */}
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="mb-4">
                    <h3 className="font-semibold text-white mb-2">Tip Christ Collective services</h3>
                    <p className="text-sm text-gray-300 mb-4">
                      Christ Collective has a 0% platform fee for organizers. Christ Collective will continue offering its 
                      services thanks to donors who will leave an optional amount here:
                    </p>
                  </div>
                  
                  {/* Tip Percentage Display */}
                  <div className="text-center mb-4">
                    <span className="text-3xl font-bold text-white">{tipPercentage.toFixed(1)}%</span>
                  </div>
                  
                  {/* Tip Percentage Buttons */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {tipPercentages.map((percentage) => (
                      <Button
                        key={percentage}
                        variant={tipPercentage === percentage ? "default" : "outline"}
                        size="sm"
                        className={
                          tipPercentage === percentage 
                            ? "bg-white text-black hover:bg-gray-200" 
                            : "bg-gray-800 border-gray-600 text-white hover:bg-gray-600"
                        }
                        onClick={() => handleTipPercentageSelect(percentage)}
                      >
                        {percentage}%
                      </Button>
                    ))}
                  </div>
                  
                  {/* Custom Tip Input */}
                  <div>
                    <Label htmlFor="custom-tip" className="text-yellow-400 text-sm">Enter custom tip</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                      <Input
                        id="custom-tip"
                        type="number"
                        placeholder="0.00"
                        value={tip > 0 ? tip.toFixed(2) : ""}
                        onChange={(e) => handleCustomTipChange(e.target.value)}
                        className="pl-8 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                {/* Message Input */}
                <div>
                  <Label htmlFor="message" className="text-white">Leave a message (optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Share why this cause is important to you..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="mt-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>

                {/* Anonymous Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="anonymous" 
                    checked={isAnonymous}
                    onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                    className="border-gray-600"
                  />
                  <Label htmlFor="anonymous" className="text-white">Make my donation anonymous</Label>
                </div>

                {/* Donation Summary */}
                {amount > 0 && (
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-white font-semibold mb-3">Your donation</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-300">
                        <span>Your donation</span>
                        <span>${amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-300">
                        <span>Tip</span>
                        <span>${tip.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-300">
                        <span>Processing fee</span>
                        <span>$0.00</span>
                      </div>
                      <div className="border-t border-gray-600 pt-2">
                        <div className="flex justify-between font-semibold text-white">
                          <span>Total</span>
                          <span>${(amount + tip).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Processing */}
                {amount > 0 && (
                  <div className="mt-6">
                    <Elements 
                      stripe={stripePromise} 
                      options={{
                        appearance: {
                          theme: 'night',
                          variables: {
                            colorPrimary: '#eab308',
                            colorBackground: '#374151',
                            colorText: '#ffffff',
                            colorDanger: '#ef4444',
                            fontFamily: 'system-ui, sans-serif',
                            spacingUnit: '4px',
                            borderRadius: '6px',
                          },
                        },
                      }}
                    >
                      <CheckoutForm
                        campaignId={campaignId!}
                        amount={amount}
                        tip={tip}
                        message={message}
                        isAnonymous={isAnonymous}
                      />
                    </Elements>
                  </div>
                )}

                {amount === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Please select or enter a donation amount to continue</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}