import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Wifi, WifiOff, Printer, Send } from 'lucide-react-native';
import printerService, { ConnectionStatus } from '../services/printerService';
import { storageService, PrintHistoryItem } from '../utils/storage';
import { PrintHistory } from '../components/PrintHistory';

export default function HomeScreen() {
  const [ipAddress, setIpAddress] = useState('192.168.1.4');
  const [port, setPort] = useState('9100');
  const [isConnected, setIsConnected] = useState(false);
  const [statusMessages, setStatusMessages] = useState<ConnectionStatus[]>([]);
  const [useESCPOS, setUseESCPOS] = useState(false);
  const [printHistory, setPrintHistory] = useState<PrintHistoryItem[]>([]);

  useEffect(() => {
    loadSavedConfig();
    loadPrintHistory();

    printerService.setStatusCallback((status) => {
      setIsConnected(status.isConnected);
      setStatusMessages((prev) => [status, ...prev].slice(0, 20));
    });

    return () => {
      printerService.disconnect();
    };
  }, []);

  const loadSavedConfig = async () => {
    const config = await storageService.getPrinterConfig();
    if (config) {
      setIpAddress(config.host);
      setPort(config.port.toString());
    }
  };

  const loadPrintHistory = async () => {
    const history = await storageService.getPrintHistory();
    setPrintHistory(history);
  };

  const handleConnect = async () => {
    const portNum = parseInt(port, 10);
    if (!ipAddress || isNaN(portNum)) {
      setStatusMessages((prev) => [
        {
          isConnected: false,
          message: 'Please enter valid IP address and port',
          timestamp: new Date(),
        },
        ...prev,
      ]);
      return;
    }

    const config = { host: ipAddress, port: portNum };
    await storageService.savePrinterConfig(config);
    printerService.connect(config);
  };

  const handleDisconnect = () => {
    printerService.disconnect();
  };

  const handleTestPrint = async () => {
    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const testText = `Yazo Pos  tyntynty tyn ty ntyn ty nt nty n- ${timestamp}`;

    const result = useESCPOS
      ? await printerService.printESCPOS(testText)
      : await printerService.printSimpleText(testText);

    await storageService.addPrintHistory({
      text: testText,
      type: useESCPOS ? 'escpos' : 'simple',
      success: result.success,
      message: result.message,
    });

    loadPrintHistory();
  };

  const handleClearHistory = async () => {
    await storageService.clearPrintHistory();
    loadPrintHistory();
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Printer size={28} color="#1e293b" />
            <Text style={styles.title}>Printer Connection</Text>
          </View>
          <View style={[styles.statusBadge, isConnected ? styles.connectedBadge : styles.disconnectedBadge]}>
            {isConnected ? <Wifi size={16} color="#22c55e" /> : <WifiOff size={16} color="#94a3b8" />}
            <Text style={[styles.statusText, isConnected ? styles.connectedText : styles.disconnectedText]}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>

        <View style={styles.configSection}>
          <Text style={styles.sectionTitle}>Printer Configuration</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>IP Address</Text>
            <TextInput
              style={styles.input}
              value={ipAddress}
              onChangeText={setIpAddress}
              placeholder="192.168.1.100"
              keyboardType="numeric"
              editable={!isConnected}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Port</Text>
            <TextInput
              style={styles.input}
              value={port}
              onChangeText={setPort}
              placeholder="9100"
              keyboardType="numeric"
              editable={!isConnected}
            />
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>ESC/POS Commands</Text>
              <Text style={styles.switchDescription}>
                {useESCPOS ? 'Using formatted ESC/POS' : 'Using simple text'}
              </Text>
            </View>
            <Switch
              value={useESCPOS}
              onValueChange={setUseESCPOS}
              trackColor={{ false: '#cbd5e1', true: '#3b82f6' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.buttonRow}>
            {!isConnected ? (
              <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
                <Wifi size={20} color="#fff" />
                <Text style={styles.buttonText}>Connect</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
                  <WifiOff size={20} color="#fff" />
                  <Text style={styles.buttonText}>Disconnect</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.printButton} onPress={handleTestPrint}>
                  <Send size={20} color="#fff" />
                  <Text style={styles.buttonText}>Test Print</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Status Messages</Text>
          <View style={styles.statusMessagesContainer}>
            {statusMessages.length === 0 ? (
              <Text style={styles.noMessages}>No status messages yet</Text>
            ) : (
              statusMessages.map((status, index) => (
                <View key={index} style={styles.statusMessage}>
                  <View style={styles.statusMessageHeader}>
                    {status.isConnected ? (
                      <View style={styles.statusDot} />
                    ) : (
                      <View style={[styles.statusDot, styles.errorDot]} />
                    )}
                    <Text style={styles.statusTimestamp}>{formatTimestamp(status.timestamp)}</Text>
                  </View>
                  <Text style={styles.statusMessageText}>{status.message}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* <View style={styles.historyContainer}>
        <PrintHistory history={printHistory} onClear={handleClearHistory} />
      </View> */}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  connectedBadge: {
    backgroundColor: '#dcfce7',
  },
  disconnectedBadge: {
    backgroundColor: '#f1f5f9',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  connectedText: {
    color: '#22c55e',
  },
  disconnectedText: {
    color: '#64748b',
  },
  configSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 8,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  switchDescription: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  connectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
  },
  disconnectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#64748b',
    padding: 16,
    borderRadius: 8,
  },
  printButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusMessagesContainer: {
    maxHeight: 200,
  },
  noMessages: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 20,
  },
  statusMessage: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  statusMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  errorDot: {
    backgroundColor: '#64748b',
  },
  statusTimestamp: {
    fontSize: 12,
    color: '#64748b',
  },
  statusMessageText: {
    fontSize: 14,
    color: '#334155',
    paddingLeft: 16,
  },
  historyContainer: {
    flex: 1,
    maxHeight: 300,
  },
});
