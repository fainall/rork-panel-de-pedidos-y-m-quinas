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
  Animated,
} from 'react-native';
import { Stack } from 'expo-router';
import { Plus, Calendar, Check, X, ChevronDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useOrders } from '@/contexts/OrdersContext';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function OrdersScreen() {
  const { getOrdersByDate, addOrder, updateOrder, deleteOrder } = useOrders();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);

  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [animationHeight] = useState(new Animated.Value(0));
  const [newOrder, setNewOrder] = useState({
    name: '',
    quantityH: 0,
    quantityM: 0,
  });

  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  
  const selectedDateStr = formatDate(selectedDate);
  const orders = getOrdersByDate(selectedDateStr);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const handleAddOrder = () => {
    if (newOrder.name.trim() && (newOrder.quantityH > 0 || newOrder.quantityM > 0)) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      addOrder({
        name: newOrder.name.trim(),
        quantityH: newOrder.quantityH,
        quantityM: newOrder.quantityM,
        date: selectedDateStr,
        pickedUp: false,
      });
      setNewOrder({ name: '', quantityH: 0, quantityM: 0 });
      setShowAddModal(false);
    }
  };

  const handleTogglePickup = (id: string, currentStatus: boolean) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    updateOrder(id, { pickedUp: !currentStatus });
  };



  const handlePrevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  const days = getDaysInMonth(selectedDate);

  const toggleCalendar = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const toValue = calendarExpanded ? 0 : 1;
    setCalendarExpanded(!calendarExpanded);
    
    Animated.spring(animationHeight, {
      toValue,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();
  };

  const calendarHeight = animationHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 400],
  });

  const iconRotation = animationHeight.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Pedidos de Pan' }} />
      
      <ScrollView style={styles.content}>
        <View style={styles.calendarContainer}>
          <TouchableOpacity 
            style={styles.calendarToggleButton}
            onPress={toggleCalendar}
            activeOpacity={0.7}
          >
            <View style={styles.calendarToggleContent}>
              <Calendar size={20} color="#4f46e5" />
              <Text style={styles.calendarToggleText}>
                {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </Text>
              <Animated.View style={{ transform: [{ rotate: iconRotation }] }}>
                <ChevronDown size={20} color="#4f46e5" />
              </Animated.View>
            </View>
          </TouchableOpacity>

          <Animated.View style={[styles.calendarContent, { height: calendarHeight, overflow: 'hidden' }]}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.monthButton}>
                <Text style={styles.monthButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.monthButton}>
                <Text style={styles.monthButtonText}>→</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.weekDays}>
              {DAYS.map((day) => (
                <Text key={day} style={styles.weekDay}>{day}</Text>
              ))}
            </View>

            <View style={styles.calendar}>
              {days.map((day, index) => {
                if (!day) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }

                const dateStr = formatDate(day);
                const dayOrders = getOrdersByDate(dateStr);
                const isSelected = dateStr === selectedDateStr;
                const isToday = dateStr === formatDate(new Date());

                return (
                  <TouchableOpacity
                    key={dateStr}
                    style={[
                      styles.dayCell,
                      isSelected && styles.selectedDay,
                      isToday && styles.today,
                    ]}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setSelectedDate(day);
                    }}
                  >
                    <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>
                      {day.getDate()}
                    </Text>
                    {dayOrders.length > 0 && (
                      <View style={styles.orderIndicator}>
                        <Text style={styles.orderCount}>{dayOrders.length}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </View>

        <View style={styles.ordersSection}>
          <View style={styles.ordersSectionHeader}>
            <Calendar size={20} color="#1f2937" />
            <Text style={styles.ordersSectionTitle}>
              Pedidos del {selectedDate.getDate()} de {MONTHS[selectedDate.getMonth()]}
            </Text>
          </View>

          {orders.length > 0 && (
            <View style={styles.summaryContainer}>
              <View style={styles.summaryItem}>
                <View style={styles.summaryBadge}>
                  <Text style={styles.summaryBadgeText}>H</Text>
                </View>
                <Text style={styles.summaryText}>
                  {orders.reduce((sum, order) => sum + order.quantityH, 0)} Hallullas
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <View style={[styles.summaryBadge, styles.summaryBadgeM]}>
                  <Text style={styles.summaryBadgeText}>M</Text>
                </View>
                <Text style={styles.summaryText}>
                  {orders.reduce((sum, order) => sum + order.quantityM, 0)} Marraquetas
                </Text>
              </View>
            </View>
          )}

          {orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No hay pedidos para este día</Text>
            </View>
          ) : (
            <View style={styles.ordersList}>
              {orders.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <View style={styles.orderInfo}>
                      <Text style={styles.orderName}>{order.name}</Text>
                      <View style={styles.orderDetails}>
                        {order.quantityH > 0 && (
                          <View style={styles.quantityBadge}>
                            <View style={styles.typeBadgeH}>
                              <Text style={styles.typeText}>H</Text>
                            </View>
                            <Text style={styles.quantityText}>{order.quantityH}</Text>
                          </View>
                        )}
                        {order.quantityM > 0 && (
                          <View style={styles.quantityBadge}>
                            <View style={styles.typeBadgeM}>
                              <Text style={styles.typeText}>M</Text>
                            </View>
                            <Text style={styles.quantityText}>{order.quantityM}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.orderActions}>
                      <TouchableOpacity
                        style={[styles.pickupButton, order.pickedUp && styles.pickedUpButton]}
                        onPress={() => handleTogglePickup(order.id, order.pickedUp)}
                      >
                        {order.pickedUp ? (
                          <Check size={20} color="#fff" />
                        ) : (
                          <Text style={styles.pickupButtonText}>Retirar</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => {
                          if (Platform.OS !== 'web') {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                          }
                          deleteOrder(order.id);
                        }}
                      >
                        <X size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          setShowAddModal(true);
        }}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Nuevo Pedido</Text>
            
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={newOrder.name}
              onChangeText={(text) => setNewOrder({ ...newOrder, name: text })}
              placeholder="Nombre del cliente"
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.label}>Cantidad de Hallullas (H)</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setNewOrder({ ...newOrder, quantityH: Math.max(0, newOrder.quantityH - 1) })}
              >
                <Text style={styles.quantityButtonText}>−</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.quantityInputLarge}
                value={String(newOrder.quantityH)}
                keyboardType="number-pad"
                onChangeText={(text) => {
                  const num = parseInt(text) || 0;
                  setNewOrder({ ...newOrder, quantityH: num });
                }}
              />
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setNewOrder({ ...newOrder, quantityH: newOrder.quantityH + 1 })}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Cantidad de Marraquetas (M)</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setNewOrder({ ...newOrder, quantityM: Math.max(0, newOrder.quantityM - 1) })}
              >
                <Text style={styles.quantityButtonText}>−</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.quantityInputLarge}
                value={String(newOrder.quantityM)}
                keyboardType="number-pad"
                onChangeText={(text) => {
                  const num = parseInt(text) || 0;
                  setNewOrder({ ...newOrder, quantityM: num });
                }}
              />
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setNewOrder({ ...newOrder, quantityM: newOrder.quantityM + 1 })}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={handleAddOrder}
              >
                <Text style={styles.addButtonText}>Agregar</Text>
              </TouchableOpacity>
            </View>
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
  calendarContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
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
  calendarToggleButton: {
    padding: 16,
  },
  calendarToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarToggleText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1f2937',
    marginLeft: 8,
  },
  calendarContent: {
    padding: 16,
    paddingTop: 0,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1f2937',
  },
  monthButton: {
    padding: 8,
  },
  monthButtonText: {
    fontSize: 24,
    color: '#4f46e5',
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayText: {
    fontSize: 14,
    color: '#1f2937',
  },
  selectedDay: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: '700' as const,
  },
  today: {
    borderWidth: 2,
    borderColor: '#4f46e5',
    borderRadius: 8,
  },
  orderIndicator: {
    position: 'absolute',
    bottom: 4,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingHorizontal: 4,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderCount: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700' as const,
  },
  ordersSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 16,
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
  ordersSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  ordersSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1f2937',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  ordersList: {
    gap: 12,
  },
  orderCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderInfo: {
    flex: 1,
  },
  orderName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1f2937',
    marginBottom: 4,
  },
  orderDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadgeH: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 20,
    alignItems: 'center',
  },
  typeBadgeM: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 20,
    alignItems: 'center',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
  },
  quantityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1f2937',
  },
  quantityButton: {
    width: 28,
    height: 28,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1f2937',
  },
  quantityInput: {
    width: 40,
    height: 28,
    backgroundColor: '#fff',
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1f2937',
  },
  saveButton: {
    width: 28,
    height: 28,
    backgroundColor: '#10b981',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  pickupButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pickedUpButton: {
    backgroundColor: '#059669',
  },
  pickupButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  deleteButton: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    backgroundColor: '#4f46e5',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      },
    }),
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
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryBadge: {
    backgroundColor: '#3b82f6',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBadgeM: {
    backgroundColor: '#f59e0b',
  },
  summaryBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1f2937',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  quantityInputLarge: {
    width: 80,
    height: 48,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  addButton: {
    backgroundColor: '#4f46e5',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
