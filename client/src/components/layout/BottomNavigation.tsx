import { House, Compass, PlusCircle, UsersThree, User } from "@phosphor-icons/react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navigationItems = [
  { icon: House, label: "Feed", href: "/feed" },
  { icon: Compass, label: "Explore", href: "/explore" },
  { icon: PlusCircle, label: "Create", href: "/create", isCreate: true },
  { icon: UsersThree, label: "Connect", href: "/connect" },
  { icon: User, label: "Profile", href: "/profile" },
];

export default function BottomNavigation() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-50 pb-safe">
      <div className="flex justify-around items-center h-16">
        {navigationItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;

          if (item.isCreate) {
            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <div className="flex flex-col items-center justify-center h-full px-2 py-1">
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center -mt-1">
                    <Icon size={20} weight="bold" color="black" />
                  </div>
                  <span className="text-[10px] mt-0.5 font-medium text-[#D4AF37]">{item.label}</span>
                </div>
              </Link>
            );
          }

          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <div className={cn(
                "flex flex-col items-center justify-center h-full px-2 py-1 transition-colors",
                isActive
                  ? "text-[#D4AF37]"
                  : "text-gray-500 hover:text-white"
              )}>
                <Icon size={24} weight={isActive ? "fill" : "regular"} />
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
