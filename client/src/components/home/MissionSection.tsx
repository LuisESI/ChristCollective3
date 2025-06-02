import { HandHelping, Heart, Handshake } from "lucide-react";

export default function MissionSection() {
  return (
    <section id="about" className="py-16 bg-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Our Mission</h2>
          <div className="w-16 h-1 bg-primary mx-auto mb-6"></div>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Christ Collective exists to unite Christians from all denominations worldwide, fostering community, charity, and business relationships grounded in shared faith.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <div className="bg-white p-8 rounded-xl shadow-sm text-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-primary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <HandHelping className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-black">Community Service</h3>
            <p className="text-gray-600">Supporting each other through challenging times and celebrating our shared faith through service.</p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm text-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-primary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-black">Charitable Giving</h3>
            <p className="text-gray-600">Creating and supporting meaningful charitable initiatives that reflect our Christian values.</p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm text-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-primary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Handshake className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-black">Business Networking</h3>
            <p className="text-gray-600">Connecting Christian business owners to build relationships that honor our faith and values.</p>
          </div>
        </div>
      </div>
    </section>
  );
}