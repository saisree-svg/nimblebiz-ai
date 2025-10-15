import { useState, useEffect } from "react";
import { StatsCard } from "@/components/StatsCard";
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
  Settings as SettingsIcon
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back, Shop Owner</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Today's Sales"
            value={`₹${stats.todaySales.toFixed(2)}`}
            icon={IndianRupee}
            variant="success"
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
          />
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Button 
            className="h-24 text-lg" 
            onClick={() => navigate("/inventory")}
          >
            <Package className="mr-2 h-6 w-6" />
            Manage Inventory
          </Button>
          <Button 
            className="h-24 text-lg"
            variant="secondary"
            onClick={() => navigate("/billing")}
          >
            <ShoppingCart className="mr-2 h-6 w-6" />
            Billing
          </Button>
          <Button 
            className="h-24 text-lg"
            variant="outline"
            onClick={() => navigate("/settings")}
          >
            <SettingsIcon className="mr-2 h-6 w-6" />
            Settings
          </Button>
          <Button 
            className="h-24 text-lg"
            variant="outline"
            onClick={() => navigate("/analytics")}
          >
            <BarChart3 className="mr-2 h-6 w-6" />
            View Analytics
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Transactions
                <Button size="sm" variant="ghost" onClick={() => navigate("/analytics")}>
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No transactions yet</p>
              ) : (
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div 
                      key={transaction.id} 
                      className="flex justify-between items-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div>
                        <p className="font-medium">
                          {transaction.items?.[0]?.name || 'Multiple items'}
                          {transaction.items?.length > 1 && ` +${transaction.items.length - 1} more`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-success">+₹{Number(transaction.total_amount).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{transaction.payment_method}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card className="animate-fade-in border-warning/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">All items well stocked!</p>
              ) : (
                <div className="space-y-4">
                  {lowStockItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex justify-between items-center p-3 rounded-lg bg-warning/10 border border-warning/20"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Current: {item.stock} {item.unit} (Min: {item.minimum_stock})
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
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
    </div>
    </AuthCheck>
  );
};

export default Dashboard;
