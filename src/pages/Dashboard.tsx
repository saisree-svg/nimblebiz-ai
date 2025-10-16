import { useState, useEffect } from "react";
import { StatsCard } from "@/components/StatsCard";
import { AIAssistantOrb } from "@/components/AIAssistantOrb";
import { SmartInsightsCard } from "@/components/SmartInsightsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { AuthCheck } from "@/components/AuthCheck";
import { 
  IndianRupee, 
  Package, 
  AlertTriangle, 
  TrendingUp,
  Plus,
  LogOut,
  BarChart3,
  ShoppingCart,
  Settings as SettingsIcon,
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
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
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="relative border-b border-primary/20 bg-card/50 backdrop-blur-xl shadow-glow sticky top-0 z-20">
        <div className="container mx-auto px-4 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary via-accent to-secondary shadow-glow animate-glow-pulse">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  SmartShop Manager
                </h1>
                <p className="text-sm text-muted-foreground font-medium">AI-Powered Business Control Center</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="border-2 border-primary/30 hover:border-primary/50 hover:shadow-cyber transition-all duration-300"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

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

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            size="lg"
            className="h-28 flex flex-col gap-2 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-glow hover:shadow-cyber hover:scale-105 transition-all duration-300 border-2 border-primary/30"
            onClick={() => navigate("/inventory")}
          >
            <Package className="h-8 w-8" />
            <span className="text-base font-bold">Manage Inventory</span>
          </Button>
          <Button 
            size="lg"
            className="h-28 flex flex-col gap-2 bg-gradient-to-br from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 shadow-[0_0_20px_hsl(189_94%_53%/0.4)] hover:shadow-[0_0_30px_hsl(189_94%_53%/0.6)] hover:scale-105 transition-all duration-300 border-2 border-secondary/30"
            onClick={() => navigate("/billing")}
          >
            <ShoppingCart className="h-8 w-8" />
            <span className="text-base font-bold">Billing</span>
          </Button>
          <Button 
            size="lg"
            variant="outline"
            className="h-28 flex flex-col gap-2 border-2 border-accent/30 hover:border-accent/50 bg-accent/5 hover:bg-accent/10 hover:shadow-neon hover:scale-105 transition-all duration-300"
            onClick={() => navigate("/settings")}
          >
            <SettingsIcon className="h-8 w-8 text-accent" />
            <span className="text-base font-bold text-accent">Settings</span>
          </Button>
          <Button 
            size="lg"
            variant="outline"
            className="h-28 flex flex-col gap-2 border-2 border-lime/30 hover:border-lime/50 bg-lime/5 hover:bg-lime/10 hover:shadow-[0_0_20px_hsl(84_81%_59%/0.4)] hover:scale-105 transition-all duration-300"
            onClick={() => navigate("/analytics")}
          >
            <BarChart3 className="h-8 w-8 text-lime" />
            <span className="text-base font-bold text-lime">Analytics</span>
          </Button>
        </div>

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
