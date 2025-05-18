import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function CTASection() {
  const { isAuthenticated } = useAuth();

  return (
    <section 
      className="py-20 text-white relative"
      style={{
        backgroundImage: 'url(/assets/cta-clouds-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#121212', // Fallback color
      }}
    >
      <div className="absolute inset-0 bg-black/30"></div>
      <div className="container mx-auto px-4 text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Join Our Growing Community Today</h2>
        <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-8">
          Together, we can make a difference through faith, service, and fellowship.
        </p>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
          <Button 
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-8 rounded-md transition-colors text-lg"
          >
            {isAuthenticated ? (
              <Link href="/profile">
                <span>My Account</span>
              </Link>
            ) : (
              <a href="/api/login">Create Your Account</a>
            )}
          </Button>
          <Button 
            asChild
            size="lg"
            variant="outline"
            className="bg-transparent border border-white hover:border-primary hover:text-primary text-white font-semibold py-3 px-8 rounded-md transition-colors text-lg"
          >
            <Link href="/#about">
              <span>Learn More</span>
            </Link>
          </Button>
        </div>
        
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-4xl font-bold text-primary mb-2">5,000+</div>
            <p className="text-gray-300">Community Members</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">$820K+</div>
            <p className="text-gray-300">Donations Raised</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">2,500+</div>
            <p className="text-gray-300">Business Members</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">120+</div>
            <p className="text-gray-300">Countries Represented</p>
          </div>
        </div>
      </div>
    </section>
  );
}
