import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';

export type Prize = {
  id: string;
  machineId: number;
  amount: number;
  date: string;
  timestamp: number;
};

const STORAGE_KEY = 'prizes';

export const [MachinesContext, useMachines] = createContextHook(() => {
  const [prizes, setPrizes] = useState<Prize[]>([]);

  const prizesQuery = useQuery({
    queryKey: ['prizes'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (newPrizes: Prize[]) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPrizes));
      return newPrizes;
    },
  });

  const { mutate: syncPrizes } = syncMutation;

  useEffect(() => {
    if (prizesQuery.data) {
      setPrizes(prizesQuery.data);
    }
  }, [prizesQuery.data]);

  const addPrize = useCallback((machineId: number, amount: number) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const newPrize: Prize = {
      id: Date.now().toString(),
      machineId,
      amount,
      date: dateStr,
      timestamp: now.getTime(),
    };
    const updated = [...prizes, newPrize];
    setPrizes(updated);
    syncPrizes(updated);
  }, [prizes, syncPrizes]);

  const updatePrize = useCallback((id: string, amount: number) => {
    const updated = prizes.map(prize =>
      prize.id === id ? { ...prize, amount } : prize
    );
    setPrizes(updated);
    syncPrizes(updated);
  }, [prizes, syncPrizes]);

  const deletePrize = useCallback((id: string) => {
    const updated = prizes.filter(prize => prize.id !== id);
    setPrizes(updated);
    syncPrizes(updated);
  }, [prizes, syncPrizes]);

  const getPrizesByDate = useCallback((date: string) => {
    return prizes.filter(prize => prize.date === date);
  }, [prizes]);

  const getPrizesByDateRange = useCallback((startDate: string, endDate: string) => {
    return prizes.filter(prize => prize.date >= startDate && prize.date <= endDate);
  }, [prizes]);

  const getTotalByDate = useCallback((date: string) => {
    return prizes
      .filter(prize => prize.date === date)
      .reduce((sum, prize) => sum + prize.amount, 0);
  }, [prizes]);

  const getTotalByMachineAndDate = useCallback((machineId: number, date: string) => {
    return prizes
      .filter(prize => prize.machineId === machineId && prize.date === date)
      .reduce((sum, prize) => sum + prize.amount, 0);
  }, [prizes]);

  const getMonthlyReport = useCallback((year: number, month: number) => {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    return prizes.filter(prize => prize.date.startsWith(monthStr));
  }, [prizes]);

  return useMemo(() => ({
    prizes,
    addPrize,
    updatePrize,
    deletePrize,
    getPrizesByDate,
    getPrizesByDateRange,
    getTotalByDate,
    getTotalByMachineAndDate,
    getMonthlyReport,
    isLoading: prizesQuery.isLoading,
  }), [prizes, addPrize, updatePrize, deletePrize, getPrizesByDate, getPrizesByDateRange, getTotalByDate, getTotalByMachineAndDate, getMonthlyReport, prizesQuery.isLoading]);
});
