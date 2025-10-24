import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import PosScreen from './src/screens/PosScreen';

export type RootStackParamList = {
  Home: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
            <Stack.Screen
              name="Home"
              component={PosScreen}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
      <Toast config={toastConfig} />
    </GestureHandlerRootView>
  );
};

export default App;
