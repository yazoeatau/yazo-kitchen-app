import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import Constant from '../apis/constants';
import { handleTestPrint } from '../hepler/general';
import Loader from '../hepler/loader';
import { Toaster } from '../hepler/toaster';
import printerService from '../services/printerService';
import { storageService } from '../utils/storage';

interface restaurantData {
  [key: string]: string;
}

interface Printer {
  id: string;
  name: string;
  ipAddress: string;
  host: string;
  port: number;
}

const PosScreen = () => {
  const [loading, setLoading] = useState(true);
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState(9100);
  const [restaurantData, setRestaurantData] = useState<restaurantData>({});
  const [selectedPrinter, setSelectedPrinter] = useState<Printer[]>([]);
  const [loader, setLoader] = useState(false);
  const webviewRef = useRef<WebView>(null);


  const loadSavedConfig = async () => {
    const config = await storageService.getPrinterConfig();
    if (config) {
      setIpAddress(config.host);
      setPort(config.port.toString());
    }
  };


  const handleConnect = async () => {
    const portNum = parseInt(port, 10);
    if (!ipAddress || isNaN(portNum)) return;
    const config = { host: ipAddress, port: portNum };
    await storageService.savePrinterConfig(config);
    printerService.connect(config);
  };


  useEffect(() => {
    loadSavedConfig();
    printerService.setStatusCallback((status) => {
      if (status.isConnected) {
        new Toaster().success('Printer Connected');
      }
    });
    const timer = setTimeout(handleConnect, 2000);
    return () => clearTimeout(timer);
  }, [ipAddress]);


  const getLocalStorage = () => {
    webviewRef.current?.injectJavaScript(`
    (function() {
      const data = {
        restaurantId: localStorage.getItem('restaurantId'),
        yazo_auth_token: localStorage.getItem('yazo_auth_token')
      };
      window.ReactNativeWebView.postMessage(JSON.stringify({ localStorage: data }));
    })();
    true;
  `);
  };


  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.localStorage) {
        setRestaurantData(data.localStorage);
      }
      if (data?.status === 'success' && data?.order) {
        await handleTestPrint(data.order);
      }
    } catch (err) {
      console.error('Invalid JSON from WebView', err);
    }
  };


  useEffect(() => {
    getPrinterListing()
  }, [restaurantData?.restaurantId])

  const removeQuotes = (str: string): string => {
    if (!str) return '';
    return str.replace(/^"|"$/g, '');
  };

  const getPrinterListing = async () => {
    if (!restaurantData?.restaurantId) {
      console.warn("Restaurant ID not available");
      return;
    }
    setLoader(true);
    try {
      const restaurantId = removeQuotes(restaurantData.restaurantId)
      const response = await fetch(`${Constant.host}pos/printer-list?restaurantId=${restaurantId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${restaurantData?.yazo_auth_token || ''}`,
        }
      });
      const result = await response.json();
      if (result?.status) {
        let list = result?.data ? result?.data : [];
        const activePrinter = list.find(p => p.status === "true");
        if (activePrinter) {
          setIpAddress(activePrinter?.ipAddress ? activePrinter?.ipAddress : "")
          const config = { host: activePrinter?.ipAddress, port: port };
          await storageService.savePrinterConfig(config);
          setSelectedPrinter(activePrinter);
        }
      } else {
        console.warn("No printers found");
      }
    } catch (error) {
      console.error("Failed to fetch printer listing:", error);
    } finally {
      setLoader(false);
    }
  };

  console.log(selectedPrinter, "-----selectedPrinter---");

  console.log(restaurantData, "---restaurantData");

  console.log(ipAddress, "----ipAddress");


  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        source={{ uri: 'https://pos.yazoeat.com.au/' }}
        injectedJavaScriptBeforeContentLoaded={`true`}
        onLoadEnd={() => {
          setLoading(false);
          setTimeout(getLocalStorage, 1000); // delay to ensure page sets localStorage
        }}
        domStorageEnabled
        originWhitelist={['*']}
        allowUniversalAccessFromFileURLs
        mixedContentMode="always"
        bounces={false}
        useWebView2
        cacheEnabled={false}
        javaScriptEnabled
        style={styles.webview}
        onMessage={handleMessage}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.log('WebView Error', nativeEvent?.description || 'Unknown error');
        }}
        onReceivedSslError={(event) => {
          console.log('SSL error:', event.nativeEvent);
        }}
      />
      <Loader visible={loading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
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
