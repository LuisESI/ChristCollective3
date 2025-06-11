import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Users, Calendar, Lightbulb, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface MembershipTier {
  id: number;
  name: string;
  price: string;
  description: string;
  features: string[];
}

export default function BusinessSection() {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  
  // Fetch statistics to get current user count for founding members
  const { data: statistics, isLoading } = useQuery({
    queryKey: ["/api/statistics"],
  });
  
  const totalUsers = (statistics as any)?.communityMembers || 0;

  return (
    <section id="business" className="py-16 bg-black text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Business Network</h2>
          <div className="w-16 h-1 bg-primary mx-auto mb-6"></div>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Connect with other Christian business owners and professionals to grow your network with those who share your values.
          </p>
        </div>
        
        {/* Progress Bar and Founding Member Program */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-lg p-6 shadow-lg mb-8">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-700">Founding Members</span>
              <span className="text-sm font-medium text-gray-700">{totalUsers}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-primary h-3 rounded-full transition-all duration-300 shadow-lg shadow-primary/50" 
                style={{ width: `${Math.min((totalUsers / 100) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {100 - totalUsers > 0 
                ? `${100 - totalUsers} spots remaining for free lifetime membership`
                : "Founding member program complete!"}
            </p>
          </div>

          <Card className="bg-white border-2 border-primary/20 rounded-xl shadow-lg">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-black">Founding Member Benefits</h3>
                <p className="text-gray-600">Join the first 100 members and get lifetime access for FREE</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-primary mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-black">Business Directory Access</span>
                      <p className="text-sm text-gray-600">Connect with Christian business owners nationwide</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-primary mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-black">Monthly Newsletter</span>
                      <p className="text-sm text-gray-600">Stay updated with industry insights and opportunities</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-primary mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-black">Online Prayer Group</span>
                      <p className="text-sm text-gray-600">Join fellowship with like-minded professionals</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-primary mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-black">Networking Events</span>
                      <p className="text-sm text-gray-600">Exclusive access to member-only events</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-primary mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-black">Business Spotlight</span>
                      <p className="text-sm text-gray-600">Get featured in our community showcase</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-primary mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-black">Lifetime Access</span>
                      <p className="text-sm text-gray-600">No recurring fees, ever</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Button 
                  size="lg" 
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 shadow-lg shadow-primary/50 hover:shadow-primary/70 transition-all duration-300"
                  disabled={totalUsers >= 100}
                  asChild
                >
                  {isAuthenticated ? (
                    <Link href="/profile">
                      {totalUsers >= 100 ? "Program Complete" : "Join as Founding Member - FREE"}
                    </Link>
                  ) : (
                    <Link href="/auth">
                      {totalUsers >= 100 ? "Program Complete" : "Join as Founding Member - FREE"}
                    </Link>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-3">
                  {totalUsers < 100 
                    ? "Limited time offer - join now while spots are available"
                    : "Thank you to all our founding members!"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Business Networking Features */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-semibold mb-6">Business Community Features</h3>
            <div className="space-y-8">
              <div className="flex">
                <div className="flex-shrink-0 mr-4">
                  <div className="w-12 h-12 bg-primary/80 rounded-full flex items-center justify-center">
                    <Users className="text-white" size={24} />
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-medium mb-2">Targeted Networking</h4>
                  <p className="text-gray-400">Connect with other business owners based on industry, location, and specific business needs.</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex-shrink-0 mr-4">
                  <div className="w-12 h-12 bg-primary/80 rounded-full flex items-center justify-center">
                    <Calendar className="text-white" size={24} />
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-medium mb-2">Events & Webinars</h4>
                  <p className="text-gray-400">Participate in regular virtual and in-person events designed to help you grow your business.</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex-shrink-0 mr-4">
                  <div className="w-12 h-12 bg-primary/80 rounded-full flex items-center justify-center">
                    <Lightbulb className="text-white" size={24} />
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-medium mb-2">Resource Library</h4>
                  <p className="text-gray-400">Access faith-based business resources, guides, and tools to help you run your business with integrity.</p>
                </div>
              </div>
            </div>
            
            {/* Join Our Growing Network section moved below features */}
            <div className="mt-12">
              <h3 className="text-2xl font-semibold mb-4">Join Our Growing Network</h3>
              <p className="text-gray-400 mb-6">Connect with Christian business owners and professionals across multiple industries worldwide.</p>
              
              <Button 
                asChild
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {isAuthenticated ? (
                  <Link href="/profile">
                    Create Your Business Profile
                  </Link>
                ) : (
                  <Link href="/auth">
                    Create Your Business Profile
                  </Link>
                )}
              </Button>
            </div>
          </div>

          <div>
            <img 
              src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
              alt="Business networking event" 
              className="w-full h-auto rounded-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
