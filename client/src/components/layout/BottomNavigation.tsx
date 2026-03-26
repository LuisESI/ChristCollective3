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
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      {/* Glass bar */}
      <div className="glass-dark border-t-0 mx-0">
        <div className="flex justify-around items-center h-16 px-1">
          {navigationItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;

            if (item.isCreate) {
              return (
                <Link key={item.href} href={item.href} className="flex-1">
                  <div className="flex flex-col items-center justify-center h-full px-2 py-1 press-effect">
                    <div className="w-11 h-11 rounded-full bg-[#D4AF37] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20 -mt-1">
                      <Icon size={20} weight="bold" color="black" />
                    </div>
                    <span className="text-[9px] mt-0.5 font-semibold text-[#D4AF37] tracking-wide uppercase">
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            }

            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <div className={cn(
                  "flex flex-col items-center justify-center h-full px-2 py-1 transition-all duration-200 press-effect relative",
                  isActive ? "text-[#D4AF37]" : "text-gray-500 hover:text-gray-300"
                )}>
                  <Icon
                    size={23}
                    weight={isActive ? "fill" : "regular"}
                    className="transition-transform duration-200"
                  />
                  <span className={cn(
                    "text-[9px] mt-1 font-semibold tracking-wide uppercase transition-colors duration-200",
                    isActive ? "text-[#D4AF37]" : "text-gray-500"
                  )}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
