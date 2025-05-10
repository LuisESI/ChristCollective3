import { Star } from "lucide-react";

interface LogoProps {
  className?: string;
  dark?: boolean;
}

export function Logo({ className = "", dark = false }: LogoProps) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
        <Star className="text-white text-lg" />
      </div>
      <div className={`text-xl font-bold ${dark ? 'text-white' : 'text-foreground'} flex flex-col leading-none sm:flex-row sm:items-center sm:space-x-1`}>
        <span>CHRIST</span>
        <span>COLLECTIVE</span>
      </div>
    </div>
  );
}
