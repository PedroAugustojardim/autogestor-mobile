import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PerfilScreen } from '../screens/perfil/PerfilScreen';
import { EditarNomeScreen } from '../screens/perfil/EditarNomeScreen';
import { AlterarSenhaScreen } from '../screens/perfil/AlterarSenhaScreen';
import { PlanosScreen } from '../screens/perfil/PlanosScreen';
import { PerfilStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<PerfilStackParamList>();

export function PerfilNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PerfilMain"   component={PerfilScreen} />
      <Stack.Screen name="EditarNome"   component={EditarNomeScreen} />
      <Stack.Screen name="AlterarSenha" component={AlterarSenhaScreen} />
      <Stack.Screen name="Planos"       component={PlanosScreen} />
    </Stack.Navigator>
  );
}
