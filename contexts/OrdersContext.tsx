import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';

export type Order = {
  id: string;
  date: string;
  name: string;
  quantityH: number;
  quantityM: number;
  pickedUp: boolean;
};

const STORAGE_KEY = 'orders';

export const [OrdersContext, useOrders] = createContextHook(() => {
  const [orders, setOrders] = useState<Order[]>([]);

  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (newOrders: Order[]) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newOrders));
      return newOrders;
    },
  });

  const { mutate: syncOrders } = syncMutation;

  useEffect(() => {
    if (ordersQuery.data) {
      setOrders(ordersQuery.data);
    }
  }, [ordersQuery.data]);

  const addOrder = useCallback((order: Omit<Order, 'id'>) => {
    const newOrder: Order = {
      ...order,
      id: Date.now().toString(),
    };
    const updated = [...orders, newOrder];
    setOrders(updated);
    syncOrders(updated);
  }, [orders, syncOrders]);

  const updateOrder = useCallback((id: string, updates: Partial<Order>) => {
    const updated = orders.map(order =>
      order.id === id ? { ...order, ...updates } : order
    );
    setOrders(updated);
    syncOrders(updated);
  }, [orders, syncOrders]);

  const deleteOrder = useCallback((id: string) => {
    const updated = orders.filter(order => order.id !== id);
    setOrders(updated);
    syncOrders(updated);
  }, [orders, syncOrders]);

  const getOrdersByDate = useCallback((date: string) => {
    return orders.filter(order => order.date === date);
  }, [orders]);

  return useMemo(() => ({
    orders,
    addOrder,
    updateOrder,
    deleteOrder,
    getOrdersByDate,
    isLoading: ordersQuery.isLoading,
  }), [orders, addOrder, updateOrder, deleteOrder, getOrdersByDate, ordersQuery.isLoading]);
});
