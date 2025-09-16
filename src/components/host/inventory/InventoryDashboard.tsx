import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Plus, Search, Filter, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { ProductTable } from './ProductTable';
import { AddProductDialog } from './AddProductDialog';
import { StatsCard } from './StatsCard';

interface Product {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  category: string;
  lastUpdated: string;
}

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    sku: 'WBH-001',
    quantity: 150,
    price: 79.99,
    status: 'in-stock',
    category: 'Electronics',
    lastUpdated: '2024-01-15'
  },
  {
    id: '2',
    name: 'Organic Cotton T-Shirt',
    sku: 'OCT-002',
    quantity: 8,
    price: 24.99,
    status: 'low-stock',
    category: 'Clothing',
    lastUpdated: '2024-01-14'
  },
  {
    id: '3',
    name: 'Stainless Steel Water Bottle',
    sku: 'SSW-003',
    quantity: 0,
    price: 19.99,
    status: 'out-of-stock',
    category: 'Accessories',
    lastUpdated: '2024-01-13'
  },
  {
    id: '4',
    name: 'Laptop Stand Adjustable',
    sku: 'LSA-004',
    quantity: 45,
    price: 34.99,
    status: 'in-stock',
    category: 'Electronics',
    lastUpdated: '2024-01-15'
  }
];

export function InventoryDashboard() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalProducts: products.length,
    lowStock: products.filter(p => p.status === 'low-stock').length,
    outOfStock: products.filter(p => p.status === 'out-of-stock').length,
    totalValue: products.reduce((sum, p) => sum + (p.price * p.quantity), 0)
  };

  const handleAddProduct = (newProduct: Omit<Product, 'id' | 'lastUpdated'>) => {
    const product: Product = {
      ...newProduct,
      id: Date.now().toString(),
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    setProducts([...products, product]);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(products.map(p => 
      p.id === updatedProduct.id 
        ? { ...updatedProduct, lastUpdated: new Date().toISOString().split('T')[0] }
        : p
    ));
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId));
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your product inventory and track stock levels
          </p>
        </div>
        <Button 
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-primary hover:bg-primary/90 shadow-card"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Products"
          value={stats.totalProducts.toString()}
          icon={Package}
          variant="info"
        />
        <StatsCard
          title="Low Stock Items"
          value={stats.lowStock.toString()}
          icon={AlertTriangle}
          variant="warning"
        />
        <StatsCard
          title="Out of Stock"
          value={stats.outOfStock.toString()}
          icon={AlertTriangle}
          variant="destructive"
        />
        <StatsCard
          title="Total Value"
          value={`$${stats.totalValue.toLocaleString()}`}
          icon={TrendingUp}
          variant="success"
        />
      </div>

      {/* Search and Filters */}
      <Card className="p-4 shadow-card">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background border-border"
            />
          </div>
          <Button variant="outline" className="border-border">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </Card>

      {/* Products Table */}
      <ProductTable
        products={filteredProducts}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
      />

      {/* Add Product Dialog */}
      <AddProductDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddProduct={handleAddProduct}
      />
    </div>
  );
}