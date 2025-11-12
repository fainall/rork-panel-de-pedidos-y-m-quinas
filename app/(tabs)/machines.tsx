import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { Gamepad2, TrendingUp, Calendar, X, Edit2 } from 'lucide-react-native';
import { useMachines } from '../../contexts/MachinesContext';

const PRESET_AMOUNTS = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];
const MACHINE_COUNT = 10;

export default function MachinesScreen() {
  const {
    addPrize,
    updatePrize,
    deletePrize,
    getTotalByMachineAndDate,
    getTotalByDate,
    getPrizesByDate,
    getPrizesByDateRange,
  } = useMachines();

  const [selectedMachine, setSelectedMachine] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<'daily' | 'range' | 'monthly'>('daily');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingPrize, setEditingPrize] = useState<{ id: string; amount: number } | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const handleAddPrize = (machineId: number, amount: number) => {
    addPrize(machineId, amount);
  };

  const handleCustomAmount = (machineId: number) => {
    const amount = parseInt(customAmount);
    if (amount > 0) {
      addPrize(machineId, amount);
      setCustomAmount('');
      setSelectedMachine(null);
    }
  };

  const handleUpdatePrize = () => {
    if (editingPrize && editingPrize.amount > 0) {
      updatePrize(editingPrize.id, editingPrize.amount);
      setEditingPrize(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const getDailyTotal = () => getTotalByDate(reportDate);
  
  const getRangePrizes = () => {
    if (startDate && endDate) {
      return getPrizesByDateRange(startDate, endDate);
    }
    return [];
  };

  const getMonthlyPrizes = () => {
    const [year, month] = reportDate.split('-');
    const startOfMonth = `${year}-${month}-01`;
    const endOfMonth = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
    return getPrizesByDateRange(startOfMonth, endOfMonth);
  };

  const calculateTotal = (prizes: any[]) => {
    return prizes.reduce((sum, prize) => sum + prize.amount, 0);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Máquinas' }} />

      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <TrendingUp size={24} color="#4f46e5" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Total de Hoy</Text>
            <Text style={styles.headerAmount}>{formatCurrency(getTotalByDate(today))}</Text>
          </View>
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => setShowReportModal(true)}
          >
            <Calendar size={20} color="#4f46e5" />
            <Text style={styles.reportButtonText}>Reportes</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.machinesGrid}>
          {Array.from({ length: MACHINE_COUNT }, (_, i) => i + 1).map((machineId) => {
            const todayTotal = getTotalByMachineAndDate(machineId, today);
            const prizes = getPrizesByDate(today).filter(p => p.machineId === machineId);

            return (
              <TouchableOpacity
                key={machineId}
                style={[
                  styles.machineCard,
                  selectedMachine === machineId && styles.machineCardSelected,
                ]}
                onPress={() => setSelectedMachine(machineId)}
              >
                <View style={styles.machineHeader}>
                  <Gamepad2 size={24} color="#4f46e5" />
                  <Text style={styles.machineNumber}>M{machineId}</Text>
                </View>
                <Text style={styles.machineTotal}>{formatCurrency(todayTotal)}</Text>
                <Text style={styles.prizesCount}>{prizes.length} premios</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedMachine !== null && (
          <View style={styles.prizeSection}>
            <View style={styles.prizeSectionHeader}>
              <Text style={styles.prizeSectionTitle}>Registrar Premio - Máquina {selectedMachine}</Text>
              <TouchableOpacity onPress={() => setSelectedMachine(null)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.amountsGrid}>
              {PRESET_AMOUNTS.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={styles.amountButton}
                  onPress={() => handleAddPrize(selectedMachine, amount)}
                >
                  <Text style={styles.amountButtonText}>{formatCurrency(amount)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.customAmount}>
              <TextInput
                style={styles.customInput}
                placeholder="Monto personalizado"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
                value={customAmount}
                onChangeText={setCustomAmount}
              />
              <TouchableOpacity
                style={styles.customButton}
                onPress={() => handleCustomAmount(selectedMachine)}
              >
                <Text style={styles.customButtonText}>Agregar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.prizesList}>
              <Text style={styles.prizesListTitle}>Premios de Hoy</Text>
              {getPrizesByDate(today)
                .filter(prize => prize.machineId === selectedMachine)
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((prize) => (
                  <View key={prize.id} style={styles.prizeItem}>
                    {editingPrize?.id === prize.id ? (
                      <View style={styles.prizeEdit}>
                        <Text style={styles.prizeLabel}>$</Text>
                        <TextInput
                          style={styles.prizeEditInput}
                          keyboardType="number-pad"
                          value={String(editingPrize.amount)}
                          onChangeText={(text) => {
                            const num = parseInt(text) || 0;
                            setEditingPrize({ ...editingPrize, amount: num });
                          }}
                        />
                        <TouchableOpacity
                          style={styles.prizeSaveButton}
                          onPress={handleUpdatePrize}
                        >
                          <Text style={styles.prizeSaveButtonText}>Guardar</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.prizeAmount}>{formatCurrency(prize.amount)}</Text>
                        <Text style={styles.prizeTime}>
                          {new Date(prize.timestamp).toLocaleTimeString('es-CL', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </>
                    )}
                    <View style={styles.prizeActions}>
                      <TouchableOpacity
                        onPress={() => setEditingPrize({ id: prize.id, amount: prize.amount })}
                      >
                        <Edit2 size={18} color="#3b82f6" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deletePrize(prize.id)}>
                        <X size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showReportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReportModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowReportModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Reportes</Text>

            <View style={styles.reportTypes}>
              <TouchableOpacity
                style={[styles.reportType, reportType === 'daily' && styles.reportTypeActive]}
                onPress={() => setReportType('daily')}
              >
                <Text style={[styles.reportTypeText, reportType === 'daily' && styles.reportTypeTextActive]}>
                  Diario
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reportType, reportType === 'range' && styles.reportTypeActive]}
                onPress={() => setReportType('range')}
              >
                <Text style={[styles.reportTypeText, reportType === 'range' && styles.reportTypeTextActive]}>
                  Rango
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reportType, reportType === 'monthly' && styles.reportTypeActive]}
                onPress={() => setReportType('monthly')}
              >
                <Text style={[styles.reportTypeText, reportType === 'monthly' && styles.reportTypeTextActive]}>
                  Mensual
                </Text>
              </TouchableOpacity>
            </View>

            {reportType === 'daily' && (
              <>
                <Text style={styles.label}>Fecha</Text>
                <TextInput
                  style={styles.input}
                  value={reportDate}
                  onChangeText={setReportDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9ca3af"
                />
                <View style={styles.reportResult}>
                  <Text style={styles.reportResultLabel}>Total del día:</Text>
                  <Text style={styles.reportResultValue}>{formatCurrency(getDailyTotal())}</Text>
                </View>
              </>
            )}

            {reportType === 'range' && (
              <>
                <Text style={styles.label}>Fecha Inicio</Text>
                <TextInput
                  style={styles.input}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9ca3af"
                />
                <Text style={styles.label}>Fecha Fin</Text>
                <TextInput
                  style={styles.input}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9ca3af"
                />
                {startDate && endDate && (
                  <View style={styles.reportResult}>
                    <Text style={styles.reportResultLabel}>Total del período:</Text>
                    <Text style={styles.reportResultValue}>
                      {formatCurrency(calculateTotal(getRangePrizes()))}
                    </Text>
                  </View>
                )}
              </>
            )}

            {reportType === 'monthly' && (
              <>
                <Text style={styles.label}>Mes (YYYY-MM)</Text>
                <TextInput
                  style={styles.input}
                  value={reportDate.substring(0, 7)}
                  onChangeText={(text) => setReportDate(`${text}-01`)}
                  placeholder="YYYY-MM"
                  placeholderTextColor="#9ca3af"
                />
                <View style={styles.reportResult}>
                  <Text style={styles.reportResultLabel}>Total del mes:</Text>
                  <Text style={styles.reportResultValue}>
                    {formatCurrency(calculateTotal(getMonthlyPrizes()))}
                  </Text>
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowReportModal(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      },
    }),
  },
  headerIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  headerAmount: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1f2937',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#eef2ff',
    borderRadius: 8,
  },
  reportButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#4f46e5',
  },
  machinesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 12,
  },
  machineCard: {
    width: 'calc(50% - 10px)' as any,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        width: 'calc(50% - 10px)',
      },
    }),
  },
  machineCardSelected: {
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  machineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  machineNumber: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1f2937',
  },
  machineTotal: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#10b981',
    marginBottom: 4,
  },
  prizesCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  prizeSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      },
    }),
  },
  prizeSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  prizeSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1f2937',
  },
  amountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  amountButton: {
    width: 'calc(33.33% - 6px)' as any,
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    ...Platform.select({
      web: {
        width: 'calc(33.33% - 6px)',
      },
    }),
  },
  amountButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1f2937',
  },
  customAmount: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  customInput: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  customButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  customButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  prizesList: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  prizesListTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6b7280',
    marginBottom: 12,
  },
  prizeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  prizeAmount: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1f2937',
  },
  prizeTime: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 12,
  },
  prizeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  prizeEdit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prizeLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  prizeEditInput: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  prizeSaveButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  prizeSaveButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1f2937',
    marginBottom: 20,
  },
  reportTypes: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  reportType: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  reportTypeActive: {
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  reportTypeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  reportTypeTextActive: {
    color: '#4f46e5',
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1f2937',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reportResult: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  reportResultLabel: {
    fontSize: 14,
    color: '#166534',
    marginBottom: 4,
  },
  reportResultValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#15803d',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#4f46e5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
