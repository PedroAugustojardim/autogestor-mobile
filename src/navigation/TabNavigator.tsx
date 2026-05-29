import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Placeholders — serão substituídos pelas telas reais nas próximas etapas
import { View, Text, StyleSheet } from 'react-native';

const Placeholder = ({ name }: { name: string }) => (
  <View style={styles.container}>
    <Text style={styles.text}>{name}</Text>
  </View>
);

const HomeScreen = () => <Placeholder name="Home" />;
const GastosScreen = () => <Placeholder name="Gastos" />;
const RelatoriosScreen = () => <Placeholder name="Relatórios" />;
const PerfilScreen = () => <Placeholder name="Perfil" />;

const Tab = createBottomTabNavigator();

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
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Gastos" component={GastosScreen} />
      <Tab.Screen name="Relatórios" component={RelatoriosScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  text: {
    fontSize: 24,
    color: '#1B5E20',
    fontWeight: 'bold',
  },
});
