import { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useNearbyConnections, VictimMessage } from '@/hooks/useNearbyConnections';

export default function RescueScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [victims, setVictims] = useState<VictimMessage[]>([]);
  
  const {
    isAdvertising,
    isConnected,
    receivedMessages,
    startAdvertising,
    stopAdvertising,
    refreshMessages,
    setRole,
    disconnect,
  } = useNearbyConnections();

  useEffect(() => {
    setRole('rescue');
    startAdvertising();

    return () => {
      stopAdvertising();
      disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setVictims(receivedMessages);
  }, [receivedMessages]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshMessages();
    setVictims(prev => [...prev, ...receivedMessages]);
    setRefreshing(false);
  }, [refreshMessages, receivedMessages]);

  const uniqueVictims = Array.from(
    new Map(victims.map(v => [v.senderId, v])).values()
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Rescue Team</Text>
        <View style={[styles.statusBadge, isAdvertising ? styles.activeBadge : styles.inactiveBadge]}>
          <Text style={styles.statusText}>
            {isAdvertising ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.connectionStatus}>
        <Text style={styles.connectionLabel}>Rescue Status:</Text>
        <View style={styles.connectionInfo}>
          <View style={[styles.statusDot, isConnected ? styles.connectedDot : styles.disconnectedDot]} />
          <Text style={styles.connectionText}>
            {isConnected 
              ? 'Receiving signals from victims' 
              : isAdvertising 
                ? 'Searching for victims...'
                : 'Not advertising'
            }
          </Text>
        </View>
      </View>

      <View style={styles.actionSection}>
        <TouchableOpacity 
          style={[styles.actionButton, isAdvertising && styles.actionButtonActive]}
          onPress={isAdvertising ? stopAdvertising : startAdvertising}
        >
          <Text style={styles.actionButtonText}>
            {isAdvertising ? 'Stop Finding Victims' : 'Start Finding Victims'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Text style={styles.refreshButtonText}>Refresh Signals</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.victimsSection}>
        <Text style={styles.sectionTitle}>
          Victims Found: {uniqueVictims.length}
        </Text>
        
        {uniqueVictims.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No victims found yet.{'\n'}
              Make sure you are advertising to receive signals.
            </Text>
          </View>
        ) : (
          uniqueVictims.map((victim, index) => (
            <View key={index} style={styles.victimCard}>
              <View style={styles.victimHeader}>
                <View style={styles.victimIcon}>
                  <Text style={styles.victimIconText}>!</Text>
                </View>
                <View style={styles.victimInfo}>
                  <Text style={styles.victimId}>
                    Victim #{victim.senderId.slice(0, 8)}
                  </Text>
                  <Text style={styles.victimTime}>
                    {new Date(victim.timestamp).toLocaleString()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.messageBox}>
                <Text style={styles.messageText}>{victim.message}</Text>
              </View>

              <View style={styles.victimFooter}>
                <View style={styles.hopInfo}>
                  <Text style={styles.hopLabel}>Hops:</Text>
                  <Text style={styles.hopCount}>{victim.hopCount}</Text>
                </View>
                {victim.path && victim.path.length > 0 && (
                  <View style={styles.pathInfo}>
                    <Text style={styles.pathLabel}>Via:</Text>
                    <Text style={styles.pathText}>
                      {victim.path.length} device(s)
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      {uniqueVictims.length > 0 && (
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Summary</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{uniqueVictims.length}</Text>
              <Text style={styles.statLabel}>Total Victims</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {victims.reduce((sum, v) => sum + v.hopCount, 0) / Math.max(victims.length, 1)}
              </Text>
              <Text style={styles.statLabel}>Avg Hops</Text>
            </View>
          </View>
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
  activeBadge: {
    backgroundColor: '#4CAF50',
  },
  inactiveBadge: {
    backgroundColor: '#9E9E9E',
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
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  connectedDot: {
    backgroundColor: '#4CAF50',
  },
  disconnectedDot: {
    backgroundColor: '#F44336',
  },
  connectionText: {
    fontSize: 14,
    color: '#666',
  },
  actionSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonActive: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#FF9800',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  victimsSection: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  victimCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  victimHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  victimIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  victimIconText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  victimInfo: {
    flex: 1,
  },
  victimId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  victimTime: {
    fontSize: 12,
    color: '#666',
  },
  messageBox: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  victimFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hopLabel: {
    fontSize: 12,
    color: '#666',
  },
  hopCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  pathInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pathLabel: {
    fontSize: 12,
    color: '#666',
  },
  pathText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  statsSection: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
});
