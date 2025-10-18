import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, AlertCircle, Package } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface RestockSuggestion {
  item: string;
  currentStock: string;
  recommendedStock: string;
  priority: 'High' | 'Medium' | 'Low';
  reason: string;
  orderQuantity: string;
}

export const AIRestockAssistant = () => {
  const [suggestions, setSuggestions] = useState<RestockSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch inventory data
      const { data: inventory, error: invError } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id);

      if (invError) throw invError;

      // Fetch recent transactions (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString());

      if (transError) throw transError;

      // Calculate sales data
      const salesMap = new Map();
      transactions?.forEach((transaction: any) => {
        transaction.items?.forEach((item: any) => {
          const existing = salesMap.get(item.name) || { name: item.name, total_sold: 0, unit: 'units' };
          existing.total_sold += item.quantity;
          salesMap.set(item.name, existing);
        });
      });

      const salesData = Array.from(salesMap.values());

      // Call AI edge function
      const { data, error } = await supabase.functions.invoke('ai-restock-suggestions', {
        body: {
          inventoryData: inventory,
          salesData: salesData
        }
      });

      if (error) throw error;

      setSuggestions(data.suggestions || []);
      toast.success('AI suggestions generated!');
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast.error('Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return <AlertCircle className="h-4 w-4" />;
      case 'medium': return <TrendingUp className="h-4 w-4" />;
      case 'low': return <Package className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Card className="shadow-glow border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse-slow" />
            AI Restock Assistant
          </span>
          <Button
            onClick={generateSuggestions}
            disabled={loading}
            size="sm"
            className="bg-gradient-to-r from-primary to-secondary"
          >
            {loading ? 'Analyzing...' : 'Generate Suggestions'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Click "Generate Suggestions" to get AI-powered restock recommendations</p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className="p-4 border rounded-lg bg-card hover:shadow-neon transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-lg">{suggestion.item}</h4>
                  <Badge
                    variant={getPriorityColor(suggestion.priority) as any}
                    className="flex items-center gap-1"
                  >
                    {getPriorityIcon(suggestion.priority)}
                    {suggestion.priority}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <span className="text-muted-foreground">Current Stock:</span>
                    <p className="font-medium">{suggestion.currentStock}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Recommended:</span>
                    <p className="font-medium text-primary">{suggestion.recommendedStock}</p>
                  </div>
                </div>

                <div className="text-sm mb-2">
                  <span className="text-muted-foreground">Reason:</span>
                  <p className="mt-1">{suggestion.reason}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium">Suggested Order:</span>
                  <span className="text-lg font-bold text-primary">{suggestion.orderQuantity}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
