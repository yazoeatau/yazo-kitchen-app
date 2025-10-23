import TcpSocket from 'react-native-tcp-socket';

export interface PrinterConfig {
  host: string;
  port: number;
}

export interface ConnectionStatus {
  isConnected: boolean;
  message: string;
  timestamp: Date;
}

export type StatusCallback = (status: ConnectionStatus) => void;

class PrinterService {
  private client: any = null;
  private config: PrinterConfig | null = null;
  private statusCallback: StatusCallback | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private isReconnecting = false;
  private shouldStayConnected = false;

  setStatusCallback(callback: StatusCallback) {
    this.statusCallback = callback;
  }

  private updateStatus(isConnected: boolean, message: string) {
    const status: ConnectionStatus = {
      isConnected,
      message,
      timestamp: new Date(),
    };
    if (this.statusCallback) {
      this.statusCallback(status);
    }
  }

  connect(config: PrinterConfig) {
    this.config = config;
    this.shouldStayConnected = true;
    this.updateStatus(false, `Connecting to ${config.host}:${config.port}...`);

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }

    this.connectionTimeout = setTimeout(() => {
      if (!this.client || this.client.readyState !== 'open') {
        this.updateStatus(false, 'Connection timeout (10s exceeded)');
        this.cleanup();
        if (this.shouldStayConnected) {
          this.scheduleReconnect();
        }
      }
    }, 10000);

    try {
      const options = {
        host: config.host,
        port: config.port,
      };

      this.client = TcpSocket.createConnection(options, () => {
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
        }
        this.updateStatus(true, `Connected successfully to ${config.host}:${config.port}`);
        this.isReconnecting = false;
      });

      this.client.on('data', (data: any) => {
        this.updateStatus(true, `Received data from printer: ${data.toString()}`);
      });

      this.client.on('error', (error: Error) => {
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
        }
        this.updateStatus(false, `Connection error: ${error.message}`);
        this.cleanup();
        if (this.shouldStayConnected) {
          this.scheduleReconnect();
        }
      });

      this.client.on('close', () => {
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
        }
        this.updateStatus(false, 'Connection closed');
        this.cleanup();
        if (this.shouldStayConnected && !this.isReconnecting) {
          this.scheduleReconnect();
        }
      });
    } catch (error: any) {
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
      }
      this.updateStatus(false, `Failed to create connection: ${error.message}`);
      if (this.shouldStayConnected) {
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (!this.config || !this.shouldStayConnected) {
      return;
    }

    this.isReconnecting = true;
    this.updateStatus(false, 'Reconnecting in 3 seconds...');

    this.reconnectTimeout = setTimeout(() => {
      if (this.config && this.shouldStayConnected) {
        this.connect(this.config);
      }
    }, 3000);
  }

  private cleanup() {
    if (this.client) {
      try {
        this.client.destroy();
      } catch (error) {
      }
      this.client = null;
    }
  }

  disconnect() {
    this.shouldStayConnected = false;
    this.isReconnecting = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    this.cleanup();
    this.updateStatus(false, 'Disconnected by user');
  }

  getESCPOSCommands(text: string): string {
    const ESC = '\x1B';
    const GS = '\x1D';

    let commands = '';
    commands += ESC + '@';
    commands += ESC + 'a' + '\x01';
    commands += ESC + '!' + '\x10';
    commands += text + '\n';
    commands += '\n\n';
    commands += GS + 'V' + '\x41' + '\x03';

    return commands;
  }

  async printSimpleText(text: string): Promise<{ success: boolean; message: string }> {
    if (!this.client || this.client.readyState !== 'open') {
      return { success: false, message: 'Printer not connected' };
    }

    try {
      const printData = text + '\n';
      this.client.write(printData);
      this.updateStatus(true, `Printed simple text: "${text}"`);
      return { success: true, message: 'Print job sent successfully' };
    } catch (error: any) {
      const errorMsg = `Print failed: ${error.message}`;
      this.updateStatus(true, errorMsg);
      return { success: false, message: errorMsg };
    }
  }

  async printESCPOS(text: string): Promise<{ success: boolean; message: string }> {
    if (!this.client || this.client.readyState !== 'open') {
      return { success: false, message: 'Printer not connected' };
    }

    try {
      const escposCommands = this.getESCPOSCommands(text);
      this.client.write(escposCommands);
      this.updateStatus(true, `Printed ESC/POS formatted: "${text}"`);
      return { success: true, message: 'ESC/POS print job sent successfully' };
    } catch (error: any) {
      const errorMsg = `Print failed: ${error.message}`;
      this.updateStatus(true, errorMsg);
      return { success: false, message: errorMsg };
    }
  }

  isConnected(): boolean {
    return this.client !== null && this.client.readyState === 'open';
  }
}

export default new PrinterService();
