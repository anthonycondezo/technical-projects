import { useEffect } from "react";
import { router, usePathname } from "expo-router";
/* Styling */
import { StyleSheet, View } from "react-native";
import { Text, Provider, Portal } from "react-native-paper";
/* Icons */
import { Feather, FontAwesome} from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { colors } from "../data/theme";


const CustomDrawerContent = (props) => {
  const pathname = usePathname();

  useEffect(() => {
    console.log("Current Path", pathname);
  }, [pathname]);

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.infoContainer}>
        <View style={styles.infoDetailsContainer}>
          <Text variant={"displaySmall"} style={{color: colors.purple}}>FormBase</Text>
        </View>
      </View>
      <DrawerItem
        icon={({ color, size }) => (
          <Feather
            name="home"
            size={size}
            color={pathname == "/" ? "#fff" : colors.purple}
          />
        )}
        label={" Home"}
        labelStyle={[
          styles.navItemLabel,
          { color: pathname == "/" ? "#fff" : "#000" },
        ]}
        style={{ backgroundColor: pathname == "/" ? "#333" : "#fff" }}
        onPress={() => {
          router.push("/");
        }}
      />
      <DrawerItem
        icon={({ color, size }) => (
          <Feather
            name="info"
            size={size}
            color={pathname == "/about" ? "#fff" : colors.purple}
          />
        )}
        label={" About"}
        labelStyle={[
          styles.navItemLabel,
          { color: pathname == "/about" ? "#fff" : "#000" },
        ]}
        style={{ backgroundColor: pathname == "/about" ? "#333" : "#fff" }}
        onPress={() => {
          router.push("/about");
        }}
      />
      <DrawerItem
        icon={({ color, size }) => (
          <FontAwesome
            name="wpforms"
            size={size}
            color={pathname == "/myforms" ? "#fff" : colors.purple}
          />
        )}
        label={" My Forms"}
        labelStyle={[
          styles.navItemLabel,
          { color: pathname == "/myforms" ? "#fff" : "#000" },
        ]}
        style={{ backgroundColor: pathname == "/myforms" ? "#333" : "#fff" }}
        onPress={() => {
          router.push("/myforms");
        }}
      />
    </DrawerContentScrollView>
  );
};

export default function Layout() {
  return (
    <Provider>
      <Drawer drawerContent={(props) => <CustomDrawerContent {...props} />} screenOptions={{headerShown: false}}>
        <Drawer.Screen name="index" options={{headerShown: true, headerTitle: "Home"}}  />
        <Drawer.Screen name="about" options={{headerShown: true, headerTitle: "About"}} />
        <Drawer.Screen name="myforms" options={{headerShown: true, headerTitle: "My Forms"}} />
      </Drawer>
    </Provider>
   
  );
}

const styles = StyleSheet.create({
  navItemLabel: {
    marginLeft: -10,
    fontSize: 18,
  },
  infoContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 20,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  infoDetailsContainer: {
    marginTop: 25,
    marginLeft: 10,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  }
});
