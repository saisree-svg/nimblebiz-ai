import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, CheckCircle } from "lucide-react";
import { useRef } from "react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BillItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
}

interface BillSummaryProps {
  open: boolean;
  onClose: () => void;
  items: BillItem[];
  subtotal: number;
  tax: number;
  total: number;
  shopName: string;
  shopLocation: string;
  paymentMethod: string;
}

export const BillSummary = ({
  open,
  onClose,
  items,
  subtotal,
  tax,
  total,
  shopName,
  shopLocation,
  paymentMethod
}: BillSummaryProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text(shopName, 14, 22);
    doc.setFontSize(10);
    doc.text(shopLocation, 14, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 36);
    doc.text(`Time: ${new Date().toLocaleTimeString()}`, 14, 42);
    doc.text(`Payment Method: ${paymentMethod.toUpperCase()}`, 14, 48);
    
    // Items table
    const tableData = items.map(item => [
      item.name,
      `${item.quantity} ${item.unit}`,
      `₹${item.price.toFixed(2)}`,
      `₹${(item.price * item.quantity).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 55,
      head: [['Item', 'Quantity', 'Price', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] }
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text(`Subtotal: ₹${subtotal.toFixed(2)}`, 14, finalY);
    doc.text(`Tax (5%): ₹${tax.toFixed(2)}`, 14, finalY + 6);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`Total: ₹${total.toFixed(2)}`, 14, finalY + 14);

    doc.save(`bill-${Date.now()}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto print:shadow-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Payment Successful!
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="space-y-6 p-4 bg-card">
          {/* Shop Info */}
          <div className="text-center border-b pb-4">
            <h2 className="text-2xl font-bold">{shopName}</h2>
            <p className="text-muted-foreground">{shopLocation}</p>
            <div className="flex justify-center gap-4 mt-2 text-sm">
              <span>Date: {new Date().toLocaleDateString()}</span>
              <span>Time: {new Date().toLocaleTimeString()}</span>
            </div>
            <p className="text-sm mt-1">Payment: <span className="font-semibold uppercase">{paymentMethod}</span></p>
          </div>

          {/* Items */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Bill Items</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3">Item</th>
                    <th className="text-center p-3">Qty</th>
                    <th className="text-right p-3">Price</th>
                    <th className="text-right p-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-3">{item.name}</td>
                      <td className="text-center p-3">{item.quantity} {item.unit}</td>
                      <td className="text-right p-3">₹{item.price.toFixed(2)}</td>
                      <td className="text-right p-3">₹{(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (5%):</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold border-t pt-2">
              <span>Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground border-t pt-4">
            Thank you for your business!
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 print:hidden">
          <Button onClick={handlePrint} variant="outline" className="flex-1">
            <Printer className="mr-2 h-4 w-4" />
            Print Bill
          </Button>
          <Button onClick={handleDownloadPDF} variant="outline" className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
