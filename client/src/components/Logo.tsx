interface LogoProps {
  className?: string;
  dark?: boolean;
}

export function Logo({ className = "", dark = false }: LogoProps) {
  return (
    <div className={`${className}`}>
      <img 
        src="/assets/logo.png"
        alt="Christ Collective" 
        className="h-12" 
      />
    </div>
  );
}
