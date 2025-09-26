import React from 'react';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { View, Text, Button, Card } from '../theme';
import { useStops } from '../contexts/StopsContext';
import { usePaywallGuard } from '../components/PaywallGuard';
import { useSubscription } from '../contexts/SubscriptionContext';

export default function PlanScreen() {
  const { stops } = useStops();
  const { checkStopLimit } = usePaywallGuard();
  const { isProUser, subscription } = useSubscription();

  const handleBack = () => {
    router.back();
  };

  const handleStartRoute = () => {
    // Check if user can proceed with route optimization
    if (checkStopLimit(stops.length)) {
      router.push('/route');
    }
    // If checkStopLimit returns false, it will show the paywall alert
  };

  const isOverLimit = !isProUser && stops.length > subscription.stopsLimit;

  return (
    <View variant="background" style={styles.container}>
      <View style={styles.header}>
        <Text variant="headline">Plan Route</Text>
        <Text variant="body" color="secondary">
          Optimize your delivery route
        </Text>
      </View>

      <Card style={styles.card}>
        <Text variant="subtitle">Route Planning</Text>
        <Text variant="body" color="secondary">
          Optimization ready for {stops.length} stops
        </Text>
        
        <View style={styles.planDetails}>
          <View style={styles.planItem}>
            <Text variant="body">📍 Delivery Stops: {stops.length}</Text>
          </View>
          <View style={styles.planItem}>
            <Text variant="body">🎯 Route Objective: Fastest route with traffic optimization</Text>
          </View>
          <View style={styles.planItem}>
            <Text variant="body">🗺️ Google Maps: Real-time directions and traffic data</Text>
          </View>
          <View style={styles.planItem}>
            <Text variant="body">⚡ Smart Ordering: Automatic waypoint optimization</Text>
          </View>
        </View>

        {isOverLimit && (
          <View style={styles.limitWarning}>
            <Text variant="caption" color="secondary" style={styles.warningText}>
              ⚠️ You've reached the {subscription.stopsLimit}-stop limit for free users. 
              Upgrade to Pro for unlimited stops and advanced route optimization.
            </Text>
          </View>
        )}
        
        <Text variant="caption" color="secondary" style={styles.note}>
          {isOverLimit 
            ? 'Upgrade to unlock full route optimization features'
            : 'Ready to optimize your delivery route with real-time data'}
        </Text>
      </Card>

      <View style={styles.buttonContainer}>
        <Button variant="outline" onPress={handleBack} style={styles.button}>
          Back
        </Button>
        <Button 
          onPress={handleStartRoute} 
          style={{
            ...styles.button,
            ...(isOverLimit ? styles.disabledButton : {})
          }}
          disabled={isOverLimit}
        >
          {isOverLimit ? 'Upgrade to Start Route' : 'Start Route'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
    marginTop: 20,
  },
  card: {
    marginBottom: 16,
    flex: 1,
  },
  note: {
    marginTop: 12,
  },
  planDetails: {
    marginTop: 16,
    marginBottom: 12,
  },
  planItem: {
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
  },
  limitWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  warningText: {
    color: '#92400E',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#6B7280',
    opacity: 0.6,
  },
});
