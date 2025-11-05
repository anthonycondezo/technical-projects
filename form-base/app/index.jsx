import { router } from "expo-router"
/* Styling */
import { View } from "react-native";
import { Text, Button, Surface } from "react-native-paper";
import { colors } from "../data/theme";
/* Icons */
import { FontAwesome } from "@expo/vector-icons";
export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
     <Surface 
      elevation={5}
      style={{
          marginBottom: 60,
          padding: 24, 
          backgroundColor: colors.darkPurple, 
          borderRadius: 10
        }}
      >
      <FontAwesome 
        name="wpforms"
        size={350}
        color={"white"}
        elevation={5}
        />
      <Text variant="displayLarge" style={{color:"white"}}>FormBase</Text>
      <Text variant="titleSmall" style={{color:"white"}}>Create powerful, beautiful forms on the fly</Text>
     </Surface>
      <Button mode="contained" style={{
          borderRadius: 12,
          width: 250,
        }}
        contentStyle={{
          paddingVertical: 12,
        }}
        labelStyle={{
          fontSize: 18,
          fontWeight: "bold",
        }}
        onPress={()=>{ router.push("/about")}}  
      > Get Started!</Button>
    </View>
  );
}
