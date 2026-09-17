import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ManutencaoStackParamList } from '../types/navigation';
import { ManutencaoScreen } from '../screens/manutencao/ManutencaoScreen';
import { NewMaintenanceScreen } from '../screens/manutencao/NewMaintenanceScreen';

const Stack = createNativeStackNavigator<ManutencaoStackParamList>();

export function ManutencaoNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ManutencaoMain" component={ManutencaoScreen} />
      <Stack.Screen name="NewMaintenance" component={NewMaintenanceScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
