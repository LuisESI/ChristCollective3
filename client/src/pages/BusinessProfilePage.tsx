import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Globe, Phone, Mail, Calendar, Users, Star } from "lucide-react";
import { BusinessProfile } from "@shared/schema";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function BusinessProfilePage() {
  const { id } = useParams();

  const { data: profile, isLoading, error } = useQuery<BusinessProfile>({
    queryKey: ["/api/business-profiles", id],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-8">
              <div className="h-8 bg-slate-200 rounded w-1/3"></div>
              <div className="space-y-4">
                <div className="h-4 bg-slate-200 rounded w-full"></div>
                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Business Profile Not Found</h1>
            <p className="text-slate-600 mb-8">The business profile you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header Section */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                  <AvatarImage src={profile.logo || undefined} alt={profile.companyName} />
                  <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-600 text-white text-xl font-bold">
                    {profile.companyName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle className="text-3xl font-bold text-slate-900 mb-2">{profile.companyName}</CardTitle>
                      <CardDescription className="text-lg text-slate-600">{profile.industry}</CardDescription>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                        <Users className="w-3 h-3 mr-1" />
                        Active Member
                      </Badge>
                      {profile.membershipTier && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                          <Star className="w-3 h-3 mr-1" />
                          {profile.membershipTier.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Company Description */}
          {profile.description && (
            <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-900">About {profile.companyName}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 leading-relaxed">{profile.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Contact Information */}
          <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-900">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {profile.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-slate-500" />
                    <a 
                      href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {profile.website}
                    </a>
                  </div>
                )}
                
                {profile.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-slate-500" />
                    <a href={`tel:${profile.phone}`} className="text-slate-700 hover:text-slate-900 transition-colors">
                      {profile.phone}
                    </a>
                  </div>
                )}
                
                {profile.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-slate-500" />
                    <a href={`mailto:${profile.email}`} className="text-slate-700 hover:text-slate-900 transition-colors">
                      {profile.email}
                    </a>
                  </div>
                )}
                
                {profile.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-slate-500" />
                    <span className="text-slate-700">{profile.location}</span>
                  </div>
                )}
              </div>
              
              {profile.createdAt && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Services */}
          {profile.services && profile.services.length > 0 && (
            <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-900">Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.services.map((service, index) => (
                    <Badge key={index} variant="outline" className="bg-slate-50 text-slate-700 border-slate-300">
                      {service}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact CTA */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold text-slate-900">Ready to Connect?</h3>
                <p className="text-slate-600">Reach out to {profile.companyName} to explore collaboration opportunities.</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {profile.email && (
                    <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                      <Mail className="w-4 h-4 mr-2" />
                      Send Email
                    </Button>
                  )}
                  {profile.website && (
                    <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                      <Globe className="w-4 h-4 mr-2" />
                      Visit Website
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
      
      <Footer />
    </div>
  );
}