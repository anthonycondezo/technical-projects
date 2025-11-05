/* Styling */
import { View, StyleSheet } from 'react-native';
import { FAB } from 'react-native-paper';
/* Icons */
import { Feather } from '@expo/vector-icons';

export default function FilterViewButton({ toggleIcon, onPress }) {
  return (
    <View style={styles.container}>
      <FAB
        icon={() => (!toggleIcon) 
          ? <Feather name="filter" size={24} color="white" /> 
          :  <Feather name="list" size={24} color="white" /> 
        }
        color="white"
        style={styles.fab}
        onPress={onPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    right: 80,
    zIndex: 10, 
  },
  fab: {
    position: 'absolute',

    backgroundColor: '#6200ee', // default Paper primary color
  },
});
