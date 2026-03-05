import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as NetInfo from '@react-native-community/netinfo';
import { useNearbyConnections, VictimMessage } from '@/hooks/useNearbyConnections';

export default function VictimScreen() {
  const [message, setMessage] = useState('');
  const [hasInternet, setHasInternet] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentMessages, setSentMessages] = useState<VictimMessage[]>([]);
  
  const {
    isConnected,
    isDiscovering,
    discoveredEndpoints,
    startDiscovery,
    broadcastMessage,
    disconnect,
    setRole,
  } = useNearbyConnections();

  useEffect(() => {
    setRole('victim');
    checkInternet();
    
    const unsubscribe = NetInfo.addEventListener((state: NetInfo.NetInfoState) => {
      setHasInternet(!!state.isConnected);
    });

    startDiscovery();

    return () => {
      unsubscribe();
      disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkInternet = async () => {
    const state = await NetInfo.fetch();
    setHasInternet(!!state.isConnected);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    setIsSending(true);

    try {
      if (hasInternet) {
        await sendDirectToRescue(message);
        Alert.alert('Success', 'Message sent directly to rescue team via internet!');
      } else if (isConnected || discoveredEndpoints.length > 0) {
        await broadcastMessage(message);
        Alert.alert('Success', 'Message broadcast via mesh network!');
      } else {
        Alert.alert('No Connection', 'No internet or nearby devices found. Please wait for a connection.');
      }
      
      setSentMessages(prev => [...prev, {
        senderId: 'self',
        message: message,
        role: 'victim',
        timestamp: Date.now(),
        hopCount: 0,
        path: [],
      }]);
      setMessage('');
    } catch {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const sendDirectToRescue = async (msg: string) => {
    // TODO: Replace with actual API call when backend is ready
    console.log('Sending directly to rescue team API:', msg);
    // Simulating API call
    return new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Victim Mode</Text>
        <View style={[styles.statusBadge, hasInternet ? styles.onlineBadge : styles.offlineBadge]}>
          <Text style={styles.statusText}>
            {hasInternet ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      <View style={styles.connectionStatus}>
        <Text style={styles.connectionLabel}>Connection Status:</Text>
        <View style={styles.connectionInfo}>
          {isDiscovering ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : null}
          <Text style={styles.connectionText}>
            {isConnected 
              ? `Connected to ${discoveredEndpoints.length} device(s)`
              : discoveredEndpoints.length > 0 
                ? `Found ${discoveredEndpoints.length} nearby device(s)`
                : 'Searching for nearby devices...'
            }
          </Text>
        </View>
      </View>

      {discoveredEndpoints.length > 0 && (
        <View style={styles.devicesSection}>
          <Text style={styles.sectionTitle}>Nearby Devices:</Text>
          {discoveredEndpoints.map((endpoint, index) => (
            <View key={index} style={styles.deviceItem}>
              <Text style={styles.deviceName}>{endpoint.name}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.messageSection}>
        <Text style={styles.sectionTitle}>Send Emergency Message:</Text>
        <TextInput
          style={styles.input}
          placeholder="Describe your emergency situation..."
          placeholderTextColor="#999"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        
        <TouchableOpacity 
          style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={isSending}
        >
          {isSending ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.sendButtonText}>
              {hasInternet 
                ? 'Send Directly to Rescue Team' 
                : 'Broadcast via Mesh Network'
              }
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {sentMessages.length > 0 && (
        <View style={styles.sentSection}>
          <Text style={styles.sectionTitle}>Your Sent Messages:</Text>
          {sentMessages.map((msg, index) => (
            <View key={index} style={styles.sentMessage}>
              <Text style={styles.sentMessageText}>{msg.message}</Text>
              <Text style={styles.sentTime}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  onlineBadge: {
    backgroundColor: '#4CAF50',
  },
  offlineBadge: {
    backgroundColor: '#F44336',
  },
  statusText: {
    color: '#FFF',
    fontWeight: '600',
  },
  connectionStatus: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  connectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  connectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectionText: {
    fontSize: 14,
    color: '#666',
  },
  devicesSection: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  deviceItem: {
    padding: 10,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    marginBottom: 8,
  },
  deviceName: {
    fontSize: 14,
    color: '#2E7D32',
  },
  messageSection: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 12,
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#FF5722',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sentSection: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  sentMessage: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  sentMessageText: {
    fontSize: 14,
    color: '#333',
  },
  sentTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});
