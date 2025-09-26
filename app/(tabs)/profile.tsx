import React from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { View, Text, Button, Card } from '../../theme';
import { useAuth } from '../../hooks/useAuth';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth');
          }
        }
      ]
    );
  };

  return (
    <View variant="background" style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="headline">Profile</Text>
          <Text variant="body" color="secondary">
            Manage your account settings
          </Text>
        </View>

        <Card style={styles.profileCard}>
          <Text variant="subtitle">Account Information</Text>
          <View style={styles.infoRow}>
            <Text variant="body" color="secondary">Email:</Text>
            <Text variant="body">{user?.email}</Text>
          </View>
          {user?.firstName && (
            <View style={styles.infoRow}>
              <Text variant="body" color="secondary">Name:</Text>
              <Text variant="body">{user.firstName} {user.lastName}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text variant="body" color="secondary">Status:</Text>
            <Text variant="body" style={styles.verifiedText}>
              ✅ Verified
            </Text>
          </View>
        </Card>

        <Card style={styles.subscriptionCard}>
          <Text variant="subtitle">Subscription</Text>
          <View style={styles.infoRow}>
            <Text variant="body" color="secondary">Plan:</Text>
            <Text variant="body">Free (10 stops limit)</Text>
          </View>
          <Text variant="caption" color="secondary" style={styles.upgradeText}>
            Upgrade to Pro for unlimited stops and advanced features
          </Text>
        </Card>

        <View style={styles.buttonContainer}>
          <Button variant="outline" onPress={handleLogout} style={styles.logoutButton}>
            Logout
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
    marginBottom: 24,
  },
  profileCard: {
    marginBottom: 16,
  },
  subscriptionCard: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 4,
  },
  verifiedText: {
    color: '#059669',
  },
  upgradeText: {
    marginTop: 12,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: 16,
  },
  logoutButton: {
    borderColor: '#dc2626',
  },
});
