import React from 'react';
import { Tabs } from 'expo-router';
import { AuthGuard } from '../../components/AuthGuard';

export default function TabLayout() {
  return (
    <AuthGuard>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#dc2626',
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <span style={{ color }}>🏠</span>,
          }}
        />
        <Tabs.Screen
          name="routes"
          options={{
            title: 'Routes',
            tabBarIcon: ({ color }) => <span style={{ color }}>🗺️</span>,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <span style={{ color }}>👤</span>,
          }}
        />
      </Tabs>
    </AuthGuard>
  );
}
