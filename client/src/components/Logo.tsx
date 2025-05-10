import { LogoSvg } from './LogoSvg';

interface LogoProps {
  className?: string;
  dark?: boolean;
}

export function Logo({ className = "", dark = false }: LogoProps) {
  return (
    <div className={`${className}`}>
      <LogoSvg className="h-10 w-auto" />
    </div>
  );
}
