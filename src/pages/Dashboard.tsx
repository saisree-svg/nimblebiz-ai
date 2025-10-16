import { useState, useEffect } from "react";
import { StatsCard } from "@/components/StatsCard";
import { AIAssistantOrb } from "@/components/AIAssistantOrb";
import { SmartInsightsCard } from "@/components/SmartInsightsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { AuthCheck } from "@/components/AuthCheck";
import Header from "@/components/Header";
import { 
  IndianRupee, 
  Package, 
  AlertTriangle, 
  TrendingUp,
  Plus,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todaySales: 0,
    totalItems: 0,
    lowStockCount: 0,
    weekSales: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch inventory stats
      const { data: inventory } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id);

      // Fetch transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Calculate stats
      const totalItems = inventory?.length || 0;
      const lowStock = inventory?.filter(item => item.stock <= item.minimum_stock) || [];
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTransactions = transactions?.filter(t => new Date(t.created_at) >= today) || [];
      const todaySales = todayTransactions.reduce((sum, t) => sum + Number(t.total_amount), 0);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekTransactions = transactions?.filter(t => new Date(t.created_at) >= weekAgo) || [];
      const weekSales = weekTransactions.reduce((sum, t) => sum + Number(t.total_amount), 0);

      setStats({
        todaySales,
        totalItems,
        lowStockCount: lowStock.length,
        weekSales
      });

      setRecentTransactions(transactions?.slice(0, 4) || []);
      setLowStockItems(lowStock.slice(0, 3));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <AuthCheck>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p>Loading dashboard...</p>
        </div>
      </AuthCheck>
    );
  }

  return (
    <AuthCheck>
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      <Header />
      
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative container mx-auto px-4 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Today's Sales"
            value={`₹${stats.todaySales.toFixed(2)}`}
            icon={IndianRupee}
            variant="success"
            trend={{
              value: "+23% from yesterday",
              isPositive: true
            }}
          />
          <StatsCard
            title="Total Items"
            value={stats.totalItems.toString()}
            icon={Package}
            variant="default"
          />
          <StatsCard
            title="Low Stock Alerts"
            value={stats.lowStockCount.toString()}
            icon={AlertTriangle}
            variant="warning"
          />
          <StatsCard
            title="This Week"
            value={`₹${stats.weekSales.toFixed(2)}`}
            icon={TrendingUp}
            variant="success"
            trend={{
              value: "+15% from last week",
              isPositive: true
            }}
          />
        </div>

        {/* Smart Insights Card */}
        <SmartInsightsCard />


        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <Card className="relative overflow-hidden border-2 border-success/20 bg-card/80 backdrop-blur-sm shadow-[0_0_20px_hsl(142_71%_45%/0.2)] animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-lime/5" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center justify-between text-xl">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                  Recent Transactions
                </span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => navigate("/analytics")}
                  className="hover:bg-success/10 hover:text-success"
                >
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              {recentTransactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => (
                    <div 
                      key={transaction.id} 
                      className="flex justify-between items-center p-3 rounded-xl bg-gradient-to-r from-muted/30 to-success/5 border border-success/10 hover:border-success/30 hover:shadow-[0_0_15px_hsl(142_71%_45%/0.3)] transition-all duration-300 group"
                    >
                      <div>
                        <p className="font-semibold group-hover:text-success transition-colors">
                          {transaction.items?.[0]?.name || 'Multiple items'}
                          {transaction.items?.length > 1 && ` +${transaction.items.length - 1} more`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-success">+₹{Number(transaction.total_amount).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground font-medium">{transaction.payment_method}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card className="relative overflow-hidden border-2 border-warning/30 bg-card/80 backdrop-blur-sm shadow-[0_0_20px_hsl(38_92%_50%/0.3)] animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-br from-warning/10 via-transparent to-accent/10 animate-pulse-slow" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 rounded-lg bg-gradient-to-br from-warning to-accent shadow-neon">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-warning to-accent bg-clip-text text-transparent font-bold">
                  Low Stock Alerts
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              {lowStockItems.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-block p-3 rounded-full bg-success/20 mb-3">
                    <Package className="h-8 w-8 text-success" />
                  </div>
                  <p className="text-muted-foreground font-medium">All items well stocked!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStockItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex justify-between items-center p-3 rounded-xl bg-gradient-to-r from-warning/10 to-accent/10 border-2 border-warning/20 hover:border-warning/40 hover:shadow-neon transition-all duration-300 group"
                    >
                      <div>
                        <p className="font-semibold group-hover:text-warning transition-colors">{item.name}</p>
                        <p className="text-xs text-muted-foreground font-medium">
                          Current: {item.stock} {item.unit} (Min: {item.minimum_stock})
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-warning to-accent hover:shadow-neon transition-all duration-300"
                        onClick={() => navigate("/inventory")}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Restock
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Assistant Orb */}
      <AIAssistantOrb />
    </div>
    </AuthCheck>
  );
};

export default Dashboard;
