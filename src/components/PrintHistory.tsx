import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { CheckCircle, XCircle, Trash2 } from 'lucide-react-native';
import { PrintHistoryItem } from '../utils/storage';

interface PrintHistoryProps {
  history: PrintHistoryItem[];
  onClear: () => void;
}

export const PrintHistory: React.FC<PrintHistoryProps> = ({ history, onClear }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderItem = ({ item }: { item: PrintHistoryItem }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <View style={styles.statusRow}>
          {item.success ? (
            <CheckCircle size={16} color="#22c55e" />
          ) : (
            <XCircle size={16} color="#ef4444" />
          )}
          <Text style={[styles.typeText, item.success ? styles.successText : styles.errorText]}>
            {item.type === 'escpos' ? 'ESC/POS' : 'Simple Text'}
          </Text>
        </View>
        <Text style={styles.timeText}>
          {formatDate(item.timestamp)} {formatTime(item.timestamp)}
        </Text>
      </View>
      <Text style={styles.printText} numberOfLines={2}>
        {item.text}
      </Text>
      <Text style={styles.messageText} numberOfLines={1}>
        {item.message}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Print History</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={onClear} style={styles.clearButton}>
            <Trash2 size={18} color="#ef4444" />
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No print history yet</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clearText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  historyItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  successText: {
    color: '#22c55e',
  },
  errorText: {
    color: '#ef4444',
  },
  timeText: {
    fontSize: 11,
    color: '#64748b',
  },
  printText: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 6,
    fontWeight: '500',
  },
  messageText: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
  },
});
