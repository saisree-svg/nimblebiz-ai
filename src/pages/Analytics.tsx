import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthCheck } from "@/components/AuthCheck";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, DollarSign, ShoppingBag, Package, Download, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Analytics = () => {
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [dailySales, setDailySales] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [categoryRevenue, setCategoryRevenue] = useState<any[]>([]);
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<string>("");
  const [generatingInsights, setGeneratingInsights] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: inventoryData } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id);

      // Calculate metrics
      const revenue = data.reduce((sum, t) => sum + Number(t.total_amount), 0);
      setTotalRevenue(revenue);
      setTotalTransactions(data.length);
      setAvgOrderValue(data.length > 0 ? revenue / data.length : 0);

      // Today's revenue
      const today = new Date().toDateString();
      const todayTransactions = data.filter(t => new Date(t.created_at).toDateString() === today);
      const todayRev = todayTransactions.reduce((sum, t) => sum + Number(t.total_amount), 0);
      setTodayRevenue(todayRev);

      // Process daily sales (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toDateString();
      });

      const dailyData = last7Days.map(dateStr => {
        const dayTransactions = data.filter(t => new Date(t.created_at).toDateString() === dateStr);
        const dayRevenue = dayTransactions.reduce((sum, t) => sum + Number(t.total_amount), 0);
        return {
          date: new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: dayRevenue,
          transactions: dayTransactions.length
        };
      });
      setDailySales(dailyData);

      // Process top products
      const productMap = new Map();
      data.forEach(transaction => {
        if (transaction.items && Array.isArray(transaction.items)) {
          transaction.items.forEach((item: any) => {
            const current = productMap.get(item.name) || { name: item.name, quantity: 0, revenue: 0 };
            productMap.set(item.name, {
              name: item.name,
              quantity: current.quantity + Number(item.quantity),
              revenue: current.revenue + Number(item.total)
            });
          });
        }
      });

      const topProds = Array.from(productMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
      setTopProducts(topProds);

      // Category revenue
      const categoryMap = new Map();
      if (inventoryData) {
        data.forEach(transaction => {
          if (transaction.items && Array.isArray(transaction.items)) {
            transaction.items.forEach((item: any) => {
              const product = inventoryData.find((p: any) => p.id === item.inventory_id);
              const category = product?.category || 'Uncategorized';
              const current = categoryMap.get(category) || 0;
              categoryMap.set(category, current + Number(item.total));
            });
          }
        });
      }
      const catRevenue = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
      setCategoryRevenue(catRevenue);

      // Low stock items
      if (inventoryData) {
        const lowStock = inventoryData
          .filter((item: any) => item.stock < item.minimum_stock || item.stock < 5)
          .sort((a: any, b: any) => a.stock - b.stock)
          .slice(0, 5);
        setLowStockItems(lowStock);
      }

      // Payment methods
      const paymentMap = new Map();
      data.forEach(transaction => {
        const method = transaction.payment_method || 'unknown';
        paymentMap.set(method, (paymentMap.get(method) || 0) + 1);
      });
      const paymentData = Array.from(paymentMap.entries()).map(([name, value]) => ({ name, value }));
      setPaymentMethods(paymentData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = async () => {
    setGeneratingInsights(true);
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

      const { data: functionData, error: functionError } = await supabase.functions.invoke('generate-analytics', {
        body: { 
          transactions,
          inventory,
          metrics: {
            totalRevenue,
            todayRevenue,
            totalTransactions,
            topProducts,
            lowStockItems,
            avgOrderValue
          }
        }
      });

      if (functionError) throw functionError;
      setAiInsights(functionData.insights || 'No insights available');
      toast.success('AI insights generated successfully');
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error('Failed to generate AI insights');
    } finally {
      setGeneratingInsights(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Analytics Report', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

    // Summary
    autoTable(doc, {
      startY: 40,
      head: [['Metric', 'Value']],
      body: [
        ['Total Revenue', `₹${totalRevenue.toFixed(2)}`],
        ['Today\'s Revenue', `₹${todayRevenue.toFixed(2)}`],
        ['Total Transactions', totalTransactions.toString()],
        ['Avg Order Value', `₹${avgOrderValue.toFixed(2)}`]
      ],
      theme: 'grid'
    });

    // Top Products
    if (topProducts.length > 0) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Product', 'Quantity Sold', 'Revenue']],
        body: topProducts.map(p => [p.name, p.quantity.toString(), `₹${p.revenue.toFixed(2)}`]),
        theme: 'grid'
      });
    }

    doc.save(`analytics-${Date.now()}.pdf`);
    toast.success('Report exported to PDF');
  };

  const exportToCSV = () => {
    const csvData = [
      ['Metric', 'Value'],
      ['Total Revenue', totalRevenue.toFixed(2)],
      ['Today\'s Revenue', todayRevenue.toFixed(2)],
      ['Total Transactions', totalTransactions.toString()],
      ['Avg Order Value', avgOrderValue.toFixed(2)],
      [''],
      ['Top Products', 'Quantity', 'Revenue'],
      ...topProducts.map(p => [p.name, p.quantity.toString(), p.revenue.toFixed(2)])
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${Date.now()}.csv`;
    a.click();
    toast.success('Data exported to CSV');
  };

  const COLORS = ['#6366F1', '#22D3EE', '#EC4899', '#A3E635', '#F59E0B'];

  if (loading) {
    return (
      <AuthCheck>
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-20">Loading analytics...</div>
          </div>
        </div>
      </AuthCheck>
    );
  }

  return (
    <AuthCheck>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold">Analytics Dashboard</h1>
                <p className="text-muted-foreground mt-2">Real-time business insights powered by AI</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" onClick={exportToPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">₹{totalRevenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">All time</p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-secondary" />
                    Today's Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">₹{todayRevenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Current day</p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-accent" />
                    Total Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalTransactions}</div>
                  <p className="text-xs text-muted-foreground mt-1">All orders</p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Avg Order Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">₹{avgOrderValue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
                </CardContent>
              </Card>
            </div>

            {/* AI Insights */}
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary animate-pulse-slow" />
                    AI Smart Insights
                  </CardTitle>
                  <Button onClick={generateAIInsights} disabled={generatingInsights}>
                    {generatingInsights ? 'Generating...' : 'Generate Insights'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {aiInsights ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="whitespace-pre-wrap">{aiInsights}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Click "Generate Insights" to get AI-powered business recommendations and analysis
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Daily Sales (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailySales}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3} 
                        name="Revenue (₹)"
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="transactions" 
                        stroke="hsl(var(--secondary))" 
                        strokeWidth={3} 
                        name="Orders"
                        dot={{ fill: 'hsl(var(--secondary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Top 5 Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topProducts}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                      <Bar dataKey="quantity" fill="hsl(var(--primary))" name="Quantity Sold" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Revenue by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryRevenue}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => entry.name}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryRevenue.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={paymentMethods}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--secondary))" name="Transactions" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Low Stock Alerts */}
            {lowStockItems.length > 0 && (
              <Card className="glass-card border-destructive/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5 animate-pulse" />
                    Low Stock Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lowStockItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.category || 'Uncategorized'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-destructive">{item.stock} {item.unit}</p>
                          <p className="text-xs text-muted-foreground">Min: {item.minimum_stock}</p>
                        </div>
                      </div>
                    ))}
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
