import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { AuthGuard } from '../components/AuthGuard';
import { View, Text, Button, Card } from '../theme';
import { useAuth } from '../hooks/useAuth';

export default function OnboardingScreen() {
  const { user } = useAuth();

  const handleGetStarted = () => {
    router.push('/(tabs)');
  };

  return (
    <AuthGuard>
      <View variant="background" style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.logo}>🚛 DropFlow</Text>
            <Text style={styles.welcome}>Welcome, {user?.firstName || user?.email}!</Text>
            <Text style={styles.subtitle}>
              Your account is verified and ready to go. Let's optimize your delivery routes!
            </Text>
          </View>

          <Card style={styles.card}>
            <Text variant="subtitle">What's Next?</Text>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📍</Text>
                <Text variant="body">Import your delivery addresses</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🗺️</Text>
                <Text variant="body">Get optimized routes with real-time traffic</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📱</Text>
                <Text variant="body">Navigate with turn-by-turn directions</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✅</Text>
                <Text variant="body">Track deliveries with proof of delivery</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.planCard}>
            <Text variant="subtitle">Your Plan</Text>
            <Text variant="body" color="secondary">
              Free Plan - Up to 10 delivery stops per route
            </Text>
            <Text variant="caption" color="secondary" style={styles.upgradeText}>
              Upgrade to Pro for unlimited stops and advanced features
            </Text>
          </Card>

          <Button onPress={handleGetStarted} style={styles.button}>
            Get Started
          </Button>
        </ScrollView>
      </View>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 16,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    marginBottom: 16,
  },
  featureList: {
    marginTop: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  planCard: {
    marginBottom: 24,
    backgroundColor: '#f8f9fa',
  },
  upgradeText: {
    marginTop: 8,
    fontStyle: 'italic',
  },
  button: {
    marginTop: 16,
  },
});
