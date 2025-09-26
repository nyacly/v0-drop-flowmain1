import { Stop } from '../types/route';

// Simple in-memory cache for offline functionality
// In production, this would use AsyncStorage or SQLite
class OfflineCache {
  private pendingDeliveries: Stop[] = [];
  private completedDeliveries: Stop[] = [];

  addPendingDelivery(stop: Stop) {
    const index = this.pendingDeliveries.findIndex(s => s.id === stop.id);
    if (index >= 0) {
      this.pendingDeliveries[index] = stop;
    } else {
      this.pendingDeliveries.push(stop);
    }
  }

  markDeliveryCompleted(stopId: string, pod?: Stop['pod'], stopData?: Stop) {
    const index = this.pendingDeliveries.findIndex(s => s.id === stopId);
    if (index >= 0) {
      // Stop was pre-seeded in pending deliveries
      const stop = { 
        ...this.pendingDeliveries[index], 
        status: 'done' as const,
        pod 
      };
      this.pendingDeliveries.splice(index, 1);
      this.completedDeliveries.push(stop);
    } else if (stopData) {
      // Stop wasn't pre-seeded, use provided stop data
      const completedStop = {
        ...stopData,
        status: 'done' as const,
        pod
      };
      this.completedDeliveries.push(completedStop);
    }
    // Note: If neither condition is met, we still want to track this for sync
    // In production, this would be logged for server sync
  }

  getPendingDeliveries(): Stop[] {
    return [...this.pendingDeliveries];
  }

  getCompletedDeliveries(): Stop[] {
    return [...this.completedDeliveries];
  }

  syncWhenOnline(): Promise<void> {
    // In production, this would sync with the server
    return Promise.resolve();
  }

  clear() {
    this.pendingDeliveries = [];
    this.completedDeliveries = [];
  }
}

export const offlineCache = new OfflineCache();
