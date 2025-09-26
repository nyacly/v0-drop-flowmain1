import React, { useEffect, useRef } from 'react';
import { View, Text } from '../theme';

// Declare global Google Maps types for web
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface MapProps {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  markers?: Array<{
    id: string;
    coordinate: { latitude: number; longitude: number };
    title: string;
    description?: string;
    pinColor?: string;
    stopNumber?: number;
    isCustom?: boolean;
  }>;
  polylineCoordinates?: Array<{ latitude: number; longitude: number }>;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  useGoogleDirections?: boolean;
  children?: React.ReactNode;
}

// Web Google Maps component using Google Maps JavaScript API
export default function MapView({ 
  region, 
  markers = [], 
  polylineCoordinates = [], 
  showsUserLocation = false,
  useGoogleDirections = false
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);

  useEffect(() => {
    // Load Google Maps JavaScript API
    const loadGoogleMaps = () => {
      if (window.google) {
        initializeMap();
        return;
      }
      
      // Check if script is already loading
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        existingScript.addEventListener('load', initializeMap);
        return;
      }
      
      // Use environment variable API key for production use
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
      
      // Debug logging
      console.log('Google Maps API Key available:', !!apiKey);
      console.log('API Key length:', apiKey?.length || 0);
      
      if (!apiKey || apiKey.length < 20) {
        // Show improved fallback message when API key isn't available
        if (mapRef.current) {
          mapRef.current.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 20px; border-radius: 12px;">
              <div style="max-width: 300px;">
                <div style="font-size: 48px; margin-bottom: 16px;">🗺️</div>
                <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">Interactive Map</h3>
                <p style="margin: 0; font-size: 14px; opacity: 0.9; line-height: 1.4;">
                  Map will load when Google Maps API is configured.<br/>
                  Route visualization and turn-by-turn navigation available.
                </p>
              </div>
            </div>
          `;
        }
        return;
      }
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      script.onerror = () => {
        if (mapRef.current) {
          mapRef.current.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: linear-gradient(135deg, #ff7b7b 0%, #ff9999 100%); color: white; text-align: center; padding: 20px; border-radius: 12px;">
              <div style="max-width: 300px;">
                <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">Map Loading Error</h3>
                <p style="margin: 0; font-size: 14px; opacity: 0.9; line-height: 1.4;">
                  Unable to load Google Maps.<br/>
                  Please check your internet connection and try again.
                </p>
              </div>
            </div>
          `;
        }
      };
      document.head.appendChild(script);
    };

    loadGoogleMaps();

    function initializeMap() {
      if (!mapRef.current || !window.google) return;

      // Initialize the map
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: region.latitude, lng: region.longitude },
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
      });

      googleMapRef.current = map;

      // Add markers
      markers.forEach((marker, index) => {
        let markerIcon;
        
        if (marker.isCustom && marker.stopNumber) {
          // Create custom numbered marker
          const canvas = document.createElement('canvas');
          canvas.width = 40;
          canvas.height = 40;
          const ctx = canvas.getContext('2d')!;
          
          // Draw circle background
          ctx.fillStyle = '#dc3545';
          ctx.beginPath();
          ctx.arc(20, 20, 18, 0, 2 * Math.PI);
          ctx.fill();
          
          // Draw white border
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 3;
          ctx.stroke();
          
          // Draw number text
          ctx.fillStyle = 'white';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(marker.stopNumber.toString(), 20, 20);
          
          markerIcon = {
            url: canvas.toDataURL(),
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 20)
          };
        } else {
          // Use standard marker
          markerIcon = {
            url: `https://maps.google.com/mapfiles/ms/icons/${marker.pinColor || 'red'}-dot.png`,
          };
        }
        
        const googleMarker = new window.google.maps.Marker({
          position: { lat: marker.coordinate.latitude, lng: marker.coordinate.longitude },
          map: map,
          title: marker.title,
          icon: markerIcon,
        });

        // Add info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div><strong>${marker.title}</strong>${marker.description ? `<br>${marker.description}` : ''}</div>`,
        });

        googleMarker.addListener('click', () => {
          infoWindow.open(map, googleMarker);
        });
      });

      // Add route - prioritize optimized polyline over Google DirectionsService
      if (polylineCoordinates.length > 1) {
        // Use provided optimized route polyline
        console.log('Using optimized route polyline with', polylineCoordinates.length, 'coordinates');
        addSimplePolyline();
      } else if (markers.length > 1) {
        // Fallback to Google DirectionsService only when no polyline provided
        console.log('No optimized polyline available, falling back to Google DirectionsService');
        const directionsService = new window.google.maps.DirectionsService();
        const directionsRenderer = new window.google.maps.DirectionsRenderer({
          suppressMarkers: true, // We'll show our own markers
          polylineOptions: {
            strokeColor: '#5E72E4',
            strokeOpacity: 1.0,
            strokeWeight: 4,
          },
        });
        directionsRenderer.setMap(map);

        // Use Google Maps route planning with waypoints
        const waypoints = markers.slice(1, -1).map(marker => ({
          location: { lat: marker.coordinate.latitude, lng: marker.coordinate.longitude },
          stopover: true,
        }));

        const request = {
          origin: { lat: markers[0].coordinate.latitude, lng: markers[0].coordinate.longitude },
          destination: { lat: markers[markers.length - 1].coordinate.latitude, lng: markers[markers.length - 1].coordinate.longitude },
          waypoints: waypoints,
          optimizeWaypoints: true, // Google's route optimization
          travelMode: window.google.maps.TravelMode.DRIVING,
          drivingOptions: {
            departureTime: new Date(), // Current time for traffic-aware routing
            trafficModel: window.google.maps.TrafficModel.BEST_GUESS,
          },
        };

        directionsService.route(request, (result: any, status: any) => {
          if (status === 'OK') {
            directionsRenderer.setDirections(result);
          } else {
            console.error('Directions request failed:', status);
            // No fallback needed since no polyline was provided
          }
        });
      }

      function addSimplePolyline() {
        const routePath = new window.google.maps.Polyline({
          path: polylineCoordinates.map(coord => ({ lat: coord.latitude, lng: coord.longitude })),
          geodesic: true,
          strokeColor: '#5E72E4',
          strokeOpacity: 1.0,
          strokeWeight: 3,
        });
        routePath.setMap(map);
      }

      // Fit bounds to show all markers
      if (markers.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        markers.forEach(marker => {
          bounds.extend(new window.google.maps.LatLng(marker.coordinate.latitude, marker.coordinate.longitude));
        });
        map.fitBounds(bounds);
      }
    }
  }, [region, markers, polylineCoordinates]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        width: '100%', 
        height: '400px', 
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }} 
    />
  );
}
