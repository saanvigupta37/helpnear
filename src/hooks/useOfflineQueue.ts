import { useEffect, useRef, useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@/lib/supabase';

const QUEUE_KEY = 'helpnear:offline_queue';
const MAX_RETRIES = 3;

interface QueuedRequest {
    id: string;
    table: string;
    payload: Record<string, unknown>;
    retries: number;
    queuedAt: string;
}

export function useOfflineQueue() {
    const [isOnline, setIsOnline] = useState(true);
    const [queueLength, setQueueLength] = useState(0);
    const drainingRef = useRef(false);

    const readQueue = useCallback(async (): Promise<QueuedRequest[]> => {
        const raw = await AsyncStorage.getItem(QUEUE_KEY);
        return raw ? (JSON.parse(raw) as QueuedRequest[]) : [];
    }, []);

    const writeQueue = useCallback(async (items: QueuedRequest[]) => {
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));
        setQueueLength(items.length);
    }, []);

    // Add a failed insert to the offline queue
    const enqueue = useCallback(
        async (table: string, payload: Record<string, unknown>) => {
            const queue = await readQueue();
            const item: QueuedRequest = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                table,
                payload,
                retries: 0,
                queuedAt: new Date().toISOString(),
            };
            await writeQueue([...queue, item]);
        },
        [readQueue, writeQueue]
    );

    // Drain: attempt to send all queued items
    const drainQueue = useCallback(async () => {
        if (drainingRef.current) return;
        drainingRef.current = true;

        const queue = await readQueue();
        const remaining: QueuedRequest[] = [];

        for (const item of queue) {
            const { error } = await supabase.from(item.table).insert(item.payload);
            if (!error) {
                // Successfully sent — drop from queue
            } else if (item.retries < MAX_RETRIES) {
                remaining.push({ ...item, retries: item.retries + 1 });
            }
            // Drop items that exceeded max retries
        }

        await writeQueue(remaining);
        drainingRef.current = false;
    }, [readQueue, writeQueue]);

    // Listen for network changes
    useEffect(() => {
        readQueue().then((q) => setQueueLength(q.length));

        const unsubscribe = NetInfo.addEventListener((state) => {
            const online = state.isConnected === true && state.isInternetReachable !== false;
            setIsOnline(online);
            if (online) drainQueue();
        });

        return () => unsubscribe();
    }, [drainQueue, readQueue]);

    return { isOnline, queueLength, enqueue, drainQueue };
}
