import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, QrCode, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";

const UpiPayment = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [shopName, setShopName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [qrData, setQrData] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [settingsConfigured, setSettingsConfigured] = useState(false);

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
        setSettingsConfigured(true);
      }
    } catch (error: any) {
      console.error("Error loading settings:", error);
    }
  };

  const generateQrCode = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!settingsConfigured) {
      toast.error("Please configure your UPI settings first");
      navigate("/settings");
      return;
    }

    // UPI URL format: upi://pay?pa=<UPI_ID>&pn=<Name>&am=<Amount>&cu=INR&tn=<Note>
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName)}&am=${amount}&cu=INR${note ? `&tn=${encodeURIComponent(note)}` : ""}`;
    
    setQrData(upiUrl);
    setShowQr(true);
    toast.success("QR Code generated! Customer can scan to pay");
  };

  const resetQr = () => {
    setShowQr(false);
    setAmount("");
    setNote("");
    setQrData("");
  };

  if (!settingsConfigured) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">UPI Payment</h1>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="border-warning/50 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertCircle className="h-5 w-5" />
                Configuration Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                You need to configure your UPI settings before you can generate payment QR codes.
              </p>
              <Button onClick={() => navigate("/settings")} className="w-full">
                Go to Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">UPI Payment</h1>
              <p className="text-sm text-muted-foreground">
                Generate QR codes for instant payments
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {!showQr ? (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Generate Payment QR Code</CardTitle>
              <CardDescription>
                Receiving to: <span className="font-semibold text-foreground">{upiId}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); generateQrCode(); }} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                    step="0.01"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Note (Optional)</Label>
                  <Input
                    id="note"
                    placeholder="Payment for..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={50}
                  />
                  <p className="text-xs text-muted-foreground">
                    Add a note to help identify this transaction
                  </p>
                </div>

                <Button type="submit" className="w-full">
                  <QrCode className="mr-2 h-4 w-4" />
                  Generate QR Code
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="animate-scale-in">
            <CardHeader>
              <CardTitle>Scan to Pay</CardTitle>
              <CardDescription>
                Customer should scan this QR code with any UPI app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <QRCodeSVG
                    value={qrData}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                <div className="text-center space-y-2">
                  <p className="text-3xl font-bold text-primary">₹{amount}</p>
                  {note && (
                    <p className="text-sm text-muted-foreground">{note}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    To: {shopName}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Button onClick={resetQr} variant="outline" className="w-full">
                  Generate New QR Code
                </Button>
                <Button onClick={() => navigate("/dashboard")} variant="secondary" className="w-full">
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Supported UPI Apps</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Customers can use any UPI app: Google Pay, PhonePe, Paytm, BHIM, Amazon Pay, etc.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UpiPayment;
