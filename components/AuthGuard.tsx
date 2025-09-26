// Authentication guard component for DropFlow
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface AuthGuardProps {
  children: React.ReactNode;
  requireVerification?: boolean;
}

export function AuthGuard({ children, requireVerification = true }: AuthGuardProps) {
  const { user, isLoading } = useAuth();

  React.useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // No user logged in, redirect to auth
        router.replace('/auth');
        return;
      }
      
      if (requireVerification && !user.isVerified) {
        // User not verified, redirect to auth for verification
        router.replace('/auth');
        return;
      }
    }
  }, [user, isLoading, requireVerification]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#dc2626" />
        <ThemedText style={styles.loadingText}>
          Loading your account...
        </ThemedText>
      </ThemedView>
    );
  }

  // Show nothing while redirecting (prevents flash of content)
  if (!user || (requireVerification && !user.isVerified)) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#dc2626" />
      </ThemedView>
    );
  }

  // User is authenticated and verified, show protected content
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});
