import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme/colors';

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
      <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  slogan: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  loader: {
    marginTop: 48,
  },
});
