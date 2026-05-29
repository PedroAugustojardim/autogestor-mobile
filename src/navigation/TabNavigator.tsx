import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';
import { HomeScreen } from '../screens/home/HomeScreen';
import { VehicleRegisterScreen } from '../screens/vehicle/VehicleRegisterScreen';
import { AppTabParamList, HomeStackParamList } from '../types/navigation';

// Placeholders para abas que serão implementadas nas próximas etapas
const Placeholder = ({ name }: { name: string }) => (
  <View style={styles.placeholder}><Text style={styles.placeholderText}>{name}</Text></View>
);

// Stack interno da aba Home (comporta Home + CadastroVeiculo como modal)
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen
        name="VehicleRegister"
        component={VehicleRegisterScreen}
        options={{ presentation: 'modal' }}
      />
    </HomeStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<AppTabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1B5E20',
        tabBarInactiveTintColor: '#9E9E9E',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: 60,
          paddingBottom: 8,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Gastos" component={() => <Placeholder name="Gastos" />} />
      <Tab.Screen name="Relatorios" component={() => <Placeholder name="Relatórios" />} options={{ tabBarLabel: 'Relatórios' }} />
      <Tab.Screen name="Perfil" component={() => <Placeholder name="Perfil" />} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5' },
  placeholderText: { fontSize: 20, color: '#1B5E20', fontWeight: 'bold' },
});
