import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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
      <View style={styles.logoBadge}>
        <MaterialCommunityIcons name="car-outline" size={34} color={colors.white} />
      </View>
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
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  logo: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  slogan: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
  },
  loader: {
    marginTop: 48,
  },
});
