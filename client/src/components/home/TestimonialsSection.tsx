import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
}

export default function TestimonialsSection() {
  const testimonials: Testimonial[] = [
    {
      name: "Michael Thompson",
      role: "Thompson Consulting, LLC",
      content: "Christ Collective has transformed my business by connecting me with like-minded entrepreneurs who share my values. The networking events and resources have been invaluable.",
      rating: 5
    },
    {
      name: "Sarah Johnson",
      role: "Grace Community Church",
      content: "The donation platform made it easy for our church to raise funds for our mission trip. The support from the community was overwhelming and we exceeded our goal within weeks.",
      rating: 5
    },
    {
      name: "David Rodriguez",
      role: "Faithful Foundations",
      content: "Being part of Christ Collective has been a blessing. I've met incredible people from different denominations and backgrounds, all united by our shared faith and commitment to service.",
      rating: 4.5
    }
  ];

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="fill-primary text-primary" size={18} />);
    }

    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative">
          <Star className="text-gray-300" size={18} />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className="fill-primary text-primary" size={18} />
          </div>
        </div>
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="text-gray-300" size={18} />);
    }

    return stars;
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">What Our Community Says</h2>
          <div className="w-16 h-1 bg-primary mx-auto mb-6"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-white p-8 rounded-xl shadow-[0_0_15px_rgba(255,215,0,0.3)] hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-center mb-4">
                  <div className="flex text-primary">
                    {renderStars(testimonial.rating)}
                  </div>
                </div>
                <p className="text-gray-600 mb-6">{testimonial.content}</p>
                <div className="flex items-center">
                  <Avatar className="h-12 w-12 mr-4">
                    <AvatarFallback className="bg-gray-200 text-gray-400">
                      {testimonial.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-black">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}