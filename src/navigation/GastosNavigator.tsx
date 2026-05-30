import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GastosStackParamList } from '../types/navigation';
import { GastosScreen } from '../screens/gastos/GastosScreen';
import { NewExpenseScreen } from '../screens/gastos/NewExpenseScreen';
import { EditExpenseScreen } from '../screens/gastos/EditExpenseScreen';

const Stack = createNativeStackNavigator<GastosStackParamList>();

export function GastosNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GastosMain" component={GastosScreen} />
      <Stack.Screen name="NewExpense" component={NewExpenseScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="EditExpense" component={EditExpenseScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
