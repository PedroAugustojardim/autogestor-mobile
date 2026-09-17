import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';
import { HomeScreen } from '../screens/home/HomeScreen';
import { VehicleRegisterScreen } from '../screens/vehicle/VehicleRegisterScreen';
import { NotificacoesScreen } from '../screens/notificacoes/NotificacoesScreen';
import { ConsultasScreen } from '../screens/consultas/ConsultasScreen';
import { RelatoriosScreen } from '../screens/relatorios/RelatoriosScreen';
import { GastosNavigator } from './GastosNavigator';
import { ManutencaoNavigator } from './ManutencaoNavigator';
import { PerfilNavigator } from './PerfilNavigator';
import { AppTabParamList, HomeStackParamList } from '../types/navigation';
import { colors } from '../theme/colors';

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="VehicleRegister" component={VehicleRegisterScreen} options={{ presentation: 'modal' }} />
      <HomeStack.Screen name="Notificacoes" component={NotificacoesScreen} />
      <HomeStack.Screen name="Consultas" component={ConsultasScreen} />
      <HomeStack.Screen name="Relatorios" component={RelatoriosScreen} />
    </HomeStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<AppTabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.divider,
          height: 64,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{ tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Gastos"
        component={GastosNavigator}
        options={{ tabBarIcon: ({ color, size }) => <Feather name="file" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Manutencao"
        component={ManutencaoNavigator}
        options={{
          tabBarLabel: 'Manutenção',
          tabBarIcon: ({ color, size }) => <Feather name="tool" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilNavigator}
        options={{ tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} /> }}
      />
    </Tab.Navigator>
  );
}
