import { useState, useEffect } from "react";
/* Styling */
import { View } from 'react-native'
import { Text, Surface, IconButton, ActivityIndicator } from "react-native-paper"
import { colors, sizes } from "../data/theme";
/* For getting user's current location */
import * as Location from 'expo-location';

function LocationInput({ setData }) {
    const [error, setErrorMsg] = useState(null)
    const [loading, setLoading] = useState(true);
    const [location, setLocation] = useState(null);
    /* Ask user for location permission and collect user's coordinates */
    useEffect(() => {
        (async () => {
          let { status } = await Location.requestForegroundPermissionsAsync(); // ask user for permission
          if (status !== 'granted') {
            setErrorMsg('Permission to access location was denied');
            return;
          }
          let loc = await Location.getCurrentPositionAsync({}); // get's user's coordinates
          setLocation(loc.coords);
        })();
      }, []);


    /* Exist loading state when location is collected */
    useEffect(()=>{ 
        if (location || error) setLoading(false) 
        if (location || !error ) setData(location)
    }, [location, error]);
    return (
        <Surface style={{
            padding: sizes.padding / 2,
            marginBottom: sizes.padding,
            borderRadius: sizes.radius,
            backgroundColor: colors.grayLight}} 
        >
      {/* Icon Section */}
      {loading ? (
        <View style={{flexDirection: "row", alignItems: "center"}}>
            <ActivityIndicator animating={true} color={colors.lightPurple} />
            <Text style={{color: colors.black}}>Getting location...</Text>
        </View>
      ) : error ? (
        <View style={{flexDirection: "row", alignItems: "center"}}>
            <IconButton icon="alert-circle" iconColor="red" />
            <Text style={{color: colors.black}}>Error: failed to get location.</Text>
        </View>
      ) : (
        <View style={{flexDirection: "row", alignItems: "center"}}>
            <IconButton icon="check-circle" iconColor="green" />
            <Text style={{color: colors.black}}>Location collected!</Text>
        </View>
      )}
        </Surface>
    );
}

export default LocationInput;