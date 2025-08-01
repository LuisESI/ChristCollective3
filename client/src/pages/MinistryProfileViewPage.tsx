import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  ExternalLink, 
  Users,
  Calendar,
  Heart,
  Share2,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";
import { MinistryProfile } from "@shared/schema";

export default function MinistryProfileViewPage() {
  const [match, params] = useRoute("/ministry/:id");
  const ministryId = params?.id;

  const { data: ministry, isLoading } = useQuery({
    queryKey: ["/api/ministries", ministryId],
    queryFn: async () => {
      const response = await fetch(`/api/ministries/${ministryId}`);
      if (!response.ok) throw new Error("Ministry not found");
      return response.json();
    },
    enabled: !!ministryId,
  });

  // Check if user is authenticated
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const response = await fetch("/api/user");
      if (!response.ok) return null;
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="bg-gray-900 rounded-lg p-8">
              <div className="flex items-center space-x-6 mb-6">
                <div className="h-24 w-24 bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-700 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-700 rounded w-16"></div>
                    <div className="h-6 bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                <div className="h-4 bg-gray-700 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ministry) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href="/ministries">
            <Button variant="ghost" className="mb-6 text-gray-300 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Ministries
            </Button>
          </Link>
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-8 text-center">
              <Building className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Ministry Not Found</h3>
              <p className="text-gray-500">The ministry you're looking for doesn't exist or has been removed.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{ministry.name} - Ministry Profile | Christ Collective</title>
        <meta name="description" content={`Learn more about ${ministry.name}, a ${ministry.denomination} ministry serving the community.`} />
      </Helmet>
      
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back Button */}
          <Link href="/ministries">
            <Button variant="ghost" className="mb-6 text-gray-300 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Ministries
            </Button>
          </Link>

          {/* Ministry Header */}
          <Card className="bg-gray-900 border-gray-700 mb-6">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-6">
                <Avatar className="h-24 w-24 mx-auto md:mx-0">
                  <AvatarImage src={ministry.logo} alt={ministry.name} />
                  <AvatarFallback className="bg-primary text-black text-3xl font-bold">
                    {ministry.name?.charAt(0) || 'M'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-bold text-white mb-2">{ministry.name}</h1>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                    {ministry.denomination && (
                      <Badge variant="outline" className="bg-blue-900/30 border-blue-600 text-blue-300">
                        {ministry.denomination}
                      </Badge>
                    )}
                    {ministry.isVerified && (
                      <Badge className="bg-green-900/30 border-green-600 text-green-300">
                        ✓ Verified Ministry
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    {currentUser && (
                      <Button className="bg-primary hover:bg-primary/90">
                        <Users className="h-4 w-4 mr-2" />
                        Follow Ministry
                      </Button>
                    )}
                    <Button variant="outline" className="border-gray-600 hover:bg-gray-800">
                      <Heart className="h-4 w-4 mr-2" />
                      Support
                    </Button>
                    <Button variant="outline" className="border-gray-600 hover:bg-gray-800">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ministry Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* About Section */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">About {ministry.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed">{ministry.description}</p>
                </CardContent>
              </Card>

              {/* Recent Posts Section */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Updates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No recent posts yet</p>
                    <p className="text-gray-500 text-sm">Check back later for updates from this ministry</p>
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Events Section */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No upcoming events</p>
                    <p className="text-gray-500 text-sm">Stay tuned for announcements</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Information */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ministry.location && (
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-primary mr-3 mt-0.5" />
                      <div>
                        <p className="text-gray-300 font-medium">Location</p>
                        <p className="text-gray-400 text-sm">{ministry.location}</p>
                        {ministry.address && (
                          <p className="text-gray-500 text-xs mt-1">{ministry.address}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {ministry.email && (
                    <div className="flex items-start">
                      <Mail className="h-5 w-5 text-primary mr-3 mt-0.5" />
                      <div>
                        <p className="text-gray-300 font-medium">Email</p>
                        <a 
                          href={`mailto:${ministry.email}`} 
                          className="text-primary hover:underline text-sm"
                        >
                          {ministry.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {ministry.phone && (
                    <div className="flex items-start">
                      <Phone className="h-5 w-5 text-primary mr-3 mt-0.5" />
                      <div>
                        <p className="text-gray-300 font-medium">Phone</p>
                        <a 
                          href={`tel:${ministry.phone}`} 
                          className="text-primary hover:underline text-sm"
                        >
                          {ministry.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {ministry.website && (
                    <div className="flex items-start">
                      <ExternalLink className="h-5 w-5 text-primary mr-3 mt-0.5" />
                      <div>
                        <p className="text-gray-300 font-medium">Website</p>
                        <a 
                          href={ministry.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm break-all"
                        >
                          Visit Website
                        </a>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ministry Stats */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Ministry Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Followers</span>
                    <span className="text-white font-semibold">0</span>
                  </div>
                  <Separator className="bg-gray-700" />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Events Hosted</span>
                    <span className="text-white font-semibold">0</span>
                  </div>
                  <Separator className="bg-gray-700" />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Posts</span>
                    <span className="text-white font-semibold">0</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}