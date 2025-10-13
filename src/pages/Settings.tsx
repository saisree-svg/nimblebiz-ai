import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [shopName, setShopName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login first");
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("shop_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setShopName(data.shop_name);
        setUpiId(data.upi_id);
        setHasExisting(true);
      }
    } catch (error: any) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const settingsData = {
        user_id: user.id,
        shop_name: shopName,
        upi_id: upiId,
      };

      let error;
      if (hasExisting) {
        const result = await supabase
          .from("shop_settings")
          .update(settingsData)
          .eq("user_id", user.id);
        error = result.error;
      } else {
        const result = await supabase
          .from("shop_settings")
          .insert([settingsData]);
        error = result.error;
        if (!error) setHasExisting(true);
      }

      if (error) throw error;

      toast.success("Settings saved successfully!");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error(error.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">UPI Settings</h1>
              <p className="text-sm text-muted-foreground">
                Configure your shop and payment details
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Payment Configuration</CardTitle>
            <CardDescription>
              Link your UPI ID to receive payments from customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="shopName">Shop Name</Label>
                <Input
                  id="shopName"
                  placeholder="My Shop"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This will be displayed on payment receipts
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="upiId">UPI ID</Label>
                <Input
                  id="upiId"
                  placeholder="yourname@paytm"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter your UPI ID (e.g., yourname@paytm, yourname@upi)
                </p>
              </div>

              {hasExisting && (
                <div className="flex items-center gap-2 p-3 bg-success/10 text-success rounded-lg">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">UPI ID already configured</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Saving..." : "Save Settings"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>1. Enter your shop name and UPI ID above</p>
            <p>2. Go to the UPI Payment page from your dashboard</p>
            <p>3. Enter the amount and generate a QR code</p>
            <p>4. Customer scans the QR code to pay directly to your UPI ID</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
