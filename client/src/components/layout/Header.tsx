import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCreatorStatus } from "@/hooks/useCreatorStatus";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@shared/schema";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [path] = useLocation();
  const { user, isLoading } = useAuth();
  const { data: creatorStatus } = useCreatorStatus();
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [path]);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Donate", path: "/donate" },
    { name: "Business", path: "/business" },
    { name: "Creators", path: "/creators" },
    { name: "About", path: "/about" },
  ];

  return (
    <header className="bg-background sticky top-0 z-50 header-gradient-shadow">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/">
          <div className="cursor-pointer">
            <Logo />
          </div>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <div className="text-foreground hover:text-primary transition-colors font-medium cursor-pointer">
                {item.name}
              </div>
            </Link>
          ))}
        </nav>
        
        <div className="flex items-center space-x-4">
          {isLoading ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} />
                    <AvatarFallback>
                      {user?.firstName?.[0] || user?.email?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <div className="cursor-pointer w-full">Profile</div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/manage-campaigns">
                    <div className="cursor-pointer w-full">Manage Campaigns</div>
                  </Link>
                </DropdownMenuItem>
                {creatorStatus?.isCreator && (
                  <DropdownMenuItem asChild>
                    <Link href="/creator-profile">
                      <div className="cursor-pointer w-full">Creator Profile</div>
                    </Link>
                  </DropdownMenuItem>
                )}
                {user?.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <div className="cursor-pointer w-full">Admin Dashboard</div>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <a href="/api/logout" className="cursor-pointer w-full">Log Out</a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/auth">
                <div className="hidden md:block text-foreground hover:text-primary transition-colors font-medium cursor-pointer">
                  Log In
                </div>
              </Link>
              <Link href="/auth">
                <div className="hidden md:block bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded-md transition-colors cursor-pointer">
                  Sign Up
                </div>
              </Link>
            </>
          )}
          
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-background">
          <div className="container mx-auto px-4 py-3 flex flex-col space-y-4">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <div className="text-foreground hover:text-primary transition-colors font-medium py-2 cursor-pointer">
                  {item.name}
                </div>
              </Link>
            ))}
            <hr className="border-gray-200" />
            {user ? (
              <>
                <Link href="/profile">
                  <div className="text-foreground hover:text-primary transition-colors font-medium py-2 cursor-pointer">
                    Profile
                  </div>
                </Link>
                <Link href="/manage-campaigns">
                  <div className="text-foreground hover:text-primary transition-colors font-medium py-2 cursor-pointer">
                    Manage Campaigns
                  </div>
                </Link>
                {creatorStatus?.isCreator && (
                  <Link href="/creator-profile">
                    <div className="text-foreground hover:text-primary transition-colors font-medium py-2 cursor-pointer">
                      Creator Profile
                    </div>
                  </Link>
                )}
                <a 
                  href="/api/logout" 
                  className="text-foreground hover:text-primary transition-colors font-medium py-2"
                >
                  Log Out
                </a>
              </>
            ) : (
              <div className="flex space-x-4">
                <Link href="/auth">
                  <div className="text-foreground hover:text-primary transition-colors font-medium py-2 cursor-pointer">
                    Log In
                  </div>
                </Link>
                <Link href="/auth">
                  <div className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded-md transition-colors cursor-pointer">
                    Sign Up
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
