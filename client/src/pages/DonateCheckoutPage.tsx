import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ArrowLeft, Heart, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet";

// Make sure to call loadStripe outside of a component's render
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.warn('Missing Stripe public key. Payment functionality will be limited.');
}

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

function CheckoutForm({ campaignId, amount, setAmount, message, setMessage, isAnonymous, setIsAnonymous }: { 
  campaignId: string;
  amount: string;
  setAmount: (amount: string) => void;
  message: string;
  setMessage: (message: string) => void;
  isAnonymous: boolean;
  setIsAnonymous: (isAnonymous: boolean) => void;
}) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  
  // Fetch payment intent when amount changes
  useEffect(() => {
    if (!campaignId || !amount || parseFloat(amount) <= 0) return;
    
    const fetchPaymentIntent = async () => {
      try {
        const response = await apiRequest("POST", "/api/donations/create-payment-intent", {
          amount: parseFloat(amount),
          campaignId,
          message,
          isAnonymous
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
  }, [campaignId, amount, toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    if (parseFloat(amount) <= 0) {
      setErrorMessage("Please enter a valid donation amount");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(undefined);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/donate/thank-you?campaign=${campaignId}&amount=${amount}`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        toast({
          title: "Payment failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setErrorMessage(error.message);
      toast({
        title: "Unexpected error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimal points
    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
      setAmount(value);
    }
  };

  const predefinedAmounts = ["10", "25", "50", "100", "250"];

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div>
          <Label htmlFor="amount" className="text-lg font-medium">Donation Amount</Label>
          <div className="mt-2 relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              $
            </span>
            <Input
              id="amount"
              type="text"
              value={amount}
              onChange={handleAmountChange}
              className="pl-8"
              placeholder="0.00"
              required
            />
          </div>
          
          <div className="flex flex-wrap gap-2 mt-3">
            {predefinedAmounts.map((presetAmount) => (
              <Button
                key={presetAmount}
                type="button"
                variant={amount === presetAmount ? "default" : "outline"}
                className="flex-1"
                onClick={() => setAmount(presetAmount)}
              >
                ${presetAmount}
              </Button>
            ))}
          </div>
        </div>
        
        <div>
          <Label htmlFor="message" className="text-lg font-medium">Message (Optional)</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-2"
            placeholder="Share a few words of encouragement..."
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="anonymous" 
            checked={isAnonymous}
            onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
          />
          <Label htmlFor="anonymous">Make my donation anonymous</Label>
        </div>
        
        {amount && parseFloat(amount) > 0 && (
          <div>
            <Label className="text-lg font-medium">Payment Details</Label>
            <div className="mt-2 bg-white border border-gray-200 rounded-md p-4">
              <PaymentElement />
            </div>
          </div>
        )}
      
        {errorMessage && (
          <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
            {errorMessage}
          </div>
        )}
        
        <div className="flex justify-between pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate("/donate")}
            disabled={isProcessing}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <Button 
            type="submit" 
            disabled={!stripe || !elements || isProcessing || !amount || parseFloat(amount) <= 0}
            className="min-w-[150px]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Heart className="mr-2 h-4 w-4" />
                Donate ${amount || "0"}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default function DonateCheckoutPage() {
  const { campaignId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState("25");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Handle authentication more gracefully
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      // We'll navigate to login but set a better handler
      // to avoid the runtime error modal
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 100);
    }
  }, [isAuthLoading, isAuthenticated]);

  // Fetch campaign with better error handling
  const { data: campaign, isLoading: isCampaignLoading } = useQuery({
    queryKey: [`/api/campaigns/${campaignId}`],
    enabled: !!campaignId && isAuthenticated,
    queryFn: async ({ queryKey }) => {
      try {
        const res = await fetch(queryKey[0] as string, { credentials: "include" });
        if (!res.ok) {
          if (res.status === 401) {
            // Handle unauthorized gracefully
            return null;
          }
          throw new Error('Failed to fetch campaign');
        }
        return res.json();
      } catch (error) {
        console.error("Error fetching campaign:", error);
        toast({
          title: "Error",
          description: "Unable to load campaign information. Please try again.",
          variant: "destructive",
        });
        navigate("/donate");
        return null;
      }
    }
  });

  // Initialize payment intent
  useEffect(() => {
    if (!isAuthenticated || !campaignId || !amount || parseFloat(amount) <= 0) return;
    
    setIsLoading(true);
    
    apiRequest("POST", "/api/donations/create-payment-intent", {
      amount: parseFloat(amount),
      campaignId,
    })
      .then(res => res.json())
      .then(data => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error("No client secret returned");
        }
      })
      .catch(error => {
        toast({
          title: "Error",
          description: "Unable to process donation. Please try again later.",
          variant: "destructive",
        });
        console.error("Payment intent error:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isAuthenticated, campaignId, amount, toast]);

  if (isAuthLoading || !isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isCampaignLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4 w-3/4" />
            <div className="h-4 bg-gray-100 rounded mb-8 w-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-7">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="h-6 bg-gray-200 rounded mb-4 w-1/4" />
                  <div className="h-10 bg-gray-200 rounded mb-6 w-full" />
                  <div className="h-6 bg-gray-200 rounded mb-4 w-1/3" />
                  <div className="h-24 bg-gray-200 rounded mb-6 w-full" />
                  <div className="h-10 bg-gray-200 rounded w-full" />
                </div>
              </div>
              <div className="md:col-span-5">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="h-6 bg-gray-200 rounded mb-4 w-2/3" />
                  <div className="h-4 bg-gray-100 rounded mb-6 w-full" />
                  <div className="h-4 bg-gray-100 rounded mb-2 w-3/4" />
                  <div className="h-4 bg-gray-100 rounded mb-2 w-4/5" />
                  <div className="h-4 bg-gray-100 rounded mb-4 w-2/3" />
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
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Campaign not found</h1>
          <p className="text-gray-600 mb-6">The campaign you're trying to donate to doesn't exist or has ended.</p>
          <Button asChild>
            <Link href="/donate">
              <a>Browse Campaigns</a>
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  function formatCurrency(amount: string): string {
    const value = parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  }

  return (
    <>
      <Helmet>
        <title>Donate to {campaign.title} - Christ Collective</title>
        <meta name="description" content={`Support ${campaign.title} with your donation. Every contribution makes a difference.`} />
      </Helmet>
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <Button 
              asChild
              variant="ghost"
              className="mb-4"
            >
              <Link href={`/campaigns/${campaign.slug}`}>
                <a className="flex items-center">
                  <ArrowLeft className="mr-2" size={16} />
                  Back to Campaign
                </a>
              </Link>
            </Button>
            
            <h1 className="text-3xl font-bold mb-2">Donate to {campaign.title}</h1>
            <p className="text-gray-600">Your contribution helps make a difference.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-7">
              <Card>
                <CardHeader>
                  <CardTitle>Your Donation</CardTitle>
                </CardHeader>
                <CardContent>
                  {!stripePromise ? (
                    <div className="py-8 text-center text-gray-500">
                      <p>Payment processing is currently unavailable. Please try again later.</p>
                    </div>
                  ) : clientSecret ? (
                    <Elements 
                      stripe={stripePromise} 
                      options={{ clientSecret, appearance: { theme: 'stripe' } }}
                    >
                      <CheckoutForm 
                        campaignId={campaignId} 
                        amount={amount}
                        setAmount={setAmount}
                        message={message}
                        setMessage={setMessage}
                        isAnonymous={isAnonymous}
                        setIsAnonymous={setIsAnonymous}
                      />
                    </Elements>
                  ) : (
                    <div className="py-4">
                      <div className="space-y-6">
                        <div>
                          <Label htmlFor="amount" className="text-lg font-medium">Donation Amount</Label>
                          <div className="mt-2 relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                              $
                            </span>
                            <Input
                              id="amount"
                              type="text"
                              value={amount}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
                                  setAmount(value);
                                }
                              }}
                              className="pl-8"
                              placeholder="0.00"
                              required
                            />
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-3">
                            {["10", "25", "50", "100", "250"].map((presetAmount) => (
                              <Button
                                key={presetAmount}
                                type="button"
                                variant={amount === presetAmount ? "default" : "outline"}
                                className="flex-1"
                                onClick={() => setAmount(presetAmount)}
                              >
                                ${presetAmount}
                              </Button>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="message" className="text-lg font-medium">Message (Optional)</Label>
                          <Textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="mt-2"
                            placeholder="Share a few words of encouragement..."
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="anonymous" 
                            checked={isAnonymous}
                            onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                          />
                          <Label htmlFor="anonymous">Make my donation anonymous</Label>
                        </div>
                        
                        <div className="py-4">
                          <Button
                            type="button"
                            onClick={() => {
                              if (!amount || parseFloat(amount) <= 0) {
                                toast({
                                  title: "Invalid amount",
                                  description: "Please enter a valid donation amount",
                                  variant: "destructive",
                                });
                                return;
                              }
                              
                              apiRequest("POST", "/api/donations/create-payment-intent", {
                                amount: parseFloat(amount),
                                campaignId,
                              })
                                .then(res => res.json())
                                .then(data => {
                                  if (data.clientSecret) {
                                    setClientSecret(data.clientSecret);
                                  } else {
                                    throw new Error("No client secret returned");
                                  }
                                })
                                .catch(error => {
                                  toast({
                                    title: "Error",
                                    description: "Unable to process donation. Please try again later.",
                                    variant: "destructive",
                                  });
                                });
                            }}
                            disabled={!amount || parseFloat(amount) <= 0 || isLoading}
                            className="w-full"
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                            ) : (
                              <>Continue to Payment</>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-5">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h3 className="font-semibold text-lg">{campaign.title}</h3>
                  <p className="text-gray-600 line-clamp-4">{campaign.description}</p>
                  
                  <div className="pt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Current Progress</span>
                      <span className="font-medium">{formatCurrency(campaign.currentAmount)} of {formatCurrency(campaign.goal)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-primary h-2.5 rounded-full" 
                        style={{ 
                          width: `${Math.min(
                            (parseFloat(campaign.currentAmount) / parseFloat(campaign.goal)) * 100, 
                            100
                          )}%` 
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 border-t">
                  <p className="text-sm text-gray-500">
                    Your donation supports this campaign and the mission of Christ Collective. Thank you for your generosity.
                  </p>
                </CardFooter>
              </Card>
              
              <div className="mt-6 bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="font-medium mb-2">Why donate?</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg className="text-primary mt-1 mr-2 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-gray-600 text-sm">100% of your donation goes directly to the campaign</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="text-primary mt-1 mr-2 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-gray-600 text-sm">Secure and encrypted payment processing</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="text-primary mt-1 mr-2 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-gray-600 text-sm">Support Christian causes and community initiatives</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="text-primary mt-1 mr-2 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-gray-600 text-sm">Make a real impact in people's lives</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
