import { router } from 'expo-router';
/* Styling */
import { View } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
/* Icons */
import { Feather, AntDesign } from '@expo/vector-icons';
import { colors } from '../data/theme';

export default function About() {
  return (
    <View style={{flex:1, justifyContent:'center', alignItems:'center' }}>
      <Text variant="headlineLarge" style={{color: colors.black}} elevation={5}>Formbase</Text>
      <Surface style={{backgroundColor: colors.white, margin: 20, borderRadius: 20}}>
        {/* First Paragraph */}
      <View style={{flexDirection: "column", alignItems: "center", padding: 24}}>
        <Text style={{ fontSize:16, lineHeight: 24, color: colors.black}}>
          Formbase a light-weight platform that creates beautiful and flexiable forms on the fly. 
          Forms that allow flexiable data-collection through a mix of field types. 
        </Text>
      </View>

      {/* Form Actions */}
      <View style={{flexDirection: "column", alignItems: "center", padding: 24}}>
        {/* Create Action */}
        <View style={{flexDirection: "row", padding: 10}}>
          <AntDesign name="file-add" 
            size={24}
            color={colors.purple}
          />
          <Text style={{ fontSize:20, lineHeight: 24, color:colors.black, marginLeft: 10}}>
            Create forms
          </Text>
        </View>
        {/* Edit Action */}
        <View style={{flexDirection: "row", padding: 10}}>
          <Feather name="edit" 
            size={24}
            color={colors.purple}
          />
          <Text style={{ fontSize:20, lineHeight: 24, color:colors.black, marginLeft: 10}}>
            Edit forms
          </Text>
        </View>
        {/* Delete Action */}
        <View style={{flexDirection: "row", padding:10}}>
          <AntDesign name="delete" 
            size={24}
            color={colors.purple}
          />
          <Text style={{ fontSize:20, lineHeight: 24, color:colors.black, marginLeft: 10}}>
            Delete forms
          </Text>
        </View>

      </View>

      {/* Secondary Paragraph */}
      <View style={{flexDirection: "column", alignItems: "center", padding: 24}}>
        <Text style={{ fontSize:16, lineHeight: 24, color: colors.black}}>
          Formbase allows easy access to all existing form records at the palm of your hand.
        </Text>
      </View>

      </Surface>
      {/* Send users back to the welcome page */}
      <Button mode="outlined" onPress={()=> router.back()} textColor={colors.darkPurple} elevation={5}> Go Home</Button>
    </View>
  )
}