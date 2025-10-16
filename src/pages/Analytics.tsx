import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { AuthCheck } from "@/components/AuthCheck";
import Header from "@/components/Header";
import { BarChart3, TrendingUp, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<string>("");
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    avgTransaction: 0,
    topPaymentMethod: '',
    topProducts: [] as any[]
  });

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      if (period === 'day') {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else {
        startDate.setMonth(startDate.getMonth() - 1);
      }

      // Fetch transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      // Fetch inventory
      const { data: inventory } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id);

      if (!transactions || !inventory) return;

      // Calculate stats
      const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.total_amount), 0);
      const totalTransactions = transactions.length;
      const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      // Payment method stats
      const paymentMethods = transactions.reduce((acc, t) => {
        acc[t.payment_method] = (acc[t.payment_method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const topPaymentMethod = Object.keys(paymentMethods).sort((a, b) => 
        paymentMethods[b] - paymentMethods[a]
      )[0] || 'None';

      // Top products
      const productSales = transactions.reduce((acc, t) => {
        const items = t.items as any[];
        items?.forEach((item: any) => {
          if (!acc[item.name]) {
            acc[item.name] = { name: item.name, quantity: 0, revenue: 0 };
          }
          acc[item.name].quantity += item.quantity;
          acc[item.name].revenue += item.total;
        });
        return acc;
      }, {} as Record<string, any>);

      const topProducts = Object.values(productSales)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 5);

      setStats({
        totalRevenue,
        totalTransactions,
        avgTransaction,
        topPaymentMethod,
        topProducts
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      const { data: inventory } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id);

      const { data, error } = await supabase.functions.invoke('generate-analytics', {
        body: { 
          transactions,
          inventory,
          period 
        }
      });

      if (error) throw error;
      
      if (data.insights) {
        setInsights(data.insights);
        toast.success('AI insights generated');
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error('Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCheck>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold">Analytics & Insights</h1>
                <p className="text-muted-foreground mt-2">
                  AI-powered business intelligence
                </p>
              </div>
              <div className="flex gap-2">
                <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={generateAIInsights} disabled={loading}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate AI Insights
                </Button>
              </div>
            </div>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.totalTransactions}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg. Transaction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">₹{stats.avgTransaction.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Top Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold capitalize">{stats.topPaymentMethod}</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Selling Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.topProducts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No sales data yet</p>
              ) : (
                <div className="space-y-4">
                  {stats.topProducts.map((product, index) => (
                    <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Sold: {product.quantity} units
                        </p>
                      </div>
                      <p className="font-semibold">₹{product.revenue.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Insights */}
          {insights && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI-Generated Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap font-sans text-sm">{insights}</pre>
                </div>
              </CardContent>
            </Card>
          )}

          {!insights && !loading && (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground space-y-2">
                  <BarChart3 className="h-12 w-12 mx-auto opacity-50" />
                  <p>Click "Generate AI Insights" to get intelligent analysis of your business performance</p>
                </div>
              </CardContent>
            </Card>
          )}
          </div>
        </div>
      </div>
    </AuthCheck>
  );
};

export default Analytics;
