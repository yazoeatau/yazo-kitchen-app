import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Printer } from 'lucide-react-native';
import React from 'react';
import HomeScreen from '../screens/HomeScreen';
import PosScreen from '../screens/PosScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          backgroundColor: '#fff',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={PosScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
       <Tab.Screen
        name="Printer"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Printer size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
