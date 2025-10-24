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


  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.restaurantData) {
        setRestaurantData(data.restaurantData);
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
  }, [restaurantData?._id])


  const removeQuotes = (str: string): string => {
    if (!str) return '';
    return str.replace(/^"|"$/g, '');
  };

  
  const getPrinterListing = async () => {
    if (!restaurantData?._id) {
      console.warn("Restaurant ID not available");
      return;
    }
    setLoader(true);
    try {
      const _id = removeQuotes(restaurantData._id)
      const response = await fetch(`${Constant.host}pos/printer-list?restaurantId=${_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${restaurantData?.yazo_auth_token || ''}`,
        }
      });
      const result = await response.json();
      if (result?.status) {
        let list = result?.data ? result?.data : [];
        console.log(list);
        
        const activePrinter = list.find(p => p.selected);
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


  console.log(ipAddress, "----ipAddress");



  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        source={{ uri: 'https://pos.yazoeat.com.au/' }}
        injectedJavaScriptBeforeContentLoaded={`true`}
        onLoadEnd={() => { setLoading(false) }}
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
