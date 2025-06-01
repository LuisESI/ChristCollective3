import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, HandHeart, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Welcome to Christ Collective
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Join a global community of Christians united in faith, purpose, and mission. 
            Connect, support, and grow together in Christ.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Benefits Section */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6">What You'll Get</h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <HandHeart className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Support Missions</h3>
                    <p className="text-gray-300">Create and support charitable campaigns for Christian causes worldwide.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Business Network</h3>
                    <p className="text-gray-300">Connect with Christian business owners and professionals in your industry.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Content Creator Hub</h3>
                    <p className="text-gray-300">Apply for sponsorships and monetize your faith-based content.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <Heart className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Faith Community</h3>
                    <p className="text-gray-300">Join prayer groups, events, and fellowship with believers worldwide.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Login Section */}
          <Card className="bg-white border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-black mb-4">Join Our Community</h2>
                <p className="text-gray-600 mb-6">
                  Sign in to access all features and connect with believers worldwide.
                </p>
              </div>

              <div className="space-y-6">
                <Button 
                  size="lg" 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/50 hover:shadow-primary/70 transition-all duration-300"
                  asChild
                >
                  <a href="/api/login">Continue with Replit</a>
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    By continuing, you agree to our Terms of Service and Privacy Policy
                  </p>
                </div>
              </div>

              {/* Special Offer Banner */}
              <div className="mt-8 p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="text-center">
                  <h3 className="font-semibold text-black mb-1">🎉 Limited Time Offer</h3>
                  <p className="text-sm text-gray-700">
                    Join as one of our first 100 founding members and get 
                    <span className="font-bold text-primary"> free lifetime access</span> to our business network!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-gray-400 text-sm">
            "For where two or three gather in my name, there am I with them." - Matthew 18:20
          </p>
        </div>
      </div>
    </div>
  );
}