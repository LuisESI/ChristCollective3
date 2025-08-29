import { Link } from "wouter";
import { Logo } from "@/components/Logo";
import { Facebook, Twitter, Instagram, Youtube, MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <Logo dark className="mb-6" />
            <p className="text-gray-400 mb-4">Uniting Christians worldwide through community, charity, and business.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Twitter size={20} />
              </a>
              <a href="https://www.instagram.com/christcollective369/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Youtube size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <span className="text-gray-400 hover:text-primary transition-colors cursor-pointer">Home</span>
                </Link>
              </li>
              <li>
                <Link href="/#about">
                  <span className="text-gray-400 hover:text-primary transition-colors cursor-pointer">About Us</span>
                </Link>
              </li>
              <li>
                <Link href="/donate">
                  <span className="text-gray-400 hover:text-primary transition-colors cursor-pointer">Donate</span>
                </Link>
              </li>
              <li>
                <Link href="/business">
                  <span className="text-gray-400 hover:text-primary transition-colors cursor-pointer">Business Network</span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-primary transition-colors">Blog</a></li>
              <li><a href="#" className="text-gray-400 hover:text-primary transition-colors">Events</a></li>
              <li><a href="#" className="text-gray-400 hover:text-primary transition-colors">Success Stories</a></li>
              <li><a href="#" className="text-gray-400 hover:text-primary transition-colors">FAQs</a></li>
              <li><a href="#" className="text-gray-400 hover:text-primary transition-colors">Support</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2">
              <li className="flex items-start">
                <MapPin className="text-primary mt-1 mr-3" size={18} />
                <span className="text-gray-400">123 Faith Street, Suite 100<br />Houston, TX 77001</span>
              </li>
              <li className="flex items-center">
                <Phone className="text-primary mr-3" size={18} />
                <span className="text-gray-400">(123) 456-7890</span>
              </li>
              <li className="flex items-center">
                <Mail className="text-primary mr-3" size={18} />
                <span className="text-gray-400">luis@christcollective.info</span>
              </li>
            </ul>
          </div>
        </div>
        
        <hr className="border-gray-700 mb-8" />
        
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm mb-4 md:mb-0">&copy; {new Date().getFullYear()} Christ Collective. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-500 hover:text-primary text-sm transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-500 hover:text-primary text-sm transition-colors">Terms of Service</a>
            <a href="#" className="text-gray-500 hover:text-primary text-sm transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
