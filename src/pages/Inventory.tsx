import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { AuthCheck } from "@/components/AuthCheck";
import Header from "@/components/Header";
import { AIRestockAssistant } from "@/components/AIRestockAssistant";
import { Search, Plus, Pencil, Trash2, Package, Sparkles, ShoppingCart, Upload, Save, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  stock: number;
  unit: string;
  price: number;
  minimum_stock: number;
  image_url: string | null;
  category: string | null;
}

const Inventory = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [processingFile, setProcessingFile] = useState(false);
  const [extractedProducts, setExtractedProducts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<InventoryItem | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    stock: 0,
    unit: "",
    price: 0,
    minimum_stock: 0,
    category: "",
    image_url: "",
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStockStatus = (current: number, min: number) => {
    if (current <= min) return { label: "Low Stock", variant: "destructive" as const, showAlert: true };
    if (current <= min * 1.5) return { label: "Medium", variant: "warning" as const, showAlert: false };
    return { label: "Good", variant: "success" as const, showAlert: false };
  };

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = async () => {
    if (!editForm) return;

    try {
      const { error } = await supabase
        .from('inventory')
        .update({
          name: editForm.name,
          stock: editForm.stock,
          price: editForm.price,
          unit: editForm.unit,
          description: editForm.description,
          category: editForm.category,
          minimum_stock: editForm.minimum_stock
        })
        .eq('id', editForm.id);

      if (error) throw error;

      setItems(items.map(item => item.id === editForm.id ? editForm : item));
      setEditingId(null);
      setEditForm(null);
      toast.success("Item updated successfully");
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setItems(items.filter(item => item.id !== id));
      toast.success("Item deleted successfully");
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleGenerateImage = async () => {
    if (!formData.name) {
      toast.error('Please enter product name first');
      return;
    }

    setGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-product-image', {
        body: { 
          productName: formData.name,
          category: formData.category 
        }
      });

      if (error) throw error;
      
      if (data.imageUrl) {
        setFormData({ ...formData, image_url: data.imageUrl });
        toast.success('Image generated successfully');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image');
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('inventory')
        .insert([
          {
            user_id: user.id,
            ...formData
          }
        ])
        .select()
        .single();

      if (error) throw error;
      
      setItems([data, ...items]);
      setFormData({
        name: "",
        description: "",
        stock: 0,
        unit: "",
        price: 0,
        minimum_stock: 0,
        category: "",
        image_url: "",
      });
      setIsAddDialogOpen(false);
      toast.success('Item added successfully');
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessingFile(true);
    try {
      const text = await file.text();
      
      const { data, error } = await supabase.functions.invoke('process-stock-file', {
        body: { 
          fileContent: text,
          fileName: file.name 
        }
      });

      if (error) throw error;
      
      if (data.products) {
        setExtractedProducts(data.products);
        toast.success(`Extracted ${data.products.length} products from file`);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process file');
    } finally {
      setProcessingFile(false);
    }
  };

  const handleSaveExtractedProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Generate images for products in parallel
      const productsWithImages = await Promise.all(
        extractedProducts.map(async (product) => {
          try {
            const { data: imageData } = await supabase.functions.invoke('generate-product-image', {
              body: { 
                productName: product.name,
                category: product.category 
              }
            });
            
            return {
              ...product,
              image_url: imageData?.imageUrl || null,
              user_id: user.id
            };
          } catch (error) {
            console.error(`Failed to generate image for ${product.name}:`, error);
            return {
              ...product,
              image_url: null,
              user_id: user.id
            };
          }
        })
      );

      const { data, error } = await supabase
        .from('inventory')
        .insert(productsWithImages)
        .select();

      if (error) throw error;
      
      setItems([...data, ...items]);
      setExtractedProducts([]);
      setIsUploadDialogOpen(false);
      toast.success('Products added successfully with AI-generated images');
    } catch (error) {
      console.error('Error saving products:', error);
      toast.error('Failed to save products');
    }
  };

  const handleAddToBill = async (item: InventoryItem) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('cart')
        .insert([
          {
            user_id: user.id,
            inventory_id: item.id,
            quantity: 1
          }
        ]);

      if (error) throw error;
      
      toast.success('Item added to cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  return (
    <AuthCheck>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold">Inventory Management</h1>
                <p className="text-muted-foreground mt-2">
                  {filteredItems.length} items in stock
                </p>
              </div>
              <div className="flex gap-2">
                <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Stock File
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Upload Stock File</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="file">Select File (CSV, TXT, or any text format)</Label>
                        <Input
                          id="file"
                          type="file"
                          accept=".csv,.txt,.text"
                          onChange={handleFileUpload}
                          disabled={processingFile}
                        />
                        {processingFile && <p className="text-sm text-muted-foreground">Processing file with AI...</p>}
                      </div>
                      
                      {extractedProducts.length > 0 && (
                        <>
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Description</TableHead>
                                  <TableHead>Stock</TableHead>
                                  <TableHead>Price</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {extractedProducts.map((product, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell className="max-w-xs truncate">{product.description}</TableCell>
                                    <TableCell>{product.stock} {product.unit}</TableCell>
                                    <TableCell>₹{product.price}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          <Button onClick={handleSaveExtractedProducts} className="w-full">
                            Save All Products (AI will generate images)
                          </Button>
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Item</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddItem} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Product Name*</Label>
                          <Input
                            id="name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="category">Category</Label>
                          <Input
                            id="category"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="stock">Stock*</Label>
                          <Input
                            id="stock"
                            type="number"
                            required
                            value={formData.stock}
                            onChange={(e) => setFormData({ ...formData, stock: parseFloat(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="unit">Unit*</Label>
                          <Input
                            id="unit"
                            required
                            placeholder="kg, L, pcs, etc."
                            value={formData.unit}
                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="price">Price (₹)*</Label>
                          <Input
                            id="price"
                            type="number"
                            required
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="minimum_stock">Minimum Stock*</Label>
                          <Input
                            id="minimum_stock"
                            type="number"
                            required
                            value={formData.minimum_stock}
                            onChange={(e) => setFormData({ ...formData, minimum_stock: parseFloat(e.target.value) })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Product Image</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={handleGenerateImage}
                            disabled={generatingImage}
                            variant="outline"
                            className="w-full"
                          >
                            <Sparkles className="mr-2 h-4 w-4" />
                            {generatingImage ? 'Generating...' : 'Generate Image with AI'}
                          </Button>
                        </div>
                        {formData.image_url && (
                          <div className="mt-2">
                            <img 
                              src={formData.image_url} 
                              alt="Product preview" 
                              className="w-full h-40 object-cover rounded-md"
                            />
                          </div>
                        )}
                      </div>

                      <Button type="submit" className="w-full">Add Item</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

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

          {/* AI Restock Assistant */}
          <AIRestockAssistant />

          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Current Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Image</TableHead>
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
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No items found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredItems.map((item) => {
                          const status = getStockStatus(item.stock, item.minimum_stock);
                          const isEditing = editingId === item.id;
                          
                          return (
                            <TableRow key={item.id} className="hover:bg-muted/50">
                              <TableCell>
                                {item.image_url ? (
                                  <img 
                                    src={item.image_url} 
                                    alt={item.name}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                    <Package className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="font-medium">
                                {isEditing ? (
                                  <Input
                                    value={editForm?.name || ''}
                                    onChange={(e) => setEditForm(editForm ? {...editForm, name: e.target.value} : null)}
                                    className="w-full"
                                  />
                                ) : (
                                  <div className="flex items-center gap-2">
                                    {item.name}
                                    {status.showAlert && (
                                      <Badge variant="destructive" className="animate-pulse-slow flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        Low
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {isEditing ? (
                                  <div className="flex gap-1">
                                    <Input
                                      type="number"
                                      value={editForm?.stock || 0}
                                      onChange={(e) => setEditForm(editForm ? {...editForm, stock: parseFloat(e.target.value)} : null)}
                                      className="w-20"
                                    />
                                    <Input
                                      value={editForm?.unit || ''}
                                      onChange={(e) => setEditForm(editForm ? {...editForm, unit: e.target.value} : null)}
                                      className="w-16"
                                    />
                                  </div>
                                ) : (
                                  `${item.stock} ${item.unit}`
                                )}
                              </TableCell>
                              <TableCell>
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    value={editForm?.price || 0}
                                    onChange={(e) => setEditForm(editForm ? {...editForm, price: parseFloat(e.target.value)} : null)}
                                    className="w-24"
                                  />
                                ) : (
                                  `₹${item.price}`
                                )}
                              </TableCell>
                              <TableCell className="font-semibold">
                                ₹{(item.stock * item.price).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Badge variant={status.variant}>{status.label}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {isEditing ? (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={saveEdit}
                                      >
                                        <Save className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={cancelEdit}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => startEdit(item)}
                                        title="Edit"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleAddToBill(item)}
                                        title="Add to Bill"
                                      >
                                        <ShoppingCart className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDelete(item.id)}
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
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

export default Inventory;