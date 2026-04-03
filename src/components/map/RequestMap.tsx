import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import type { Coordinates } from '@/lib/types';
import { Colors } from '@/lib/constants';

interface RequestMapProps {
    requesterLocation: Coordinates;
    helperLocation?: Coordinates;
    showRadius?: boolean;
    radiusMeters?: number;
}

export function RequestMap({
    requesterLocation,
    helperLocation,
    showRadius = false,
    radiusMeters = 500,
}: RequestMapProps) {
    return (
        <MapView
            style={styles.map}
            initialRegion={{
                latitude: requesterLocation.latitude,
                longitude: requesterLocation.longitude,
                latitudeDelta: 0.008,
                longitudeDelta: 0.008,
            }}
            showsUserLocation={false}
            mapType="standard"
        >
            {/* Requester marker */}
            <Marker
                coordinate={requesterLocation}
                title="Requester"
                pinColor={Colors.primary}
            />

            {/* Helper marker */}
            {helperLocation && (
                <Marker
                    coordinate={helperLocation}
                    title="Helper"
                    pinColor={Colors.success}
                />
            )}

            {/* 500m radius circle */}
            {showRadius && (
                <Circle
                    center={requesterLocation}
                    radius={radiusMeters}
                    fillColor={`${Colors.primary}15`}
                    strokeColor={`${Colors.primary}55`}
                    strokeWidth={1.5}
                />
            )}
        </MapView>
    );
}

const styles = StyleSheet.create({
    map: { flex: 1 },
});
