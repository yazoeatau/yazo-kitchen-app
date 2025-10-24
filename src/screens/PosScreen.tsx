// PosScreen.tsx
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { handleTestPrint } from '../hepler/general';
import Loader from '../hepler/loader';
import { Toaster } from '../hepler/toaster';
import printerService from '../services/printerService';
import { storageService } from '../utils/storage';

const PosScreen: React.FC = () => {

  const [loading, setLoading] = useState<boolean>(true);
  const [ipAddress, setIpAddress] = useState('192.168.0.39');
  const [port, setPort] = useState('9100');
  const [isConnected, setIsConnected] = useState(false);

  const loadSavedConfig = async () => {
    const config = await storageService.getPrinterConfig();
    if (config) {
      setIpAddress(config.host);
      setPort(config.port.toString());
    }
  };


  useEffect(() => {
    loadSavedConfig();
    printerService.setStatusCallback((status) => {
      setIsConnected(status.isConnected);
    });
  }, []);


  useEffect(() => {
    setTimeout(() => {
      handleConnect()
    }, 2000)
  }, []);


  const handleConnect = async () => {
    const portNum = parseInt(port, 10);
    if (!ipAddress || isNaN(portNum)) {
      return;
    }
    const config = { host: ipAddress, port: portNum };
    await storageService.savePrinterConfig(config);
    printerService.connect(config);
  };


  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.status === 'success') {
        let order = data?.order;
        console.log(order, "----order");
        if (order) {
          await handleTestPrint(order);
        }
      } else {
        console.log("Webview error");
      }
    } catch (err) {
      console.error('Invalid JSON from WebView', err);
    }
  };


  useEffect(() => {
    setTimeout(() => {
      if (isConnected) {
        new Toaster().success("Printer Connected");
      } else {
        new Toaster().error("Printer Disconnected");
      }
    }, 5000)
  }, [isConnected])


  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: 'https://pos.yazoeat.com.au/' }}
        onLoadEnd={() => setLoading(false)}
        domStorageEnabled={true}
        originWhitelist={['*']}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode='always'
        bounces={false}
        useWebView2={true}
        cacheEnabled={false}
        javaScriptEnabled={true}
        style={styles.webview}
        onMessage={handleMessage}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          Alert.alert("WebView Error", `Error: ${nativeEvent?.description || "Unknown error"}`)
        }}
        onReceivedSslError={(event) => {
          console.log("SSL error: ", event.nativeEvent);
        }}
      />
      <Loader visible={loading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
});

export default PosScreen;
