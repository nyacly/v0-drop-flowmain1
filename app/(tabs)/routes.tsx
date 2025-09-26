import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { View, Text, Card } from '../../theme';

export default function RoutesScreen() {
  return (
    <View variant="background" style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="headline">Your Routes</Text>
          <Text variant="body" color="secondary">
            View and manage your delivery routes
          </Text>
        </View>

        <Card style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text variant="subtitle">No Routes Yet</Text>
          <Text variant="body" color="secondary" style={styles.emptyText}>
            You haven't created any delivery routes yet. Start by creating your first route from the home screen.
          </Text>
        </Card>
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
    marginBottom: 24,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 8,
  },
});
