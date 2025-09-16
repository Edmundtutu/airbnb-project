import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getVendorOrders, confirmOrder, rejectOrder } from '@/services/orderService';
import { Order } from '@/types/orders';
import { Skeleton } from '@/components/ui/skeleton';
import OrderCard from '@/components/shared/OrderCard';
import {toast} from "sonner";

const VendorOrders: React.FC = () => {
  const { data: orders, isLoading, isError } = useQuery<Order[]>({
    queryKey: ['vendorOrders'],
    queryFn: getVendorOrders,
  });
    const handleConfirmOrder = (order: Order) => () => {
        confirmOrder(order.id).then(() => toast.success('Order confirmed successfully'));
    }
    const handleReject = (order: Order) => () => {
        rejectOrder(order.id).then(() => toast.success('Order cancelled'));
    }
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Incoming Orders</h1>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Could not fetch vendor orders. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">Incoming Orders</h1>
      
      {!orders || orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No orders found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 auto-rows-fr">
          {orders.map((order) => (
            <OrderCard 
              key={order.id} 
              order={order} 
              context="vendor" 
              onConfirm={async () => { await confirmOrder(order.id); toast.success('Order confirmed successfully'); }}
              onReject={async () => { await rejectOrder(order.id); toast.success('Order cancelled'); }}
              onOpenConversation={() => {}}
              onStartPost={() => {}}
              isPostDisabled={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorOrders;