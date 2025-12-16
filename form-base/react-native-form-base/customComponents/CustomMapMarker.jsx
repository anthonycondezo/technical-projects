import { useState } from 'react'
/* Styling */
import { View, StyleSheet} from 'react-native'
import { Text, Button } from 'react-native-paper'
import { colors, fonts, sizes } from '../data/theme'
/* Components */
import RecordCard from '../components/RecordCard'
import { Marker } from 'react-native-maps'
/* Custom Components */
import CustomPopUp from './CustomPopUp'


function CustomMapMarker({ record, cameraFieldNames, locationField}) {
    const [visible, setVisible] = useState(false);
    return (
        <>
            <Marker 
                key={record.id}
                coordinate={{ latitude: record.values[locationField].latitude, longitude: record.values[locationField].longitude }}
                title={`${record.id}`}
                onPress={()=>setVisible(true)}
            /> 
            <RecordDisplay 
                record={record}
                visible={visible}
                cameraFieldNames={cameraFieldNames}
                hidePopup={()=>setVisible(false)}
            />
        </>
    );
}

export default CustomMapMarker;


function RecordDisplay({ record, visible, hidePopup, cameraFieldNames}) {
  const styles = StyleSheet.create({
    dialog: {
        backgroundColor: colors.white
    },
    title: {
        fontSize: 30,
        backgroundColor: colors.white, 
        color: colors.darkPurple
    }, 
    content: {
        backgroundColor: colors.white,
        borderRadius: 50
    }
  });
    return (
        <CustomPopUp
            title={"Record Details"}
            visible={visible}
            hideAlert={hidePopup}
            style={styles}
        >
            <View style={{flexDirection: "column" }}>
                <RecordCard 
                    record={record}
                    cameraFieldNames={cameraFieldNames}
                    refreshTrigger={()=>{}}
                    disableAction={true}
                />
                <Button mode='contained' onPress={hidePopup}>
                    Close
                </Button>
            </View>
        </CustomPopUp>
    );
}
