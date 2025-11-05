import { Tabs, useLocalSearchParams, router } from 'expo-router';
import { Pressable, ScrollView } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { DrawerToggleButton } from '@react-navigation/drawer';



export default function _layout() {
   const { id } = useLocalSearchParams();  
  return (
    <Tabs screenOptions={{ 
        headerLeft: () => <DrawerToggleButton tintColor='#000' />, 
        headerRight: () => (
          <Pressable
            onPress={() => router.push('/myforms')}
            style={{ marginRight: 15 }}
          >
            <Feather name="arrow-left" size={22} color="#000" />
          </Pressable>
        ),

      }}
    >
        <Tabs.Screen name='form' initialParams={{ id }} options={{
          tabBarIcon: ({ color }) => (
            <FontAwesome name="wpforms" size={24} color={color} />
          ),
          tabBarLabel: 'Form',
          headerTitle: 'Form'
        }} />
        <Tabs.Screen name='records' initialParams={{ id }} options={{
          tabBarIcon: ({ color }) => (
            <Feather name="list" size={24} color={color} />
          ),
          tabBarLabel: 'Records',
          headerTitle: 'Records'
        }} />
        <Tabs.Screen name='map' initialParams={{ id }} options={{
          tabBarIcon: ({ color }) => (
            <Feather name="map-pin" size={24} color={color} />
          ),
          tabBarLabel: 'Map',
          headerTitle: 'Map'
        }} />
      </Tabs>
  )
}