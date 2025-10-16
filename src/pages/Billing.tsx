import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { AuthCheck } from "@/components/AuthCheck";
import Header from "@/components/Header";
import { Trash2, ShoppingCart, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from 'qrcode.react';

interface CartItem {
  id: string;
  inventory_id: string;
  quantity: number;
  inventory: {
    name: string;
    price: number;
    unit: string;
    stock: number;
  };
}

const Billing = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopSettings, setShopSettings] = useState<any>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | null>(null);

  useEffect(() => {
    fetchCart();
    fetchShopSettings();
  }, []);

  const fetchShopSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('shop_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setShopSettings(data);
    } catch (error) {
      console.error('Error fetching shop settings:', error);
    }
  };

  const fetchCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('cart')
        .select(`
          id,
          inventory_id,
          quantity,
          inventory (
            name,
            price,
            unit,
            stock
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart items');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCartItems(cartItems.filter(item => item.id !== id));
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  };

  const totalAmount = cartItems.reduce((total, item) => {
    return total + (item.inventory.price * item.quantity);
  }, 0);

  const handleCheckout = async () => {
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const items = cartItems.map(item => ({
        inventory_id: item.inventory_id,
        name: item.inventory.name,
        quantity: item.quantity,
        price: item.inventory.price,
        total: item.quantity * item.inventory.price
      }));

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: user.id,
            total_amount: totalAmount,
            payment_method: paymentMethod,
            payment_status: 'completed',
            items: items
          }
        ]);

      if (transactionError) throw transactionError;

      // Update inventory stock
      for (const item of cartItems) {
        const newStock = item.inventory.stock - item.quantity;
        await supabase
          .from('inventory')
          .update({ stock: newStock })
          .eq('id', item.inventory_id);
      }

      // Clear cart
      const { error: deleteError } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      toast.success('Payment successful!');
      setShowPaymentDialog(false);
      setCartItems([]);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error processing checkout:', error);
      toast.error('Failed to process payment');
    }
  };

  const generateUpiString = () => {
    if (!shopSettings?.upi_id) return '';
    return `upi://pay?pa=${shopSettings.upi_id}&pn=${encodeURIComponent(shopSettings.shop_name)}&am=${totalAmount}&cu=INR`;
  };

  return (
    <AuthCheck>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h1 className="text-4xl font-bold">Billing</h1>
              <p className="text-muted-foreground mt-2">
                {cartItems.length} items in cart
              </p>
            </div>
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : cartItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Your cart is empty
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Name</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cartItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.inventory.name}
                            </TableCell>
                            <TableCell>
                              {item.quantity} {item.inventory.unit}
                            </TableCell>
                            <TableCell>₹{item.inventory.price}</TableCell>
                            <TableCell className="font-semibold">
                              ₹{(item.inventory.price * item.quantity).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total Amount:</span>
                      <span>₹{totalAmount.toFixed(2)}</span>
                    </div>
                    <Button 
                      className="w-full"
                      size="lg"
                      disabled={cartItems.length === 0}
                      onClick={() => setShowPaymentDialog(true)}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Proceed to Payment (₹{totalAmount.toFixed(2)})
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Select Payment Method</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">Total: ₹{totalAmount.toFixed(2)}</p>
                </div>
                
                <div className="space-y-2">
                  <Button
                    variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => setPaymentMethod('cash')}
                  >
                    Cash Payment
                  </Button>
                  <Button
                    variant={paymentMethod === 'upi' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => setPaymentMethod('upi')}
                  >
                    UPI/Digital Payment
                  </Button>
                </div>

                {paymentMethod === 'upi' && shopSettings?.upi_id && (
                  <div className="border rounded-lg p-4 space-y-2">
                    <p className="text-sm text-center text-muted-foreground">Scan to Pay</p>
                    <div className="flex justify-center">
                      <QRCodeSVG 
                        value={generateUpiString()}
                        size={200}
                        level="H"
                      />
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      {shopSettings.shop_name}
                    </p>
                  </div>
                )}

                {paymentMethod === 'upi' && !shopSettings?.upi_id && (
                  <p className="text-sm text-destructive text-center">
                    Please configure UPI ID in Settings to accept UPI payments
                  </p>
                )}

                <Button 
                  className="w-full" 
                  onClick={handleCheckout}
                  disabled={!paymentMethod || (paymentMethod === 'upi' && !shopSettings?.upi_id)}
                >
                  Confirm Payment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </div>
    </AuthCheck>
  );
};

export default Billing;
