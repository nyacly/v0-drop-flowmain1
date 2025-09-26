// This file will contain the client-side logic for route optimization.
// It will use the Google Maps JavaScript API, which is expected to be loaded by another component (e.g., MapView.web.tsx).

// Define the Stop type based on its usage in the app
interface Stop {
  id: string;
  label: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
}

// Define the structure of the optimized route data
interface OptimizedRoute {
  orderedStops: Stop[];
  decodedPolyline: { latitude: number; longitude: number }[];
  totalDistance: number;
  totalDuration: number;
}

/**
 * Optimizes a route using the Google Maps Directions Service.
 * @param stops An array of stops to be included in the route.
 * @returns A promise that resolves with the optimized route data.
 */
export const optimizeRoute = (
  stops: Stop[],
  options?: { vehicle: any }, // Vehicle options are ignored for now
  currentLocation?: { latitude: number; longitude: number }
): Promise<OptimizedRoute> => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps) {
      return reject(new Error("Google Maps API is not loaded."));
    }

    if (stops.length < 1) {
      return reject(new Error("At least one stop is required for optimization."));
    }

    const directionsService = new window.google.maps.DirectionsService();

    // Use current location as origin if provided, otherwise use the first stop
    const origin = currentLocation
      ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
      : { lat: stops[0].coordinate.latitude, lng: stops[0].coordinate.longitude };

    const stopsForRouting = currentLocation ? stops : stops.slice(1);

    if (stopsForRouting.length === 0) {
      // If only origin is provided, there's no route to optimize
      return resolve({
        orderedStops: [],
        decodedPolyline: [],
        totalDistance: 0,
        totalDuration: 0,
      });
    }

    const destination = stopsForRouting[stopsForRouting.length - 1];
    const waypoints = stopsForRouting.slice(0, -1).map(stop => ({
      location: { lat: stop.coordinate.latitude, lng: stop.coordinate.longitude },
      stopover: true,
    }));

    const request: google.maps.DirectionsRequest = {
      origin: origin,
      destination: { lat: destination.coordinate.latitude, lng: destination.coordinate.longitude },
      waypoints: waypoints,
      optimizeWaypoints: true,
      travelMode: window.google.maps.TravelMode.DRIVING,
      drivingOptions: {
        departureTime: new Date(),
        trafficModel: window.google.maps.TrafficModel.BEST_GUESS,
      },
    };

    directionsService.route(request, (result, status) => {
      if (status === window.google.maps.DirectionsStatus.OK && result) {
        const route = result.routes[0];
        const waypointOrder = route.waypoint_order || [];

        // The waypoint_order gives the optimized order of the waypoints array.
        // We need to reconstruct the full list of stops in the new order.
        const waypointStops = stopsForRouting.slice(0, -1);
        const orderedWaypointStops = waypointOrder.map(index => waypointStops[index]);

        const destinationStop = stopsForRouting[stopsForRouting.length - 1];

        const orderedStops = currentLocation
          ? [...orderedWaypointStops, destinationStop]
          : [stops[0], ...orderedWaypointStops, destinationStop];

        // Decode the polyline
        const decodedPolyline = window.google.maps.geometry.encoding.decodePath(route.overview_polyline);

        // Calculate total distance and duration
        let totalDistance = 0;
        let totalDuration = 0;
        route.legs.forEach(leg => {
          totalDistance += leg.distance?.value || 0;
          totalDuration += leg.duration?.value || 0;
        });

        resolve({
          orderedStops,
          decodedPolyline: decodedPolyline.map(p => ({ latitude: p.lat(), longitude: p.lng() })),
          totalDistance,
          totalDuration,
        });
      } else {
        reject(new Error(`Directions request failed due to ${status}`));
      }
    });
  });
};
