import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, Globe, Target, CheckCircle, Star } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function AboutPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            About <span className="text-primary">Christ Collective</span>
          </h1>
          <div className="w-24 h-1 bg-primary mx-auto mb-8"></div>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Uniting Christians worldwide through faith, community, and purpose-driven collaboration. 
            We're building a platform where believers can connect, grow, and make a meaningful impact together.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">Our Mission</h2>
            <div className="w-16 h-1 bg-primary mx-auto mb-6"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold mb-6 text-primary">Breaking Down Barriers</h3>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Christ Collective was founded on the belief that denominational differences should not divide 
                the body of Christ. We create spaces where Christians from all backgrounds can come together, 
                support one another, and work toward common goals.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Whether you're looking to support charitable causes, grow your business network, 
                or collaborate on creative projects, our platform provides the tools and community 
                to make it happen.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <Card className="bg-black border-primary/20">
                <CardContent className="p-6 text-center">
                  <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h4 className="font-semibold mb-2 text-white">Unity</h4>
                  <p className="text-sm text-gray-300">Bringing believers together across denominations</p>
                </CardContent>
              </Card>
              
              <Card className="bg-black border-primary/20">
                <CardContent className="p-6 text-center">
                  <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h4 className="font-semibold mb-2 text-white">Community</h4>
                  <p className="text-sm text-gray-300">Creating meaningful connections and relationships</p>
                </CardContent>
              </Card>
              
              <Card className="bg-black border-primary/20">
                <CardContent className="p-6 text-center">
                  <Globe className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h4 className="font-semibold mb-2 text-white">Global Impact</h4>
                  <p className="text-sm text-gray-300">Making a difference in communities worldwide</p>
                </CardContent>
              </Card>
              
              <Card className="bg-black border-primary/20">
                <CardContent className="p-6 text-center">
                  <Target className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h4 className="font-semibold mb-2 text-white">Purpose</h4>
                  <p className="text-sm text-gray-300">Empowering kingdom-building initiatives</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-16 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What We Offer</h2>
            <div className="w-16 h-1 bg-primary mx-auto mb-6"></div>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Four core areas designed to help Christians connect, grow, and make an impact
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="bg-white border-primary/20 hover:border-primary/40 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-black">Donations & Campaigns</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Support meaningful causes and create fundraising campaigns for ministries, 
                  missions, and community projects.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-primary/20 hover:border-primary/40 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-black">Business Network</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Connect with Christian business owners and professionals to grow your network 
                  with those who share your values.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-primary/20 hover:border-primary/40 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-black">Creator Sponsorship</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Support Christian content creators and influencers who are making a positive 
                  impact through their platforms.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-primary/20 hover:border-primary/40 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-black">Community Building</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Join groups, attend events, and participate in discussions that strengthen 
                  the global Christian community.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Values</h2>
            <div className="w-16 h-1 bg-primary mx-auto mb-6"></div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Faith-Centered</h3>
                  <p className="text-gray-300">
                    Christ is at the center of everything we do. Our platform exists to serve 
                    His kingdom and advance His purposes.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Inclusive Community</h3>
                  <p className="text-gray-300">
                    We welcome Christians from all denominations and backgrounds, believing 
                    unity strengthens the body of Christ.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Integrity</h3>
                  <p className="text-gray-300">
                    We operate with transparency, honesty, and accountability in all our 
                    interactions and business practices.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Stewardship</h3>
                  <p className="text-gray-300">
                    We believe in using our resources, talents, and platform responsibly 
                    to serve others and honor God.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Innovation</h3>
                  <p className="text-gray-300">
                    We embrace technology and creative solutions to better serve the 
                    Christian community and reach more people.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Global Vision</h3>
                  <p className="text-gray-300">
                    Our mission extends beyond borders, seeking to unite Christians 
                    worldwide in service and fellowship.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-black">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Join Our Growing Community</h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-8">
            Become part of a global movement of Christians making a difference in their communities and beyond.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/50 hover:shadow-primary/70 transition-all duration-300"
            >
              {isAuthenticated ? (
                <Link href="/profile">
                  <a>Complete Your Profile</a>
                </Link>
              ) : (
                <a href="/api/login">Get Started Today</a>
              )}
            </Button>
            
            <Button 
              asChild
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-white"
            >
              <Link href="/donate">
                <a>Explore Campaigns</a>
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}