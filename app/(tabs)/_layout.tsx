import { Tabs } from "expo-router";
import { ShoppingBag, Gamepad2 } from "lucide-react-native";
import React from "react";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#4f46e5",
        headerShown: true,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
        },
      }}
    >
      <Tabs.Screen
        name="orders"
        options={{
          title: "Pedidos",
          tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="machines"
        options={{
          title: "Máquinas",
          tabBarIcon: ({ color }) => <Gamepad2 size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
