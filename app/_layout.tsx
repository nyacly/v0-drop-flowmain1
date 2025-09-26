import React from 'react';
import { Slot } from 'expo-router';
import { SubscriptionProvider } from '../contexts/SubscriptionContext';
import { AuthProvider } from '../hooks/useAuth';

export default function RootLayout() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <Slot />
      </SubscriptionProvider>
    </AuthProvider>
  );
}
