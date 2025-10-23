import AsyncStorage from '@react-native-async-storage/async-storage';

const PRINTER_CONFIG_KEY = '@printer_config';
const PRINT_HISTORY_KEY = '@print_history';

export interface PrinterConfig {
  host: string;
  port: number;
}

export interface PrintHistoryItem {
  id: string;
  text: string;
  type: 'simple' | 'escpos';
  timestamp: Date;
  success: boolean;
  message: string;
}

export const storageService = {
  async savePrinterConfig(config: PrinterConfig): Promise<void> {
    try {
      await AsyncStorage.setItem(PRINTER_CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save printer config:', error);
      throw error;
    }
  },

  async getPrinterConfig(): Promise<PrinterConfig | null> {
    try {
      const config = await AsyncStorage.getItem(PRINTER_CONFIG_KEY);
      return config ? JSON.parse(config) : null;
    } catch (error) {
      console.error('Failed to get printer config:', error);
      return null;
    }
  },

  async addPrintHistory(item: Omit<PrintHistoryItem, 'id' | 'timestamp'>): Promise<void> {
    try {
      const history = await this.getPrintHistory();
      const newItem: PrintHistoryItem = {
        ...item,
        id: Date.now().toString(),
        timestamp: new Date(),
      };

      const updatedHistory = [newItem, ...history].slice(0, 50);
      await AsyncStorage.setItem(PRINT_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to add print history:', error);
    }
  },

  async getPrintHistory(): Promise<PrintHistoryItem[]> {
    try {
      const history = await AsyncStorage.getItem(PRINT_HISTORY_KEY);
      if (!history) return [];

      const parsed = JSON.parse(history);
      return parsed.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }));
    } catch (error) {
      console.error('Failed to get print history:', error);
      return [];
    }
  },

  async clearPrintHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem(PRINT_HISTORY_KEY, JSON.stringify([]));
    } catch (error) {
      console.error('Failed to clear print history:', error);
      throw error;
    }
  },
};
