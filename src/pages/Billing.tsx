import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { AuthCheck } from "@/components/AuthCheck";
import Header from "@/components/Header";
import { BillSummary } from "@/components/BillSummary";
import { Plus, Minus, ShoppingCart, CreditCard, Search, Download, Save, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
  category: string | null;
  image_url: string | null;
}

interface BillItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

const Billing = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [shopSettings, setShopSettings] = useState<any>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const [showBillSummary, setShowBillSummary] = useState(false);
  const [completedBill, setCompletedBill] = useState<{items: BillItem[], subtotal: number, tax: number, total: number, method: string} | null>(null);

  useEffect(() => {
    fetchProducts();
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

  const fetchProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const addToBill = (product: Product) => {
    const existingItem = billItems.find(item => item.product_id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error(`Only ${product.stock} ${product.unit} available in stock`);
        return;
      }
      setBillItems(billItems.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      if (product.stock <= 0) {
        toast.error('Product out of stock');
        return;
      }
      setBillItems([...billItems, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        unit: product.unit
      }]);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (newQuantity <= 0) {
      setBillItems(billItems.filter(item => item.product_id !== productId));
      return;
    }

    if (newQuantity > product.stock) {
      toast.error(`Only ${product.stock} ${product.unit} available`);
      return;
    }

    setBillItems(billItems.map(item =>
      item.product_id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const removeFromBill = (productId: string) => {
    setBillItems(billItems.filter(item => item.product_id !== productId));
  };

  const subtotal = billItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.05;
  const totalAmount = subtotal + tax;

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const saveDraft = () => {
    setIsDraft(true);
    toast.success('Bill saved as draft');
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text(shopSettings?.shop_name || 'ManInventory', 14, 22);
    doc.setFontSize(10);
    doc.text(shopSettings?.location || 'Location', 14, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 36);
    doc.text(`Time: ${new Date().toLocaleTimeString()}`, 14, 42);
    
    const tableData = billItems.map(item => [
      item.name,
      `${item.quantity} ${item.unit}`,
      `₹${item.price.toFixed(2)}`,
      `₹${(item.price * item.quantity).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['Item', 'Quantity', 'Price', 'Total']],
      body: tableData,
      theme: 'grid',
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Subtotal: ₹${subtotal.toFixed(2)}`, 14, finalY);
    doc.text(`Tax (5%): ₹${tax.toFixed(2)}`, 14, finalY + 6);
    doc.setFontSize(12);
    doc.text(`Total: ₹${totalAmount.toFixed(2)}`, 14, finalY + 14);

    doc.save(`invoice-${Date.now()}.pdf`);
    toast.success('Invoice downloaded');
  };

  const handleCheckout = async () => {
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    if (billItems.length === 0) {
      toast.error('Add items to bill first');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const items = billItems.map(item => ({
        inventory_id: item.product_id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price
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
      for (const item of billItems) {
        const product = products.find(p => p.id === item.product_id);
        if (product) {
          const newStock = product.stock - item.quantity;
          await supabase
            .from('inventory')
            .update({ stock: newStock })
            .eq('id', item.product_id);
        }
      }

      // Store completed bill data
      setCompletedBill({
        items: billItems,
        subtotal,
        tax,
        total: totalAmount,
        method: paymentMethod
      });

      toast.success('Payment successful!');
      setShowPaymentDialog(false);
      setBillItems([]);
      setIsDraft(false);
      setShowBillSummary(true);
      fetchProducts(); // Refresh products to show updated stock
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
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-4xl font-bold">Smart Billing System</h1>
              <p className="text-muted-foreground mt-2">
                Select products and create bills in real-time
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Products Section */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Available Products
                    </CardTitle>
                    <div className="relative mt-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8">Loading products...</div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No products found
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
                        {filteredProducts.map((product) => (
                          <Card key={product.id} className="hover-scale cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="font-semibold">{product.name}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {product.category || 'Uncategorized'}
                                  </p>
                                </div>
                                <span className="text-lg font-bold text-primary">
                                  ₹{product.price}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                  Stock: {product.stock} {product.unit}
                                </span>
                                <Button
                                  size="sm"
                                  onClick={() => addToBill(product)}
                                  disabled={product.stock <= 0}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Bill Section */}
              <div className="space-y-4">
                <Card className="glass-card sticky top-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Current Bill
                      {isDraft && <span className="text-xs text-yellow-500">(Draft)</span>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {billItems.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Add products to create bill
                        </div>
                      ) : (
                        billItems.map((item) => (
                          <div key={item.product_id} className="flex items-center gap-2 p-3 rounded-lg border">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                ₹{item.price} × {item.quantity}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.product_id, Number(e.target.value))}
                                className="w-12 h-7 text-center p-1"
                                min="1"
                              />
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="font-semibold text-sm">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    {billItems.length > 0 && (
                      <>
                        <div className="space-y-2 pt-4 border-t">
                          <div className="flex justify-between text-sm">
                            <span>Subtotal:</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Tax (5%):</span>
                            <span>₹{tax.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold pt-2 border-t">
                            <span>Total:</span>
                            <span className="text-primary">₹{totalAmount.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Button
                            className="w-full"
                            variant="outline"
                            onClick={saveDraft}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Draft
                          </Button>
                          <Button
                            className="w-full"
                            variant="outline"
                            onClick={generatePDF}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </Button>
                          <Button
                            className="w-full"
                            onClick={() => setShowPaymentDialog(true)}
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Finalize & Pay
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Complete Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-3xl font-bold text-primary">₹{totalAmount.toFixed(2)}</p>
              </div>
              
              <div className="space-y-2">
                <Button
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => setPaymentMethod('cash')}
                >
                  💵 Cash Payment
                </Button>
                <Button
                  variant={paymentMethod === 'upi' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => setPaymentMethod('upi')}
                >
                  📱 UPI Payment
                </Button>
              </div>

              {paymentMethod === 'upi' && shopSettings?.upi_id && (
                <div className="border rounded-lg p-4 space-y-2 bg-card">
                  <p className="text-sm text-center font-medium">Scan QR Code to Pay</p>
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <QRCodeSVG 
                      value={generateUpiString()}
                      size={220}
                      level="H"
                      includeMargin
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    {shopSettings.shop_name}
                  </p>
                  <p className="text-xs text-center text-muted-foreground">
                    UPI ID: {shopSettings.upi_id}
                  </p>
                </div>
              )}

              {paymentMethod === 'upi' && !shopSettings?.upi_id && (
                <div className="p-4 bg-destructive/10 rounded-lg">
                  <p className="text-sm text-destructive text-center">
                    ⚠️ Please configure UPI ID in Settings to accept UPI payments
                  </p>
                </div>
              )}

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleCheckout}
                disabled={!paymentMethod || (paymentMethod === 'upi' && !shopSettings?.upi_id)}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Complete Payment
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bill Summary Dialog */}
        {completedBill && (
          <BillSummary
            open={showBillSummary}
            onClose={() => {
              setShowBillSummary(false);
              setCompletedBill(null);
            }}
            items={completedBill.items}
            subtotal={completedBill.subtotal}
            tax={completedBill.tax}
            total={completedBill.total}
            shopName={shopSettings?.shop_name || 'ManInventory'}
            shopLocation={shopSettings?.location || ''}
            paymentMethod={completedBill.method}
          />
        )}
      </div>
    </AuthCheck>
  );
};

export default Billing;
