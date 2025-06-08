import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, Heart, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface DonationRecord {
  id: string;
  amount: number;
  tip: number;
  campaignTitle: string;
  donorName?: string;
  isAnonymous: boolean;
  message?: string;
  createdAt: string;
  stripePaymentId: string;
}

export default function DonationSuccessPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [donation, setDonation] = useState<DonationRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIntentId = urlParams.get('payment_intent');
    const campaignId = urlParams.get('campaignId');

    if (!paymentIntentId || !campaignId) {
      toast({
        title: "Invalid donation link",
        description: "Unable to process donation confirmation.",
        variant: "destructive",
      });
      navigate('/donate');
      return;
    }

    // Complete the donation recording
    const completeDonation = async () => {
      try {
        const response = await apiRequest('POST', '/api/donations/complete', {
          paymentIntentId,
          campaignId,
        });

        if (response.ok) {
          const donationData = await response.json();
          setDonation(donationData);
        } else {
          throw new Error('Failed to complete donation');
        }
      } catch (error) {
        console.error('Error completing donation:', error);
        toast({
          title: "Processing Error",
          description: "Your payment was successful, but we encountered an issue recording your donation. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    completeDonation();
  }, [navigate, toast]);

  const downloadReceipt = () => {
    if (!donation) return;

    // Generate PDF receipt content
    const receiptContent = `
      DONATION RECEIPT
      
      Thank you for your generous donation to Christ Collective!
      
      Donation Details:
      - Campaign: ${donation.campaignTitle}
      - Amount: $${donation.amount.toFixed(2)}
      - Tip: $${donation.tip.toFixed(2)}
      - Total: $${(donation.amount + donation.tip).toFixed(2)}
      - Date: ${new Date(donation.createdAt).toLocaleDateString()}
      - Transaction ID: ${donation.stripePaymentId}
      ${donation.message ? `- Message: ${donation.message}` : ''}
      
      This serves as your official receipt for tax purposes.
      
      Christ Collective
      Tax ID: [Tax ID Number]
      
      For questions about your donation, please contact us at support@christcollective.org
    `;

    // Create downloadable text file (in production, you'd generate a proper PDF)
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donation-receipt-${donation.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-white">Processing your donation...</p>
        </div>
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 bg-gray-900 border-gray-700">
          <CardContent className="text-center p-8">
            <div className="text-red-500 mb-4">
              <Heart size={48} className="mx-auto" />
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">Processing Error</h1>
            <p className="text-gray-300 mb-6">
              We encountered an issue processing your donation confirmation.
            </p>
            <Button onClick={() => navigate('/donate')} className="w-full">
              Return to Donations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="text-center pb-6">
            <div className="text-green-500 mb-4">
              <CheckCircle size={64} className="mx-auto" />
            </div>
            <CardTitle className="text-3xl text-white mb-2">
              Thank You for Your Donation!
            </CardTitle>
            <p className="text-gray-300">
              Your generous contribution helps make a difference in our community.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Donation Summary */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">Donation Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Campaign:</span>
                  <span className="text-white font-medium">{donation.campaignTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Donation Amount:</span>
                  <span className="text-white font-medium">${donation.amount.toFixed(2)}</span>
                </div>
                {donation.tip > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-300">Tip to Christ Collective:</span>
                    <span className="text-white font-medium">${donation.tip.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-600 pt-3">
                  <div className="flex justify-between">
                    <span className="text-white font-semibold">Total:</span>
                    <span className="text-white font-semibold">${(donation.amount + donation.tip).toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Transaction Date:</span>
                  <span className="text-gray-400">{new Date(donation.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Transaction ID:</span>
                  <span className="text-gray-400 font-mono text-xs">{donation.stripePaymentId}</span>
                </div>
              </div>
            </div>

            {/* Message */}
            {donation.message && (
              <div className="bg-gray-800 p-6 rounded-lg">
                <h4 className="text-lg font-medium text-white mb-2">Your Message</h4>
                <p className="text-gray-300 italic">"{donation.message}"</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={downloadReceipt}
                className="flex-1 bg-yellow-500 text-black hover:bg-yellow-600"
              >
                <Download className="mr-2" size={16} />
                Download Receipt
              </Button>
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
                className="flex-1 border-gray-600 text-white hover:bg-gray-800"
              >
                <Home className="mr-2" size={16} />
                Return Home
              </Button>
            </div>

            {/* Tax Information */}
            <div className="bg-blue-900/20 border border-blue-700 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-300 mb-2">Tax Receipt Information</h4>
              <p className="text-xs text-blue-200">
                This donation may be tax-deductible. Please consult with your tax advisor and retain this receipt for your records. 
                Christ Collective is a registered 501(c)(3) nonprofit organization.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}