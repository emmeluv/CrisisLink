import { useState, useEffect, useCallback } from 'react';
import { NativeModules, NativeEventEmitter, Platform, PermissionsAndroid, Alert } from 'react-native';

const { NearbyConnections } = NativeModules;

export interface VictimMessage {
  senderId: string;
  message: string;
  role: string;
  timestamp: number;
  hopCount: number;
  path: string[];
}

export interface DiscoveredEndpoint {
  endpointId: string;
  name: string;
}

export type DeviceRole = 'victim' | 'rescue';

interface NearbyConnectionsHook {
  isConnected: boolean;
  isAdvertising: boolean;
  isDiscovering: boolean;
  discoveredEndpoints: DiscoveredEndpoint[];
  receivedMessages: VictimMessage[];
  startAdvertising: () => Promise<void>;
  stopAdvertising: () => Promise<void>;
  startDiscovery: () => Promise<void>;
  stopDiscovery: () => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  broadcastMessage: (message: string) => Promise<void>;
  disconnect: () => Promise<void>;
  setRole: (role: DeviceRole) => Promise<void>;
  refreshMessages: () => Promise<void>;
}

export function useNearbyConnections(): NearbyConnectionsHook {
  const [isConnected, setIsConnected] = useState(false);
  const [isAdvertising, setIsAdvertising] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredEndpoints, setDiscoveredEndpoints] = useState<DiscoveredEndpoint[]>([]);
  const [receivedMessages, setReceivedMessages] = useState<VictimMessage[]>([]);

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(NearbyConnections);
    
    const connectedSubscription = eventEmitter.addListener('onDeviceConnected', () => {
      setIsConnected(true);
    });
    
    const disconnectedSubscription = eventEmitter.addListener('onDeviceDiscovered', () => {
      setIsConnected(false);
    });
    
    const endpointFoundSubscription = eventEmitter.addListener('onEndpointFound', (endpoint: DiscoveredEndpoint) => {
      setDiscoveredEndpoints(prev => [...prev, endpoint]);
    });
    
    const endpointLostSubscription = eventEmitter.addListener('onEndpointLost', (endpoint: { endpointId: string }) => {
      setDiscoveredEndpoints(prev => prev.filter(e => e.endpointId !== endpoint.endpointId));
    });
    
    const messageReceivedSubscription = eventEmitter.addListener('onMessageReceived', (message: VictimMessage) => {
      setReceivedMessages(prev => [...prev, message]);
    });

    return () => {
      connectedSubscription.remove();
      disconnectedSubscription.remove();
      endpointFoundSubscription.remove();
      endpointLostSubscription.remove();
      messageReceivedSubscription.remove();
    };
  }, []);

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;

    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES,
      ];

      const granted = await PermissionsAndroid.requestMultiple(permissions);
      
      return Object.values(granted).every(
        status => status === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (err) {
      console.warn('Permission request error:', err);
      return false;
    }
  };

  const startAdvertising = useCallback(async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Please grant all permissions to use this feature');
      return;
    }
    
    try {
      await NearbyConnections.startAdvertising();
      setIsAdvertising(true);
    } catch (error) {
      console.error('Failed to start advertising:', error);
    }
  }, []);

  const stopAdvertising = useCallback(async () => {
    try {
      await NearbyConnections.stopAdvertising();
      setIsAdvertising(false);
    } catch (error) {
      console.error('Failed to stop advertising:', error);
    }
  }, []);

  const startDiscovery = useCallback(async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Please grant all permissions to use this feature');
      return;
    }
    
    try {
      await NearbyConnections.startDiscovery();
      setIsDiscovering(true);
    } catch (error) {
      console.error('Failed to start discovery:', error);
    }
  }, []);

  const stopDiscovery = useCallback(async () => {
    try {
      await NearbyConnections.stopDiscovery();
      setIsDiscovering(false);
    } catch (error) {
      console.error('Failed to stop discovery:', error);
    }
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    try {
      await NearbyConnections.sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, []);

  const broadcastMessage = useCallback(async (message: string) => {
    try {
      await NearbyConnections.broadcastMessage(message);
    } catch (error) {
      console.error('Failed to broadcast message:', error);
      throw error;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await NearbyConnections.disconnect();
      setIsConnected(false);
      setDiscoveredEndpoints([]);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  }, []);

  const setRole = useCallback(async (role: DeviceRole) => {
    try {
      await NearbyConnections.setRole(role);
    } catch (error) {
      console.error('Failed to set role:', error);
    }
  }, []);

  const refreshMessages = useCallback(async () => {
    try {
      const messages = await NearbyConnections.getReceivedMessages();
      setReceivedMessages(messages);
    } catch (error) {
      console.error('Failed to refresh messages:', error);
    }
  }, []);

  return {
    isConnected,
    isAdvertising,
    isDiscovering,
    discoveredEndpoints,
    receivedMessages,
    startAdvertising,
    stopAdvertising,
    startDiscovery,
    stopDiscovery,
    sendMessage,
    broadcastMessage,
    disconnect,
    setRole,
    refreshMessages,
  };
}
