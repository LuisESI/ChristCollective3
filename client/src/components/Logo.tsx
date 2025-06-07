import logoPath from "@assets/Untitled design (4)_1749330134801.png";

interface LogoProps {
  className?: string;
  dark?: boolean;
}

export function Logo({ className = "h-8 w-auto", dark = false }: LogoProps) {
  return (
    <img 
      src={logoPath}
      alt="Christ Collective" 
      className={className}
    />
  );
}
