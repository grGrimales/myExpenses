import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ReactNode } from "react";

interface SummaryCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  iconColor?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  description?: string;
}

export default function SummaryCard({
  title,
  value,
  icon,
  iconColor = "text-primary",
  trend = "neutral",
  trendValue,
  description,
}: SummaryCardProps) {
  const TrendIcon =
    trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;

  const trendColor =
    trend === "up"
      ? "text-green-600"
      : trend === "down"
      ? "text-red-600"
      : "text-muted-foreground";

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={cn("rounded-full bg-muted p-2", iconColor)}>
            {icon}
          </div>
        </div>

        {(trendValue || description) && (
          <div className="mt-3 flex items-center gap-1">
            {trendValue && (
              <span className={cn("flex items-center text-xs font-medium", trendColor)}>
                <TrendIcon className="mr-0.5 h-3.5 w-3.5" />
                {trendValue}
              </span>
            )}
            {description && (
              <span className="text-xs text-muted-foreground">{description}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
