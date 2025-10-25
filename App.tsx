import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { Easing, PermissionsAndroid, Platform, Vibration } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import PosScreen from './src/screens/PosScreen';
import SplashScreen from './src/screens/SplashScreen';
import messaging from '@react-native-firebase/messaging';
import {
  Notifier,
  NotifierComponents,
  NotifierWrapper
} from 'react-native-notifier';
import AsyncStorage from '@react-native-async-storage/async-storage';


export type RootStackParamList = {
  Home: undefined;
  Splash: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();


messaging().onMessage(async remoteMessage => {
  console.log(remoteMessage, '--remoteMessage')
  if (
    remoteMessage &&
    remoteMessage.notification &&
    remoteMessage.notification.body
  ) {
    await onDisplayNotification(remoteMessage)
  }
})

//For Background notification trigger------------------------------>
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log(remoteMessage, '--remoteMessage backgorud')
  // onDisplayNotification(remoteMessage)
})

export async function onDisplayNotification(item) {
  Notifier.showNotification({
    title: item?.notification?.title ? item.notification.title : '',
    duration: 3000,
    showAnimationDuration: 800,
    showEasing: Easing.bounce,
    onHidden: () => console.log('Hidden'),
    Component: NotifierComponents.Notification,
    componentProps: {
      description: item?.notification?.body ? item.notification.body : null,
      imageSource: require('./src/assets/images/icon.png'),
      titleStyle: { color: 'black', fontSize: 16, fontWeight: 'bold' }
    },
    hideOnPress: true,
    translucentStatusBar: true
  })
}



const App: React.FC = () => {


  const toastConfig = {
    success: (props: any) => (
      <BaseToast
        text1={props?.props?.text1}
        text1NumberOfLines={3}
        style={{
          backgroundColor: "#f5fff0ff",
          borderLeftColor: "#5ae802ff",
          marginTop: Platform.OS === "ios" ? 20 : 8,
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 16,
          color: '#000',
        }}
      />
    ),
    error: (props: any) => (
      <ErrorToast
        text1={props?.props?.text1}
        text1NumberOfLines={3}
        style={{
          backgroundColor: "#fff",
          borderLeftColor: 'red',
          marginTop: Platform.OS === "ios" ? 20 : 8,
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 16,
          color: '#000',
        }}
      />
    ),
  };



  useEffect(() => {
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log(remoteMessage, '--remoteMessage forground')
      // notify(remoteMessage);
    })
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        // notify(remoteMessage);
      })
    requestUserPermission()
    return () => { }
  }, [])

  useEffect(() => {
    getFcmToken()
    requestUserPermission()
  }, [])

  async function requestUserPermission() {
    if (Platform.OS === 'android') {
      const androidVersion = parseInt(Platform.Version, 10);
      if (androidVersion >= 33) {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission',
            message: 'This app needs permission to send you notifications.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          }
        );
        if (result === PermissionsAndroid.RESULTS.GRANTED) {
          await getFcmToken();
          return true;
        } else {
          return false;
        }
      } else {
        await getFcmToken();
        return true;
      }
    } else {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      if (enabled) {
        await getFcmToken();
        return true;
      } else {
        return false;
      }
    }
  };

  const getFcmToken = async () => {
    await messaging().registerDeviceForRemoteMessages()
    const fcmToken = await messaging().getToken()
    if (fcmToken) {
      await AsyncStorage.setItem('fcmToken', fcmToken)
      console.log('FCM TOKEN:', fcmToken)
    } else {
      console.log('Failed', 'No token received')
    }
  };


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NotifierWrapper>
        <SafeAreaProvider>
          <NavigationContainer>
            <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
              <Stack.Screen
                name="Splash"
                component={SplashScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Home"
                component={PosScreen}
                options={{ headerShown: false }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
        <Toast config={toastConfig} />
      </NotifierWrapper>
    </GestureHandlerRootView>
  );
};

export default App;
