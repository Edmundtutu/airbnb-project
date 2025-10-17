import React, { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOrders } from '@/services/orderService';
import { Order } from '@/types/orders';
import { Skeleton } from '@/components/ui/skeleton';
import OrderCard from '@/components/shared/OrderCard';

const OrderHistory: React.FC = () => {
  const { data: orders, isLoading, isError } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: getOrders,
  });

  // All hooks must be called unconditionally on every render
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const expandPostRef = useRef<() => void>(() => {});

  const handleStartPost = (order: Order) => {
    setActiveOrderId(order.id);
    expandPostRef.current?.();
  };

  const activeOrder = useMemo(() => orders?.find(o => o.id === activeOrderId) ?? null, [orders, activeOrderId]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Could not fetch your orders. Please try again later.</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">You have no past orders.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Inline composers are rendered within each OrderCard now */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 auto-rows-fr">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            context="customer"
            onStartPost={handleStartPost}
            isPostDisabled={false}
            // Since the props are not important on this component then return null
            onConfirm={async () => {}}
            onOpenConversation={async () => {}}
            onReject={async () => {}}
          />
        ))}
      </div>

    </div>
  );
};

export default OrderHistory;