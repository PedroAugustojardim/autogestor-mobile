import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { AuthNavigator } from './AuthNavigator';
import { TabNavigator } from './TabNavigator';
import { useAuthStore } from '../store/authStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        {isAuthenticated
          ? <Stack.Screen name="App" component={TabNavigator} />
          : <Stack.Screen name="Auth" component={AuthNavigator} />
        }
      </Stack.Navigator>
    </NavigationContainer>
  );
}
