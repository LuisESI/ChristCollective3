interface LogoProps {
  className?: string;
  dark?: boolean;
}

export function Logo({ className = "", dark = false }: LogoProps) {
  return (
    <div className={`${className}`}>
      <img 
        src={dark ? "/assets/logo-dark.png" : "/assets/logo.png"}
        alt="Christ Collective" 
        className="h-12" 
      />
    </div>
  );
}
