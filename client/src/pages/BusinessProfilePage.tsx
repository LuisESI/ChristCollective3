import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Globe, Phone, Mail, Calendar, Star, ArrowLeft, Share2, Briefcase } from "lucide-react";
import { BusinessProfile } from "@shared/schema";
import { buildApiUrl, getImageUrl } from "@/lib/api-config";
import { Link } from "wouter";

export default function BusinessProfilePage() {
  const { id } = useParams();

  const { data: profile, isLoading, error } = useQuery<BusinessProfile>({
    queryKey: ["/api/business-profiles", id],
    queryFn: async () => {
      const response = await fetch(buildApiUrl(`/api/business-profiles/${id}`), {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch business profile');
      }
      return response.json();
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="animate-pulse">
          <div className="h-40 md:h-48 bg-gray-800" />
          <div className="max-w-4xl mx-auto px-4">
            <div className="w-24 h-24 rounded-full bg-gray-700 -mt-12 ring-2 ring-[#D4AF37] border-4 border-black" />
            <div className="mt-4 space-y-3">
              <div className="h-7 bg-gray-700 rounded w-1/3" />
              <div className="h-4 bg-gray-700 rounded w-1/4" />
              <div className="h-4 bg-gray-700 rounded w-full" />
              <div className="h-4 bg-gray-700 rounded w-5/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href="/connect">
            <Button variant="ghost" className="mb-6 text-gray-300 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Network
            </Button>
          </Link>
          <Card className="bg-[#0A0A0A] border-gray-800">
            <CardContent className="p-8 text-center">
              <Briefcase className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Business Profile Not Found</h3>
              <p className="text-gray-500">The business profile you're looking for doesn't exist or has been removed.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="relative h-40 md:h-48 bg-gradient-to-b from-gray-900 to-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/20 via-gray-900 to-black" />
        <Link href="/connect">
          <Button variant="ghost" className="absolute top-4 left-4 z-10 text-white/80 hover:text-white hover:bg-white/10">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-end justify-between">
          <Avatar className="w-24 h-24 -mt-12 ring-2 ring-[#D4AF37] border-4 border-black">
            <AvatarImage src={getImageUrl(profile?.logo || undefined)} alt={profile?.companyName} />
            <AvatarFallback className="bg-gray-800 text-[#D4AF37] text-2xl font-bold">
              {profile?.companyName?.charAt(0) || "B"}
            </AvatarFallback>
          </Avatar>

          <div className="flex gap-2 pb-2">
            {profile.email && (
              <a href={`mailto:${profile.email}`}>
                <Button className="bg-[#D4AF37] text-black hover:bg-[#B8941F] font-medium">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact
                </Button>
              </a>
            )}
            <Button variant="outline" className="border-gray-700 text-white bg-transparent hover:bg-white/10">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="mt-3">
          <h1 className="text-2xl font-bold">{profile?.companyName || "Business Name"}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            {profile?.industry && (
              <Badge variant="outline" className="bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]">
                <Briefcase className="w-3 h-3 mr-1" />
                {profile.industry}
              </Badge>
            )}
            <Badge className="bg-green-900/30 border-green-600 text-green-300 text-xs">
              Active Member
            </Badge>
            {(profile as any)?.membershipTier && (
              <Badge variant="outline" className="bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]">
                <Star className="w-3 h-3 mr-1" />
                {(profile as any).membershipTier.name}
              </Badge>
            )}
          </div>
        </div>

        {profile.description && (
          <div className="mt-3">
            <p className="text-sm text-gray-300 leading-relaxed">{profile.description}</p>
          </div>
        )}

        <div className="mt-4 space-y-2">
          {profile.location && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <MapPin className="h-4 w-4 text-[#D4AF37]" />
              <span>{profile.location}</span>
            </div>
          )}
          {profile?.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-[#D4AF37]" />
              <a href={`mailto:${profile.email}`} className="text-[#D4AF37] hover:underline">{profile.email}</a>
            </div>
          )}
          {profile?.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-[#D4AF37]" />
              <a href={`tel:${profile.phone}`} className="text-[#D4AF37] hover:underline">{profile.phone}</a>
            </div>
          )}
          {profile.website && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-[#D4AF37]" />
              <a 
                href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#D4AF37] hover:underline break-all"
              >
                {profile.website}
              </a>
            </div>
          )}
          {profile.createdAt && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4 text-gray-600" />
              <span>Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
            </div>
          )}
        </div>

        {profile?.services && profile.services.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Services</h3>
            <div className="flex flex-wrap gap-2">
              {profile.services.map((service: string, index: number) => (
                <Badge key={index} variant="outline" className="border-gray-700 text-gray-300 bg-[#0A0A0A]">
                  {service}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {profile.networkingGoals && (
          <div className="mt-5">
            <Card className="bg-[#0A0A0A] border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">Networking Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300 leading-relaxed">{profile.networkingGoals}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {(profile.email || profile.website) && (
          <div className="mt-6">
            <Card className="bg-gradient-to-r from-[#D4AF37]/10 to-[#0A0A0A] border-[#D4AF37]/30">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold text-white">Ready to Connect?</h3>
                  <p className="text-gray-400 text-sm">Reach out to {profile.companyName} to explore collaboration opportunities.</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {profile.email && (
                      <a href={`mailto:${profile.email}`}>
                        <Button className="bg-[#D4AF37] hover:bg-[#B8941F] text-black font-medium">
                          <Mail className="w-4 h-4 mr-2" />
                          Send Email
                        </Button>
                      </a>
                    )}
                    {profile.website && (
                      <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10">
                          <Globe className="w-4 h-4 mr-2" />
                          Visit Website
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
