import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';
import { HomeScreen } from '../screens/home/HomeScreen';
import { VehicleRegisterScreen } from '../screens/vehicle/VehicleRegisterScreen';
import { ManutencaoScreen } from '../screens/manutencao/ManutencaoScreen';
import { NewMaintenanceScreen } from '../screens/manutencao/NewMaintenanceScreen';
import { NotificacoesScreen } from '../screens/notificacoes/NotificacoesScreen';
import { ConsultasScreen } from '../screens/consultas/ConsultasScreen';
import { GastosNavigator } from './GastosNavigator';
import { RelatoriosScreen } from '../screens/relatorios/RelatoriosScreen';
import { PerfilNavigator } from './PerfilNavigator';
import { AppTabParamList, HomeStackParamList } from '../types/navigation';
import { colors } from '../theme/colors';

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="VehicleRegister" component={VehicleRegisterScreen} options={{ presentation: 'modal' }} />
      <HomeStack.Screen name="Manutencao" component={ManutencaoScreen} />
      <HomeStack.Screen name="NewMaintenance" component={NewMaintenanceScreen} options={{ presentation: 'modal' }} />
      <HomeStack.Screen name="Notificacoes" component={NotificacoesScreen} />
      <HomeStack.Screen name="Consultas" component={ConsultasScreen} />
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
        options={{ tabBarIcon: ({ color, size }) => <Feather name="credit-card" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Relatorios"
        component={RelatoriosScreen}
        options={{
          tabBarLabel: 'Relatórios',
          tabBarIcon: ({ color, size }) => <Feather name="bar-chart-2" size={size} color={color} />,
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
