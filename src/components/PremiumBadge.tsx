import { Crown } from "lucide-react";

export function PremiumBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm ${className}`}>
      <Crown className="h-3 w-3" /> Premium
    </span>
  );
}

export function FeaturedBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground ${className}`}>
      ★ Featured
    </span>
  );
}

export function PriorityBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white ${className}`}>
      ⚡ Priority
    </span>
  );
}
