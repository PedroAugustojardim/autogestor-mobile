import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useAuthStore } from '../../store/authStore';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export function SplashScreen({ navigation }: Props) {
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    const check = async () => {
      const authenticated = await restoreSession();
      navigation.replace(authenticated ? 'App' : 'Auth');
    };
    check();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>AutoGestor</Text>
      <Text style={styles.slogan}>Gestão inteligente do seu veículo</Text>
      <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B5E20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  slogan: {
    fontSize: 16,
    color: '#A5D6A7',
    marginTop: 8,
  },
  loader: {
    marginTop: 48,
  },
});
