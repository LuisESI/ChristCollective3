import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet";

// Make sure to call loadStripe outside of a component's render
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.warn('Missing Stripe public key. Payment functionality will be limited.');
}

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

function CheckoutForm({ tier }: { tier: any }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(undefined);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/profile",
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

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Billing Summary</h3>
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">{tier.name}</span>
            <span>${tier.price}/month</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="font-medium">Total</span>
            <span className="font-medium">${tier.price}/month</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Payment Details</h3>
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <PaymentElement />
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
          {errorMessage}
        </div>
      )}

      <div className="flex justify-between">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => navigate("/business")}
          disabled={isProcessing}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Button 
          type="submit" 
          disabled={!stripe || !elements || isProcessing}
          className="min-w-[150px]"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Subscribe Now'
          )}
        </Button>
      </div>
    </form>
  );
}

export default function MembershipCheckoutPage() {
  const { tierId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      window.location.href = "/api/login";
    }
  }, [isAuthLoading, isAuthenticated]);

  // Fetch membership tier
  const { data: tier, isLoading: isTierLoading } = useQuery({
    queryKey: [`/api/membership-tiers/${tierId}`],
    enabled: !!tierId && isAuthenticated,
    onError: () => {
      toast({
        title: "Error",
        description: "Unable to load membership tier information. Please try again.",
        variant: "destructive",
      });
      navigate("/business");
    }
  });

  // If tier not found in the API, use a default tier object based on the ID
  const defaultTiers = [
    {
      id: 1,
      name: "Basic Membership",
      price: "9",
      description: "Perfect for startups and small businesses",
      features: [
        "Basic profile in our business directory",
        "Access to monthly virtual networking events",
        "Join industry-specific groups",
        "Email support"
      ]
    },
    {
      id: 2,
      name: "Professional Membership",
      price: "29",
      description: "For established businesses and professionals",
      features: [
        "Enhanced profile with portfolio showcase",
        "Priority access to all networking events",
        "1:1 business matchmaking service",
        "Access to exclusive resources and training",
        "Priority support"
      ]
    },
    {
      id: 3,
      name: "Executive Membership",
      price: "99",
      description: "For industry leaders and executives",
      features: [
        "Premium featured profile with brand spotlight",
        "VIP access to all events including exclusive executive roundtables",
        "Dedicated business advisor",
        "Opportunity to host and speak at events",
        "All Professional benefits plus executive coaching sessions"
      ]
    }
  ];

  const currentTier = tier || defaultTiers.find(t => t.id === parseInt(tierId || "0"));

  // Create subscription when component mounts
  useEffect(() => {
    if (!isAuthenticated || !currentTier) return;

    setIsLoading(true);
    
    apiRequest("POST", "/api/create-subscription", { tierID: tierId })
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
          description: "Unable to create subscription. Please try again later.",
          variant: "destructive",
        });
        console.error("Subscription error:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isAuthenticated, tierId, currentTier, toast]);

  if (isAuthLoading || !isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentTier) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Membership tier not found</h1>
          <p className="text-gray-600 mb-6">The membership tier you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/business">
              <a>View Available Memberships</a>
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Subscribe to {currentTier.name} - Christ Collective</title>
        <meta name="description" content={`Join our ${currentTier.name} and connect with other Christian business owners and professionals.`} />
      </Helmet>
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <Button 
              asChild
              variant="ghost"
              className="mb-4"
            >
              <Link href="/business">
                <a className="flex items-center">
                  <ArrowLeft className="mr-2" size={16} />
                  Back to Membership Options
                </a>
              </Link>
            </Button>
            
            <h1 className="text-3xl font-bold mb-2">Subscribe to {currentTier.name}</h1>
            <p className="text-gray-600">Complete your subscription to start connecting with Christian business professionals.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-7">
              <Card>
                <CardHeader>
                  <CardTitle>Checkout</CardTitle>
                  <CardDescription>
                    Secure payment processing powered by Stripe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading || !stripePromise ? (
                    <div className="py-8 flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                      <p className="text-gray-500">Preparing your subscription...</p>
                    </div>
                  ) : clientSecret ? (
                    <Elements 
                      stripe={stripePromise} 
                      options={{ clientSecret, appearance: { theme: 'stripe' } }}
                    >
                      <CheckoutForm tier={currentTier} />
                    </Elements>
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      <p>Unable to initialize payment. Please try again later.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-5">
              <Card>
                <CardHeader>
                  <CardTitle>{currentTier.name}</CardTitle>
                  <CardDescription>{currentTier.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-4">
                    ${currentTier.price}<span className="text-lg font-normal text-gray-400">/month</span>
                  </div>
                  
                  <h3 className="font-medium mb-2">Includes:</h3>
                  <ul className="space-y-2">
                    {currentTier.features.map((feature: string, i: number) => (
                      <li key={i} className="flex items-start">
                        <Check className="text-primary mt-1 mr-2 flex-shrink-0" size={16} />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="bg-gray-50 border-t">
                  <p className="text-sm text-gray-500">
                    Your subscription will renew automatically each month. You can cancel anytime from your profile.
                  </p>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
