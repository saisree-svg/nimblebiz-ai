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
  QrCode,
  Settings as SettingsIcon
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const recentTransactions = [
    { id: 1, item: "Rice (1kg)", amount: 45, time: "10 mins ago", type: "sale" },
    { id: 2, item: "Milk (500ml)", amount: 25, time: "25 mins ago", type: "sale" },
    { id: 3, item: "Bread", amount: 40, time: "1 hour ago", type: "sale" },
    { id: 4, item: "Eggs (12)", amount: 72, time: "2 hours ago", type: "sale" },
  ];

  const lowStockItems = [
    { id: 1, name: "Sugar", current: 5, min: 10 },
    { id: 2, name: "Tea Powder", current: 3, min: 8 },
    { id: 3, name: "Cooking Oil", current: 2, min: 5 },
  ];

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
            value="₹2,845"
            icon={IndianRupee}
            trend={{ value: "12% from yesterday", isPositive: true }}
            variant="success"
          />
          <StatsCard
            title="Total Items"
            value="156"
            icon={Package}
            variant="default"
          />
          <StatsCard
            title="Low Stock Alerts"
            value="3"
            icon={AlertTriangle}
            variant="warning"
          />
          <StatsCard
            title="This Week"
            value="₹18,420"
            icon={TrendingUp}
            trend={{ value: "8% from last week", isPositive: true }}
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
            onClick={() => navigate("/upi-payment")}
          >
            <QrCode className="mr-2 h-6 w-6" />
            UPI Payment
          </Button>
          <Button 
            className="h-24 text-lg"
            variant="outline"
            onClick={() => navigate("/settings")}
          >
            <SettingsIcon className="mr-2 h-6 w-6" />
            UPI Settings
          </Button>
          <Button 
            className="h-24 text-lg"
            variant="outline"
            onClick={() => toast.info("Analytics feature coming soon!")}
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
                <Button size="sm" variant="ghost">
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div 
                    key={transaction.id} 
                    className="flex justify-between items-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium">{transaction.item}</p>
                      <p className="text-xs text-muted-foreground">{transaction.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-success">+₹{transaction.amount}</p>
                    </div>
                  </div>
                ))}
              </div>
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
              <div className="space-y-4">
                {lowStockItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex justify-between items-center p-3 rounded-lg bg-warning/10 border border-warning/20"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Current: {item.current} units
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      Restock
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </AuthCheck>
  );
};

export default Dashboard;
