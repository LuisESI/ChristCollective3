import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function HeroSection() {
  const { isAuthenticated } = useAuth();

  return (
    <section 
      className="h-[600px] flex items-center justify-center relative bg-cover bg-center"
      style={{ 
        backgroundImage: 'url("/images/mountain-cross-background.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      <div className="container mx-auto px-4 text-center text-white relative z-10">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Uniting Christians Worldwide</h1>
        <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8">
          Join our global community dedicated to faith, service, and fellowship across all denominations.
        </p>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
          <Button 
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-8 rounded-md transition-colors text-lg"
          >
            <Link href="/donate">
              <span className="text-black">Donate Now</span>
            </Link>
          </Button>
          <Button 
            asChild
            size="lg"
            variant="outline"
            className="bg-white hover:bg-gray-100 text-foreground font-semibold py-3 px-8 rounded-md transition-colors text-lg"
          >
            {isAuthenticated ? (
              <Link href="/profile">
                <span className="text-black">My Account</span>
              </Link>
            ) : (
              <a href="/api/login">Join Our Community</a>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}
