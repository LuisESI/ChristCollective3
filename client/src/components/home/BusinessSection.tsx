import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Users, Calendar, Lightbulb } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface MembershipTier {
  id: number;
  name: string;
  price: string;
  description: string;
  features: string[];
}

export default function BusinessSection() {
  const { isAuthenticated } = useAuth();
  
  // Fetch membership tiers from API
  const { data: membershipTiers = [], isLoading } = useQuery({
    queryKey: ["/api/membership-tiers"],
  });

  // Default membership tiers if API fails or while loading
  const defaultTiers: MembershipTier[] = [
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

  // Use API data if available, otherwise use default tiers
  const tiers = membershipTiers.length > 0 ? membershipTiers : defaultTiers;

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
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
          {tiers.map((tier, index) => {
            const isPopular = index === 1;
            
            return (
              <Card 
                key={tier.id}
                className={`
                  bg-[#1E1E1E] rounded-xl p-8 
                  ${isPopular 
                    ? 'border-2 border-primary relative transform hover:scale-105 transition-transform duration-300' 
                    : 'border border-gray-700 hover:border-primary transition-colors'
                  }
                `}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-primary text-[#121212] font-medium py-1 px-4 rounded-bl-lg rounded-tr-lg">
                    Popular
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2">{tier.name}</h3>
                  <div className="text-3xl font-bold mb-1">
                    ${tier.price}<span className="text-lg font-normal text-gray-400">/month</span>
                  </div>
                  <p className="text-gray-400">{tier.description}</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="text-primary mt-1 mr-3 flex-shrink-0" size={18} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  asChild
                  className={`w-full ${
                    isPopular
                      ? "bg-primary hover:bg-primary/90 text-white"
                      : "bg-transparent border border-primary text-primary hover:bg-primary hover:text-white"
                  }`}
                >
                  {isAuthenticated ? (
                    <Link href={`/membership/checkout/${tier.id}`}>
                      <a>Get Started</a>
                    </Link>
                  ) : (
                    <a href="/api/login">Get Started</a>
                  )}
                </Button>
              </Card>
            );
          })}
        </div>
        
        {/* Business Networking Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12">
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
          </div>
          
          <div>
            <img 
              src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
              alt="Business networking event" 
              className="w-full h-auto rounded-xl"
            />
            
            <div className="mt-8">
              <h3 className="text-2xl font-semibold mb-4">Join Our Growing Network</h3>
              <p className="text-gray-400 mb-6">Connect with over 2,500+ Christian business owners and professionals across 120+ industries worldwide.</p>
              
              <Button 
                asChild
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {isAuthenticated ? (
                  <Link href="/profile">
                    <a>Create Your Business Profile</a>
                  </Link>
                ) : (
                  <a href="/api/login">Create Your Business Profile</a>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
