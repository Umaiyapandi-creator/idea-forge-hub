
import { Link } from "@tanstack/react-router";

interface Props {
  size?: number;
  showText?: boolean;
  to?: string;
  className?: string;
}

export function Logo({ size = 36, showText = true, to = "/", className = "" }: Props) {
  const inner = (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
  src="/certs/wtd-logo.jpeg"
  alt="Way to Dream logo"
  width={size}
  height={size}
  className="rounded-lg object-cover shadow-sm ring-1 ring-primary/20"
  style={{ width: size, height: size }}
/>
      {showText && (
        <span className="text-lg font-bold tracking-tight text-foreground">
          Way to <span className="text-primary">Dream</span>
        </span>
      )}
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}
