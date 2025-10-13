import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Plus, Pencil, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

interface InventoryItem {
  id: number;
  name: string;
  stock: number;
  unit: string;
  price: number;
  minStock: number;
}

const Inventory = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const [items, setItems] = useState<InventoryItem[]>([
    { id: 1, name: "Rice", stock: 50, unit: "kg", price: 45, minStock: 10 },
    { id: 2, name: "Wheat Flour", stock: 30, unit: "kg", price: 40, minStock: 10 },
    { id: 3, name: "Sugar", stock: 5, unit: "kg", price: 42, minStock: 10 },
    { id: 4, name: "Tea Powder", stock: 3, unit: "kg", price: 380, minStock: 8 },
    { id: 5, name: "Cooking Oil", stock: 2, unit: "L", price: 180, minStock: 5 },
    { id: 6, name: "Milk", stock: 20, unit: "L", price: 50, minStock: 8 },
    { id: 7, name: "Bread", stock: 25, unit: "pcs", price: 40, minStock: 10 },
    { id: 8, name: "Eggs", stock: 60, unit: "dozen", price: 72, minStock: 20 },
  ]);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStockStatus = (current: number, min: number) => {
    if (current <= min) return { label: "Low", variant: "destructive" as const };
    if (current <= min * 1.5) return { label: "Medium", variant: "warning" as const };
    return { label: "Good", variant: "success" as const };
  };

  const handleDelete = (id: number) => {
    setItems(items.filter(item => item.id !== id));
    toast.success("Item deleted successfully");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Inventory Management</h1>
                <p className="text-sm text-muted-foreground">
                  {filteredItems.length} items in stock
                </p>
              </div>
            </div>
            <Button onClick={() => toast.info("Add item feature coming soon!")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Inventory Table */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Current Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No items found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => {
                      const status = getStockStatus(item.stock, item.minStock);
                      return (
                        <TableRow key={item.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>
                            {item.stock} {item.unit}
                          </TableCell>
                          <TableCell>₹{item.price}</TableCell>
                          <TableCell className="font-semibold">
                            ₹{(item.stock * item.price).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toast.info("Edit feature coming soon!")}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Inventory;
