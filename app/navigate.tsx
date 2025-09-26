import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, Linking, ScrollView, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
// Note: Using FlatList with reorder buttons instead of drag-and-drop library due to web compatibility issues
import MapView from '../components/MapView';

import { View, Text, Button, Card, Input } from '../theme';
import { useStops } from '../contexts/StopsContext';
import { offlineCache } from '../lib/offline';
import { optimizeRoute } from '../lib/optimizeClient';
import { Stop, ProofOfDelivery } from '../types/route';

const { width, height } = Dimensions.get('window');

// Utility function to calculate distance between two points in miles
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function NavigateScreen() {
  const { stops, updateStop, updateStops } = useStops();
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [podNote, setPodNote] = useState('');
  const [podPhoto, setPodPhoto] = useState<string | null>(null);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<any>(null);

  const pendingStops = stops.filter(stop => stop.status === 'pending');
  const completedStops = stops.filter(stop => stop.status === 'done');

  useEffect(() => {
    startLocationTracking();
    return () => {
      // Cleanup location subscription
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount

  useEffect(() => {
    if (pendingStops.length === 0 && stops.length > 0) {
      Alert.alert('Route Complete', 'All deliveries completed!', [
        { text: 'OK', onPress: () => router.push('/') }
      ]);
    }
  }, [pendingStops.length, stops.length]);

  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Use Brisbane as fallback
        setCurrentLocation({ latitude: -27.4698, longitude: 153.0251 });
        return;
      }

      // Get initial position
      const initialLocation = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: initialLocation.coords.latitude,
        longitude: initialLocation.coords.longitude,
      });

      // Start continuous tracking
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update when moved 10 meters
        },
        (location) => {
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      );
      
      setLocationSubscription(subscription);
    } catch (error) {
      console.error('Location error:', error);
      // Use Brisbane as fallback
      setCurrentLocation({ latitude: -27.4698, longitude: 153.0251 });
    }
  };

  const handleCall = (stop: Stop) => {
    // Extract phone number from notes or use a default
    const phoneNumber = extractPhoneNumber(stop.notes) || '0400000000';
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleSMS = (stop: Stop) => {
    const phoneNumber = extractPhoneNumber(stop.notes) || '0400000000';
    const message = `Hi, I'm on my way to deliver your order ${stop.label}. ETA: 5 minutes.`;
    Linking.openURL(`sms:${phoneNumber}?body=${encodeURIComponent(message)}`);
  };

  const extractPhoneNumber = (text?: string): string | null => {
    if (!text) return null;
    const phoneRegex = /(\+?61|0)[4-5]\d{8}/;
    const match = text.match(phoneRegex);
    return match ? match[0] : null;
  };

  const takePODPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed for proof of delivery photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPodPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
      console.error('Camera error:', error);
    }
  };

  const getMapMarkers = () => {
    const markers = [];
    
    // Add start location marker
    if (currentLocation) {
      markers.push({
        id: 'start',
        coordinate: currentLocation,
        title: 'Start Location',
        description: 'Your current location',
        pinColor: 'green',
        isCustom: false
      });
    }
    
    // Add only pending stop markers to avoid routing through completed stops
    const pendingStopsForMap = stops.filter(stop => stop.status === 'pending');
    pendingStopsForMap.forEach((stop, index) => {
      if (stop.geo) {
        // Calculate the stop number based on position in full stops array
        const stopNumber = stops.indexOf(stop) + 1;
        markers.push({
          id: stop.id,
          coordinate: {
            latitude: stop.geo.lat,
            longitude: stop.geo.lng,
          },
          title: `${stopNumber}. ${stop.label}`,
          description: stop.rawAddress,
          stopNumber: stopNumber,
          isCustom: true
        });
      }
    });
    
    return markers;
  };

  const getMapRegion = () => {
    if (!currentLocation) {
      return {
        latitude: -27.4698,
        longitude: 153.0251,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    }

    // Only consider pending stops for map region calculation
    const pendingStops = stops.filter(stop => stop.status === 'pending');
    
    if (pendingStops.length === 0) {
      return {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    // Calculate bounds for pending stops only
    const lats = pendingStops
      .filter(stop => stop.geo)
      .map(stop => stop.geo!.lat);
    const lngs = pendingStops
      .filter(stop => stop.geo)
      .map(stop => stop.geo!.lng);
    
    lats.push(currentLocation.latitude);
    lngs.push(currentLocation.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(maxLat - minLat, 0.01) * 1.3,
      longitudeDelta: Math.max(maxLng - minLng, 0.01) * 1.3,
    };
  };

  const getDistanceToStop = (stop: Stop): string => {
    if (!currentLocation || !stop.geo) return '';
    
    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      stop.geo.lat,
      stop.geo.lng
    );
    
    return `${distance.toFixed(1)}mi`;
  };

  const handleStopTap = (stop: Stop) => {
    if (stop.status === 'done') return;
    
    setSelectedStop(stop);
    setShowDeliveryDialog(true);
  };

  const markDelivered = async () => {
    if (!selectedStop) return;

    const pod: ProofOfDelivery = {
      timestamp: new Date().toISOString(),
      note: podNote.trim() || undefined,
      photoUri: podPhoto || undefined,
    };

    const updatedStop: Stop = {
      ...selectedStop,
      status: 'done',
      pod,
    };

    // Clear optimized route before updating stops to prevent map from using outdated polyline
    setOptimizedRoute(null);

    // Update in context
    updateStop(updatedStop);
    
    // Cache offline for sync later
    offlineCache.markDeliveryCompleted(selectedStop.id, pod, selectedStop);

    // Reset POD state
    setPodNote('');
    setPodPhoto(null);
    setSelectedStop(null);
    setShowDeliveryDialog(false);

    // Re-optimize route with current location and remaining stops
    await reOptimizeRemainingRoute(selectedStop.id);
  };

  const reOptimizeRemainingRoute = async (completedStopId?: string) => {
    try {
      // Get remaining pending stops, excluding the just-completed stop to avoid race condition
      const remainingStops = stops.filter(stop => 
        stop.status === 'pending' && stop.id !== completedStopId
      );
      
      if (remainingStops.length <= 1 || !currentLocation) {
        // No need to optimize if 1 or fewer stops remaining, or no location
        return;
      }

      setIsOptimizing(true);
      
      // Call optimization API with current location as new start point
      const optimizationResult = await optimizeRoute(
        remainingStops,
        { vehicle: { lPer100: 8, fuelPrice: 1.5 } }, // Default vehicle profile
        currentLocation // Use current GPS location as new origin
      );

      if (optimizationResult?.orderedStops) {
        // Update the route state for map display
        setOptimizedRoute(optimizationResult);
        
        // Convert distance from meters to km and duration from seconds to minutes
        const distanceKm = (optimizationResult.totalDistance / 1000).toFixed(1);
        const timeMin = Math.round(optimizationResult.totalDuration / 60);

        console.log('🚛 Route re-optimized! New sequence:', optimizationResult.orderedStops.map(s => s.label).join(' → '));
        console.log(`📊 Optimization saved: ${distanceKm}km, ${timeMin}min`);
        
        // Show success feedback to user
        Alert.alert(
          '🚛 Route Re-Optimized!',
          `Updated route based on your current location.\n\nNew route: ${distanceKm}km, ${timeMin} min`,
          [{ text: 'Continue', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Route re-optimization failed:', error);
      // Don't show error to user as this is a background enhancement
      // The original route will still work fine
    } finally {
      setIsOptimizing(false);
    }
  };

  const moveStopUp = async (stopIndex: number) => {
    if (stopIndex <= 0) return;
    
    const newStops = [...stops];
    const stop = newStops[stopIndex];
    const previousStop = newStops[stopIndex - 1];
    
    // Only allow reordering pending stops
    if (stop.status !== 'pending' || previousStop.status !== 'pending') return;
    
    // Swap the stops
    newStops[stopIndex] = previousStop;
    newStops[stopIndex - 1] = stop;
    
    updateStops(newStops);
    await reoptimizeAfterReorder(newStops);
  };

  const moveStopDown = async (stopIndex: number) => {
    if (stopIndex >= stops.length - 1) return;
    
    const newStops = [...stops];
    const stop = newStops[stopIndex];
    const nextStop = newStops[stopIndex + 1];
    
    // Only allow reordering pending stops
    if (stop.status !== 'pending' || nextStop.status !== 'pending') return;
    
    // Swap the stops
    newStops[stopIndex] = nextStop;
    newStops[stopIndex + 1] = stop;
    
    updateStops(newStops);
    await reoptimizeAfterReorder(newStops);
  };

  const reoptimizeAfterReorder = async (reorderedStops: Stop[]) => {
    const pendingStops = reorderedStops.filter(stop => stop.status === 'pending');
    
    // Clear current route to show new order
    setOptimizedRoute(null);
    
    // Generate route that respects the user's manual ordering instead of re-optimizing
    if (pendingStops.length > 0 && currentLocation) {
      try {
        setIsOptimizing(true);
        
        console.log('🎯 Regenerating route with user-defined order:', pendingStops.map(s => s.label).join(' → '));
        
        // For now, we'll create a simple route object that respects the manual order
        // In a full implementation, this would call Google Directions API with waypoints in the specified order
        const manualRoute = {
          orderedStops: pendingStops,
          totals: {
            distanceKm: 0, // Would be calculated from actual route
            timeMin: 0,    // Would be calculated from actual route
            fuelCost: 0    // Would be calculated from actual route
          },
          polyline: null // Would contain actual route polyline
        };
        
        setOptimizedRoute(manualRoute);
        
        console.log('✅ Route regenerated to respect manual order');
      } catch (error) {
        console.error('Route regeneration after reorder failed:', error);
      } finally {
        setIsOptimizing(false);
      }
    }
  };

  const skipStop = (stop: Stop) => {
    Alert.alert(
      'Skip Delivery',
      `Are you sure you want to skip delivery to ${stop.label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip', 
          style: 'destructive',
          onPress: () => {
            const updatedStop: Stop = {
              ...stop,
              status: 'skipped',
            };
            updateStop(updatedStop);
            setShowDeliveryDialog(false);
          }
        }
      ]
    );
  };

  const renderStopItem = ({ item: stop, index }: { item: Stop; index: number }) => {
    const isDone = stop.status === 'done' || stop.status === 'skipped';
    const distance = getDistanceToStop(stop);
    const canMoveUp = index > 0 && stop.status === 'pending' && stops[index - 1]?.status === 'pending';
    const canMoveDown = index < stops.length - 1 && stop.status === 'pending' && stops[index + 1]?.status === 'pending';
    
    return (
      <TouchableOpacity
        onPress={() => handleStopTap(stop)}
        style={{
          ...styles.stopItem,
          ...(isDone && styles.stopItemCompleted)
        }}
      >
        <View style={styles.stopItemContent}>
          {/* Left side - status indicator and info */}
          <View style={styles.stopLeftContent}>
            <View style={{
              ...styles.stopBadge,
              ...(isDone ? styles.stopBadgeCompleted : styles.stopBadgePending)
            }}>
              {isDone ? (
                <Text style={styles.checkmark}>✓</Text>
              ) : (
                <Text style={styles.stopNumber}>{stops.indexOf(stop) + 1}</Text>
              )}
            </View>
            <View style={styles.stopInfo}>
              <Text style={{
                ...styles.stopTitle,
                ...(isDone && styles.stopTitleCompleted)
              }}>
                {stop.label}
              </Text>
              <Text style={styles.stopDetails}>
                {isDone ? 'Completed' : (stop.notes || stop.rawAddress || 'Delivery stop')}
              </Text>
            </View>
          </View>
          
          {/* Right side - distance, time, and reorder buttons */}
          <View style={styles.stopRightContent}>
            {distance && (
              <>
                <Text style={{
                  ...styles.distanceText,
                  ...(isDone && styles.distanceTextCompleted)
                }}>
                  {distance}
                </Text>
                <Text style={styles.timeText}>
                  {isDone ? '' : '6m'}
                </Text>
              </>
            )}
            
            {/* Reorder buttons for pending stops */}
            {!isDone && (
              <View style={styles.reorderButtons}>
                <TouchableOpacity
                  onPress={() => moveStopUp(index)}
                  disabled={!canMoveUp}
                  style={{
                    ...styles.reorderButton,
                    ...(canMoveUp ? styles.reorderButtonEnabled : styles.reorderButtonDisabled)
                  }}
                >
                  <Text style={styles.reorderButtonText}>↑</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => moveStopDown(index)}
                  disabled={!canMoveDown}
                  style={{
                    ...styles.reorderButton,
                    ...(canMoveDown ? styles.reorderButtonEnabled : styles.reorderButtonDisabled)
                  }}
                >
                  <Text style={styles.reorderButtonText}>↓</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (stops.length === 0) {
    return (
      <View variant="background" style={styles.container}>
        <View style={styles.emptyState}>
          <Text variant="title">No Deliveries</Text>
          <Text variant="body" color="secondary">
            No delivery stops found. Please go back and import your delivery addresses.
          </Text>
          <Button onPress={() => router.push('/')} style={styles.button}>
            Return Home
          </Button>
        </View>
      </View>
    );
  }

  const completedCount = completedStops.length;
  const totalCount = stops.length;

  return (
    <View variant="background" style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Deliver & Sign</Text>
        <Text style={styles.headerProgress}>{completedCount}/{totalCount}</Text>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <MapView
          region={getMapRegion()}
          showsUserLocation
          markers={getMapMarkers()}
          polylineCoordinates={optimizedRoute?.decodedPolyline && optimizedRoute.decodedPolyline.length > 0 ? optimizedRoute.decodedPolyline : []}
          useGoogleDirections={true}
        />
        {isOptimizing && (
          <View style={styles.optimizingOverlay}>
            <Text style={styles.optimizingText}>🚛 Re-optimizing route...</Text>
          </View>
        )}
      </View>

      {/* Delivery Stops List */}
      <View style={styles.stopsContainer}>
        <Text style={styles.stopsHeader}>
          All Stops ({pendingStops.length} Remaining)
        </Text>
        <FlatList
          data={(() => {
            // Create a stable sorted array without mutating the original
            const displayStops = [...stops];
            return displayStops.sort((a, b) => {
              // Sort by: completed/skipped items last, then by original order
              const aCompleted = a.status === 'done' || a.status === 'skipped';
              const bCompleted = b.status === 'done' || b.status === 'skipped';
              if (aCompleted && !bCompleted) return 1;
              if (!aCompleted && bCompleted) return -1;
              return stops.indexOf(a) - stops.indexOf(b);
            });
          })()}
          renderItem={renderStopItem}
          keyExtractor={(item) => item.id}
          style={styles.stopsList}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Delivery Dialog Modal */}
      {showDeliveryDialog && selectedStop && (
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogContent}>
            <Text style={styles.dialogTitle}>Mark as Delivered</Text>
            <Text style={styles.dialogSubtitle}>{selectedStop.label}</Text>
            
            <Input
              value={podNote}
              onChangeText={setPodNote}
              placeholder="Delivery notes (optional)"
              multiline
              style={styles.dialogNotesInput}
            />

            <View style={styles.dialogPhotoSection}>
              {podPhoto ? (
                <View style={styles.photoPreview}>
                  <Text variant="caption" color="secondary">Photo captured ✓</Text>
                  <Button variant="outline" onPress={takePODPhoto} size="sm">
                    Retake
                  </Button>
                </View>
              ) : (
                <Button variant="outline" onPress={takePODPhoto}>
                  📷 Take Photo (Optional)
                </Button>
              )}
            </View>

            <View style={styles.dialogButtons}>
              <Button 
                variant="outline" 
                onPress={() => setShowDeliveryDialog(false)}
                style={styles.dialogButton}
              >
                Cancel
              </Button>
              <Button 
                variant="outline"
                onPress={() => skipStop(selectedStop)}
                style={styles.dialogButton}
              >
                Skip
              </Button>
              <Button 
                onPress={markDelivered}
                style={styles.dialogButton}
              >
                ✅ Mark Delivered
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header styles
  header: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50, // Account for status bar
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerProgress: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Map styles
  mapContainer: {
    flex: 2,
    backgroundColor: '#f0f0f0',
  },
  // Stops list styles
  stopsContainer: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  stopsHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  stopsList: {
    flex: 1,
  },
  stopItem: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 12,
    marginBottom: 0,
  },
  stopItemCompleted: {
    opacity: 0.7,
  },
  stopItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  stopLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stopBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stopBadgeCompleted: {
    backgroundColor: '#28a745',
  },
  stopBadgePending: {
    backgroundColor: '#dc3545',
  },
  checkmark: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stopNumber: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stopInfo: {
    flex: 1,
  },
  stopTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  stopTitleCompleted: {
    color: '#28a745',
  },
  stopDetails: {
    fontSize: 14,
    color: '#666',
  },
  stopRightContent: {
    alignItems: 'flex-end',
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc3545',
    marginBottom: 2,
  },
  distanceTextCompleted: {
    color: '#28a745',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  // Dialog styles
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  dialogContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    width: width - 40,
    maxWidth: 400,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  dialogSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  dialogNotesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    height: 80,
    textAlignVertical: 'top',
  },
  dialogPhotoSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  photoPreview: {
    alignItems: 'center',
    gap: 8,
  },
  dialogButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  dialogButton: {
    flex: 1,
  },
  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  button: {
    marginTop: 16,
  },
  // Optimization overlay styles
  optimizingOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 100,
  },
  optimizingText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  // Drag and drop styles
  stopItemDragging: {
    opacity: 0.8,
    transform: [{ scale: 1.02 }],
    backgroundColor: '#f8f9fa',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  dragIndicator: {
    marginLeft: 8,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragIcon: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  // Reorder button styles
  reorderButtons: {
    flexDirection: 'column',
    marginLeft: 8,
    gap: 4,
  },
  reorderButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  reorderButtonEnabled: {
    backgroundColor: '#dc3545',
    borderColor: '#dc3545',
  },
  reorderButtonDisabled: {
    backgroundColor: '#f8f9fa',
    borderColor: '#ddd',
  },
  reorderButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
});
