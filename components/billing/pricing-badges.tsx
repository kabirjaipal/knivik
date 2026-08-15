import { Badge } from "@/components/ui/badge";

interface FormatPriceProps {
  amount: number | null;
  billingCycle?: "monthly" | "yearly" | string | null;
  className?: string;
  currency?: string;
  showPeriod?: boolean;
}

export function FormatPrice({ 
  amount, 
  billingCycle = "monthly", 
  className = "", 
  currency = "USD",
  showPeriod = true
}: FormatPriceProps) {
  
  if (amount === null || amount === undefined) {
    return (
      <div className={`flex items-baseline gap-1 ${className}`}>
        <span className="text-3xl font-extrabold tracking-tight">--</span>
      </div>
    );
  }

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);

  const period = billingCycle === "yearly" ? "yr" : "mo";

  return (
    <div className={`flex items-baseline gap-1 ${className}`}>
      <span className="text-3xl font-extrabold tracking-tight">{formatted}</span>
      {showPeriod && amount > 0 && (
        <span className="text-muted-foreground text-sm font-medium">/{period}</span>
      )}
    </div>
  );
}

export function PlanBadge({ plan, className = "" }: { plan: string; className?: string }) {
  const normalizedPlan = plan.toUpperCase();
  
  switch (normalizedPlan) {
    case "PRO":
      return (
        <Badge className={`bg-primary text-primary-foreground border-none font-bold tracking-tighter uppercase text-xs px-2 py-0.5 ${className}`}>
          Pro
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className={`font-bold tracking-tighter uppercase text-xs px-2 py-0.5 ${className}`}>
          Free
        </Badge>
      );
  }
}
