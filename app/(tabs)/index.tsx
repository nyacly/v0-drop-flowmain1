import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { View, Text, Button, Card } from '../../theme';
import { useAuth } from '../../hooks/useAuth';

export default function HomeScreen() {
  const { user } = useAuth();

  const handleStartRoute = () => {
    router.push('/plan');
  };

  const handleViewRoutes = () => {
    router.push('/(tabs)/routes');
  };

  return (
    <View variant="background" style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.logo}>🚛 DropFlow</Text>
          <Text style={styles.greeting}>
            Welcome back, {user?.firstName || user?.email?.split('@')[0]}!
          </Text>
        </View>

        <Card style={styles.quickStartCard}>
          <Text variant="subtitle">Quick Start</Text>
          <Text variant="body" color="secondary" style={styles.description}>
            Ready to optimize your delivery route? Import your addresses and get started.
          </Text>
          <Button onPress={handleStartRoute} style={styles.primaryButton}>
            Start New Route
          </Button>
        </Card>

        <Card style={styles.statsCard}>
          <Text variant="subtitle">Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text variant="caption" color="secondary">Routes Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text variant="caption" color="secondary">Miles Saved</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>$0</Text>
              <Text variant="caption" color="secondary">Fuel Saved</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.featuresCard}>
          <Text variant="subtitle">Features</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🎯</Text>
              <View style={styles.featureContent}>
                <Text variant="body">Smart Route Optimization</Text>
                <Text variant="caption" color="secondary">
                  AI-powered routing with real-time traffic
                </Text>
              </View>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📱</Text>
              <View style={styles.featureContent}>
                <Text variant="body">Turn-by-Turn Navigation</Text>
                <Text variant="caption" color="secondary">
                  Integrated Google Maps directions
                </Text>
              </View>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📸</Text>
              <View style={styles.featureContent}>
                <Text variant="body">Proof of Delivery</Text>
                <Text variant="caption" color="secondary">
                  Photo capture and delivery notes
                </Text>
              </View>
            </View>
          </View>
        </Card>

        <View style={styles.buttonContainer}>
          <Button variant="outline" onPress={handleViewRoutes} style={styles.button}>
            View Past Routes
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 8,
  },
  greeting: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
  },
  quickStartCard: {
    marginBottom: 16,
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
  },
  description: {
    marginTop: 8,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#dc2626',
  },
  statsCard: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 4,
  },
  featuresCard: {
    marginBottom: 16,
  },
  featureList: {
    marginTop: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  buttonContainer: {
    marginTop: 16,
  },
  button: {
    marginBottom: 12,
  },
});
