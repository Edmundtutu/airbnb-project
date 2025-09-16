import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditProductDialog } from './EditProductDialog';

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

interface ProductTableProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

export function ProductTable({ products, onUpdateProduct, onDeleteProduct }: ProductTableProps) {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const getStatusBadge = (status: Product['status']) => {
    const variants = {
      'in-stock': 'bg-success-light text-success border-success/20',
      'low-stock': 'bg-warning-light text-warning border-warning/20',
      'out-of-stock': 'bg-destructive/5 text-destructive border-destructive/20'
    };

    const labels = {
      'in-stock': 'In Stock',
      'low-stock': 'Low Stock',
      'out-of-stock': 'Out of Stock'
    };

    return (
      <Badge className={variants[status]} variant="outline">
        {labels[status]}
      </Badge>
    );
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
  };

  const handleDelete = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      onDeleteProduct(productId);
    }
  };

  return (
    <>
      <Card className="shadow-card">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Products</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground font-medium">Product</TableHead>
                  <TableHead className="text-muted-foreground font-medium">SKU</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Category</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Quantity</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Price</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Last Updated</TableHead>
                  <TableHead className="text-muted-foreground font-medium w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id} className="border-border hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="font-medium text-foreground">{product.name}</div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded text-muted-foreground">
                        {product.sku}
                      </code>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{product.category}</TableCell>
                    <TableCell>
                      <span className={`font-medium ${
                        product.quantity === 0 
                          ? 'text-destructive' 
                          : product.quantity < 20 
                            ? 'text-warning' 
                            : 'text-foreground'
                      }`}>
                        {product.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      ${product.price.toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(product.status)}</TableCell>
                    <TableCell className="text-muted-foreground">{product.lastUpdated}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleEdit(product)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Product
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(product.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Product
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>

      {editingProduct && (
        <EditProductDialog
          product={editingProduct}
          open={!!editingProduct}
          onOpenChange={(open) => !open && setEditingProduct(null)}
          onUpdateProduct={onUpdateProduct}
        />
      )}
    </>
  );
}