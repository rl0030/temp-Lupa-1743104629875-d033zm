import {
  requestLocationPermission,
  requestTrackingPermissions,
} from './permissions';
import Geolocation from 'react-native-geolocation-service';
import Geocoder from 'react-native-geocoding';
import {GeoPoint} from 'firebase/firestore';
import {getGoogleMapsAPIKey} from '../api/env';
import { Alert } from 'react-native';

const getLocation = async (): Promise<Geolocation.GeoPosition | null> => {
  try {
    const result = await requestLocationPermission();

    if (result) {
      return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          position => {
            resolve(position);
          },
          error => {
            console.log(error.code, error.message);
            reject(error);
          },
          {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
        );
      });
    } else {
      return null;
    }
  } catch (error) {
    console.log('Error getting location:', error);
    return null;
  }
};

export const getCityName = async (): Promise<string | null> => {
  try {
    const apiKey = getGoogleMapsAPIKey();
    if (apiKey) {
      Geocoder.init(apiKey);
      const location = await getLocation();
      if (location) {
        const { latitude, longitude } = location.coords;
        const result = await Geocoder.from(latitude, longitude);

        // Iterate through the results and find the city name
        for (const resultItem of result.results) {
          const cityNameComponent = resultItem.address_components.find((c) =>
            c.types.includes("locality")
          );
          if (cityNameComponent) {
            return cityNameComponent.long_name;
          }
        }

        return null;
      }
    }
    return null;
  } catch (error) {
    console.log('Error getting city name:', error);
    return null;
  }
};

// Helper function to calculate the geo bounds
export const getGeoBounds = (center: GeoPoint, radiusInM: number) => {
  const earthRadius = 6371008.8; // Earth's radius in meters
  const latDelta = radiusInM / earthRadius;
  const lngDelta = Math.asin(
    Math.sin(latDelta) / Math.cos((center.latitude * Math.PI) / 180),
  );

  const swLat = center.latitude - (latDelta * 180) / Math.PI;
  const swLng = center.longitude - (lngDelta * 180) / Math.PI;
  const neLat = center.latitude + (latDelta * 180) / Math.PI;
  const neLng = center.longitude + (lngDelta * 180) / Math.PI;

  return {
    sw: new GeoPoint(swLat, swLng),
    ne: new GeoPoint(neLat, neLng),
  };
};

// Helper function to calculate distance between two coordinates using Haversine formula
// Haversine formula: https://en.wikipedia.org/wiki/Haversine_formula
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  try {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  } catch (error) {
    console.debug(error);
    return 0;
  }
};

export const deg2rad = (deg: number) => {
  return deg * (Math.PI / 180);
};

export default getLocation;
