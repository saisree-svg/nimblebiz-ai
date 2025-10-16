import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "destructive";
}

const variantStyles = {
  default: {
    bg: "bg-gradient-to-br from-primary/20 to-secondary/20",
    text: "text-primary",
    glow: "shadow-glow hover:shadow-cyber",
    border: "border-primary/30"
  },
  success: {
    bg: "bg-gradient-to-br from-success/20 to-lime/20",
    text: "text-success",
    glow: "shadow-[0_0_20px_hsl(142_71%_45%/0.3)] hover:shadow-[0_0_30px_hsl(142_71%_45%/0.5)]",
    border: "border-success/30"
  },
  warning: {
    bg: "bg-gradient-to-br from-warning/20 to-accent/20",
    text: "text-warning",
    glow: "shadow-[0_0_20px_hsl(38_92%_50%/0.3)] hover:shadow-neon",
    border: "border-warning/30"
  },
  destructive: {
    bg: "bg-gradient-to-br from-destructive/20 to-accent/20",
    text: "text-destructive",
    glow: "shadow-[0_0_20px_hsl(0_84%_60%/0.3)] hover:shadow-[0_0_30px_hsl(0_84%_60%/0.5)]",
    border: "border-destructive/30"
  },
};

export const StatsCard = ({ title, value, icon: Icon, trend, variant = "default" }: StatsCardProps) => {
  const styles = variantStyles[variant];
  
  return (
    <Card className={`relative overflow-hidden border-2 ${styles.border} ${styles.glow} backdrop-blur-sm bg-card/80 transition-all duration-500 hover:scale-105 hover:-translate-y-1 animate-fade-in group`}>
      {/* Animated gradient background */}
      <div className={`absolute inset-0 ${styles.bg} opacity-50 group-hover:opacity-70 transition-opacity duration-300`} />
      
      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground tracking-wide">{title}</CardTitle>
        <div className={`p-2.5 rounded-xl ${styles.bg} backdrop-blur-sm border ${styles.border} group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
          <Icon className={`h-5 w-5 ${styles.text}`} />
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        <div className="text-3xl font-bold bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent font-mono tracking-tight">
          {value}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-sm font-semibold ${trend.isPositive ? "text-success" : "text-destructive"}`}>
            {trend.isPositive ? (
              <TrendingUp className="h-4 w-4 animate-bounce" />
            ) : (
              <TrendingDown className="h-4 w-4 animate-bounce" />
            )}
            <span>{trend.value}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
