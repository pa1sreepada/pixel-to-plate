import 'react-native-gesture-handler';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function RootLayout() {
  const router = useRouter();

  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Pixel to Plate',
          headerBackVisible: false,
          headerLeft: () => null,
        }} 
      />
      <Stack.Screen 
        name="recipe-finder" 
        options={{
          title: 'Snap & Cook',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.replace({ pathname: '/', params: {}, key: 'home', state: { index: 0, routes: [{ name: 'index' }] } })}>
              <MaterialIcons name="home" size={24} color="#4CAF50" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen 
        name="recipe-detail" 
        options={{
          title: 'Recipe Details',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.replace({ pathname: '/', params: {}, key: 'home', state: { index: 0, routes: [{ name: 'index' }] } })}>
              <MaterialIcons name="home" size={24} color="#4CAF50" />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}