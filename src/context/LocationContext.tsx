import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as Location from 'expo-location';
import type { Coordinates } from '@/lib/types';

interface LocationContextType {
    location: Coordinates | null;
    permissionStatus: Location.PermissionStatus | null;
    requestPermission: () => Promise<boolean>;
    loading: boolean;
}

const LocationContext = createContext<LocationContextType>({
    location: null,
    permissionStatus: null,
    requestPermission: async () => false,
    loading: true,
});

export function LocationProvider({ children }: { children: React.ReactNode }) {
    const [location, setLocation] = useState<Coordinates | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const watchRef = useRef<Location.LocationSubscription | null>(null);

    const requestPermission = async (): Promise<boolean> => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setPermissionStatus(status);
        return status === 'granted';
    };

    useEffect(() => {
        (async () => {
            // Check existing permission
            const { status } = await Location.getForegroundPermissionsAsync();
            setPermissionStatus(status);

            if (status === 'granted') {
                // Get initial position
                const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });

                // Watch position updates
                watchRef.current = await Location.watchPositionAsync(
                    { accuracy: Location.Accuracy.Balanced, distanceInterval: 10, timeInterval: 5000 },
                    (pos) => {
                        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
                    }
                );
            }
            setLoading(false);
        })();

        return () => {
            watchRef.current?.remove();
        };
    }, []);

    return (
        <LocationContext.Provider value={{ location, permissionStatus, requestPermission, loading }}>
            {children}
        </LocationContext.Provider>
    );
}

export const useLocation = () => useContext(LocationContext);
