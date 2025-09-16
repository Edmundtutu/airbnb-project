import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag,
  MapPin,
  Truck,
  Store,
  X,
  Tag,
  Percent,
  Package,
  PackagePlus
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { createOrder } from '@/services/orderService';
import type { CreateOrderPayload, Order } from '@/types/orders';


{/* Helper Functions - These would be added to your component */}
const calculateItemUnitWithAddOns = (item: any) => {
  const base = item.basePrice ?? item.price ?? 0;
  const addOns = (item.addOns ?? []).reduce((sum: number, addOn: any) => sum + (addOn.discountedPrice ?? addOn.originalPrice) * (addOn.quantity ?? 1), 0);
  return base + addOns;
};

const calculatePackageSavings = (item: any) => {
  if (!item.addOns) return 0;
  return item.addOns.reduce((savings: number, addOn: any) => {
    return savings + ((addOn.originalPrice - (addOn.discountedPrice ?? addOn.originalPrice)) * (addOn.quantity ?? 1));
  }, 0);
};

const removeAddOn = (remove: (itemId: string, addOnId: string) => void, itemId: string, addOnId: string) => {
  remove(itemId, addOnId);
};
const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    getTotal,
    getItemCount,
    getItemsByShop,
    canCheckout,
    getTotalWithAddOns,
    getItemTotalWithAddOns,
    removeAddOn: removeAddOnFromCart,
  } = useCart();

  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const { mutateAsync: placeOrder, isPending: isProcessingOrder } = useMutation<Order, any, CreateOrderPayload>({
    mutationFn: createOrder,
    onSuccess: (data, variables) => {
      // eslint-disable-next-line no-console
      console.log(`Order placed successfully for shop ${variables.shop_id}!`, data);
    },
    onError: (error: any, variables) => {
      toast({
        title: `Order failed for shop ${variables.shop_id}`,
        description: error?.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });

  const itemsByShop = getItemsByShop();
  const total = useMemo(() => getTotalWithAddOns(), [items]);
  const itemCount = getItemCount();
  const deliveryFee = deliveryType === 'delivery' ? 5000 : 0; // 5000 UGX
  const finalTotal = total + deliveryFee;

  const handleCheckout = async () => {
    if (!canCheckout) return;

    // Debug: Log the cart state and items being processed
    console.log('=== CART CHECKOUT DEBUG ===');
    console.log('Cart items:', items);
    console.log('Items by shop:', itemsByShop);
    console.log('Total with add-ons:', getTotalWithAddOns());
    console.log('Legacy total:', getTotal());

    if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
      toast({
        title: 'Delivery address required',
        description: 'Please enter your delivery address',
        variant: 'destructive',
      });
      return;
    }

    const deliveryCoords = { lat: 0, lng: 0 };

    const payloads = Object.entries(itemsByShop).map(([groupKey, shopItems]) => {
      const shopIdStr = String(shopItems?.[0]?.shop?.id ?? groupKey);
      const isValidUlid = (val: string) => /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(val);

      // Debug: Log each shop's items being processed
      console.log(`Processing shop ${shopIdStr}:`, shopItems);

      if (!shopIdStr || !isValidUlid(shopIdStr)) {
        toast({
          title: 'Checkout failed',
          description: 'Invalid shop identifier. Please try again.',
          variant: 'destructive',
        });
        throw new Error('Invalid ULID for shop_id');
      }

      const payload = {
        shop_id: shopIdStr,
        items: shopItems.map((item) => ({
          product_id: String(item.product.id),
          quantity: item.quantity,
          base_price: item.basePrice ?? 0,
          add_ons: (item.addOns ?? []).map((a) => ({
            product_id: String(a.product.id),
            quantity: a.quantity ?? 1,
            original_price: a.originalPrice ?? a.product.price,
            discounted_price: a.discountedPrice ?? a.originalPrice ?? a.product.price,
          })),
          item_total: (item.basePrice ?? 0) * item.quantity + ((item.addOns ?? []).reduce((sum, a) => sum + (a.discountedPrice ?? a.originalPrice) * (a.quantity ?? 1), 0) * item.quantity),
          package_savings: (item.addOns ?? []).reduce((s, a) => s + ((a.originalPrice ?? a.product.price) - (a.discountedPrice ?? a.originalPrice ?? a.product.price)) * (a.quantity ?? 1), 0),
        })),
        delivery_address: deliveryType === 'delivery' ? deliveryAddress : 'N/A for pickup',
        delivery_lat: deliveryCoords.lat,
        delivery_lng: deliveryCoords.lng,
        notes: notes || undefined,
      };

      // Debug: Log the constructed payload for this shop
      console.log(`Shop ${shopIdStr} payload:`, payload);
      return payload;
    });

    // Debug: Log all payloads being sent
    console.log('=== FINAL PAYLOADS TO SEND ===');
    console.log('All payloads:', payloads);

    const orderCreationPromises = payloads.map((p) => placeOrder(p));

    try {
      await Promise.all(orderCreationPromises);
      clearCart();
      toast({
        title: 'OrderHandlers placed successfully!',
        description: 'You can view your orders in your profile.',
      });
      navigate('/profile');
    } catch (error) {
      // Errors handled in onError; keep catch to avoid unhandled rejections
      // eslint-disable-next-line no-console
      console.error('An error occurred during checkout:', error);
      // Debug: Log the full error details
      console.error('Full error object:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        console.error('Response data:', (error as any).response?.data);
        console.error('Response status:', (error as any).response?.status);
      }
    }
  };

  if (!canCheckout) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-medium mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Start shopping to add items to your cart
            </p>
            <Button asChild>
              <Link to="/discover">Start Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none px-2 sm:max-w-6xl sm:mx-auto space-y-4 sm:space-y-6">
      <div className="text-center">
        <p className="text-muted-foreground text-sm sm:text-base">
          {itemCount} item{itemCount !== 1 ? 's' : ''} from {Object.keys(itemsByShop).length} shop{Object.keys(itemsByShop).length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Cart Items by Shop */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {Object.entries(itemsByShop).map(([shopId, shopItems]) => (
            <Card key={shopId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
                      {shopItems[0].shop.avatar ? (
                        <img 
                          src={shopItems[0].shop.avatar} 
                          alt={shopItems[0].shop.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                          {shopItems[0].shop.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{shopItems[0].shop.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Store className="h-3 w-3" />
                        <span>{shopItems.length} item{shopItems.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">
                    UGX {shopItems.reduce((sum, item) => sum + ((item.basePrice ?? 0) * item.quantity), 0).toLocaleString()}
                  </Badge>
                </div>
              </CardHeader>
              {/* Enhanced CardContent with Package Plus Add-ons Feature */}
              <CardContent className="space-y-3">
                {shopItems.map((item) => (
                  <div key={item.id} className="relative group">
                    {/* Package Plus Float Button */}
                    <div className="absolute -top-2 -right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
                            title="Add Package Plus items"
                          >
                            <Package className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        
                        <DialogContent className="max-w-2xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Package className="h-5 w-5" />
                              Package Plus for {item.product.name}
                            </DialogTitle>
                          </DialogHeader>
                          
                          <ScrollArea className="max-h-[60vh]">
                            <div className="space-y-4">
                              {/* Current Add-ons Display */}
                              {item.addOns && item.addOns.length > 0 && (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <Tag className="h-4 w-4" />
                                    <h4 className="font-medium">Current Add-ons</h4>
                                  </div>
                                  <div className="grid gap-2">
                                    {item.addOns.map((addOn, index) => (
                                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                        <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 bg-background rounded flex items-center justify-center">
                                            {addOn.product.images?.[0] ? (
                                              <img 
                                                src={addOn.product.images[0]} 
                                                alt={addOn.product.name}
                                                className="w-full h-full object-cover rounded"
                                              />
                                            ) : (
                                              <span className="text-xs">📦</span>
                                            )}
                                          </div>
                                          <div>
                                            <p className="font-medium text-sm">{addOn.product.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                              UGX {addOn.discountedPrice?.toLocaleString()} 
                                              <span className="line-through ml-1">
                                                UGX {addOn.originalPrice.toLocaleString()}
                                              </span>
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => removeAddOn(removeAddOnFromCart, item.id, addOn.id)}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Add New Add-on Button */}
                              <div className="border-t pt-4">
                                <Link 
                                  to={`/shops/${item.shop.id}?addOnFor=${item.product.id}&cartItemId=${item.id}`}
                                  className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-colors"
                                >
                                  <PackagePlus className="h-5 w-5" />
                                  <span className="font-medium">Browse Shop for Add-ons</span>
                                </Link>
                              </div>
                              
                              {/* Package Savings Display */}
                              {item.addOns && item.addOns.length > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-green-800">Package Savings</span>
                                    <span className="font-bold text-green-600">
                                      UGX {calculatePackageSavings(item).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-green-600 mt-1">
                                    You're saving with this package deal!
                                  </p>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    {/* Main Item Card */}
                    <div className="flex gap-3 sm:gap-4 p-3 rounded-lg border">
                      {/* Product Image with Add-on Indicator */}
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.product.images?.[0] ? (
                          <img 
                            src={item.product.images[0]} 
                            alt={item.product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="text-xl sm:text-2xl">📦</div>
                        )}
                        
                        {/* Add-on Count Badge */}
                        {item.addOns && item.addOns.length > 0 && (
                          <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            +{item.addOns.length}
                          </div>
                        )}
                      </div>
                      
                      {/* Product Details and Controls */}
                      <div className="flex-1 space-y-2">
                        {/* Product Name and Description with Remove Button */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <Link 
                              to={`/product/${item.product.id}`}
                              className="font-medium hover:text-primary text-sm sm:text-base line-clamp-2"
                            >
                              {item.product.name}
                            </Link>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-1">
                              {item.product.description}
                            </p>
                            
                            {/* Add-ons Summary */}
                            {item.addOns && item.addOns.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {item.addOns.slice(0, 2).map((addOn, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    + {addOn.product.name}
                                  </Badge>
                                ))}
                                {item.addOns.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{item.addOns.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 ml-2"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                        
                        {/* Quantity Controls and Price */}
                        <div className="flex items-center justify-between">
                          {/* Quantity Controls */}
                          <div className="flex items-center border rounded-lg">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="h-8 w-8 sm:h-10 sm:w-10"
                            >
                              <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <span className="px-3 py-2 min-w-[2.5rem] text-center text-sm sm:text-base">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-8 w-8 sm:h-10 sm:w-10"
                            >
                              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                          
                          {/* Price Information with Package Deal */}
                          <div className="text-right">
                            <div className="font-medium text-sm sm:text-base">
                              UGX {getItemTotalWithAddOns(item.id).toLocaleString()}
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground">
                              UGX {calculateItemUnitWithAddOns(item).toLocaleString()} each
                              {item.addOns && item.addOns.length > 0 && (
                                <span className="text-green-600 block">
                                  (Package Deal)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
          
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={clearCart}>
              Clear Cart
            </Button>
            <Button variant="outline" asChild>
              <Link to="/discover">Continue Shopping</Link>
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-3 sm:space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal ({itemCount} items)</span>
                <span>UGX {total.toLocaleString()}</span>
              </div>
              
              {deliveryType === 'delivery' && (
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>UGX {deliveryFee.toLocaleString()}</span>
                </div>
              )}
              
              <div className="border-t pt-4">
                <div className="flex justify-between font-medium text-lg">
                  <span>Total</span>
                  <span>UGX {finalTotal.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={deliveryType} onValueChange={(value: 'pickup' | 'delivery') => setDeliveryType(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Pickup (Free)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery" className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Delivery (UGX {deliveryFee.toLocaleString()})
                  </Label>
                </div>
              </RadioGroup>

              {deliveryType === 'delivery' && (
                <div className="space-y-2">
                  <Label htmlFor="address">Delivery Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your delivery address..."
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Order Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Special instructions for your order..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleCheckout}
                disabled={isProcessingOrder || (deliveryType === 'delivery' && !deliveryAddress.trim())}
              >
                {isProcessingOrder ? 'Processing...' : `Checkout - UGX ${finalTotal.toLocaleString()}`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Cart;