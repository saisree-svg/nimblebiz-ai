import { Brain, TrendingUp, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SmartInsightsCardProps {
  insights?: string[];
}

export const SmartInsightsCard = ({ insights }: SmartInsightsCardProps) => {
  const defaultInsights = [
    "Today's sales are up 23% compared to yesterday",
    "Top-selling item: Fresh Milk (+42% increase)",
    "Low stock alert: 3 items need restocking soon"
  ];

  const displayInsights = insights || defaultInsights;

  return (
    <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 backdrop-blur-sm shadow-glow animate-fade-in">
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 animate-pulse-slow" />
      
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-secondary shadow-glow">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent font-bold">
            AI Smart Insights
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative space-y-3">
        {displayInsights.map((insight, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 backdrop-blur-sm border border-primary/10 hover:border-primary/30 hover:shadow-cyber transition-all duration-300 group"
          >
            {index === 0 ? (
              <TrendingUp className="h-4 w-4 text-success mt-0.5 group-hover:scale-110 transition-transform" />
            ) : index === 1 ? (
              <Zap className="h-4 w-4 text-accent mt-0.5 group-hover:scale-110 transition-transform" />
            ) : (
              <div className="h-4 w-4 rounded-full bg-gradient-to-br from-warning to-accent mt-0.5 group-hover:scale-110 transition-transform" />
            )}
            <p className="text-sm text-muted-foreground flex-1">{insight}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
