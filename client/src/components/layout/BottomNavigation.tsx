import { Home, Compass, Users, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navigationItems = [
  { icon: Home, label: "Feed", href: "/feed" },
  { icon: Compass, label: "Explore", href: "/explore" },
  { icon: Users, label: "Connect", href: "/connect" },
  { icon: User, label: "Profile", href: "/mobile-profile" },
];

export default function BottomNavigation() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden">
      <div className="flex justify-around items-center h-16">
        {navigationItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <div className={cn(
                "flex flex-col items-center justify-center h-full px-2 py-1 transition-colors",
                isActive 
                  ? "text-[#D4AF37]" 
                  : "text-gray-600 hover:text-gray-900"
              )}>
                <Icon className={cn("h-6 w-6", isActive && "fill-current")} />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}