import { useRef, useState, useEffect } from 'react'
/* Styling */
import { View, StyleSheet, Image, useWindowDimensions } from 'react-native'
import { Text, Button, Portal, Modal, Surface } from 'react-native-paper';
import { colors, sizes} from '../data/theme'
/* Components */

import { useCameraPermissions } from 'expo-camera';
/* Custom Components */
import CustomCameraView from '../customComponents/CustomCameraView';
import CustomPopUp from '../customComponents/CustomPopUp';
import CustomAlertCard from '../customComponents/CustomAlertCard';

function CameraInput({ saveTo }) {
    const [visible, setVisible] = useState(false);
    const showPopUp = () => setVisible(true);
    const hidePopUp = () => setVisible(false)
    const [permission, requestPermission] = useCameraPermissions();
    
    if (!permission || !permission.granted) {
        return (
        <Surface style={{
            padding: sizes.padding / 2,
            marginBottom: sizes.padding,
            borderRadius: sizes.radius,
            backgroundColor: colors.grayLight}} >
            <Text style={styles.message}>We need your permission to show the camera</Text>
            <Button onPress={requestPermission} title="Grant permission" />
        </Surface>
        );
    }
    
    return (
         <Surface style={{
            padding: sizes.padding / 2,
            marginBottom: sizes.padding,
            borderRadius: sizes.radius,
            backgroundColor: colors.grayLight}} 
        >
         <Button mode='outlined' textColor={colors.darkPurple} 
                    style={{color: colors.white, marginVertical: 5}}
                    onPress={showPopUp}
                >
                    Add Photo
            </Button>
            <CameraFinderPopUp 
                visible={visible}
                hidePopUp={hidePopUp}
                saveTo={(e)=>saveTo(e)}
            />

        </Surface>
    );
}

export default CameraInput;


function CameraFinderPopUp({ visible, hidePopUp, saveTo}) {
    const [photo, setPhoto] = useState(null);
    const [camVisibility, setCamVisibility] = useState(false);
    const showCam = () => setCamVisibility(true);
    const hideCam = () => setCamVisibility(false)
    const cameraRef = useRef(null);
   
    return (
        <>
            <CustomPopUp
                title="Upload Camera Image"
                visible={visible}
                hideAlert={hidePopUp}
            >
                <View style={{ height: 400, flex: 1, flexDirection: "column", justifyContent: "flex-end" }}>
                    {(!photo) ? (
                        <CustomAlertCard message="No photo take. Cannot display image" />
                    ) : (
                         <Image source={{ uri: photo }} style={{ height: 300, width: "100%", borderRadius: 20 }} />
                    )}
                    <Button mode='contained'
                        style={{ color: colors.white, marginTop: 15, backgroundColor: colors.lightGreen2 }}
                        onPress={()=>{saveTo(photo); hidePopUp()}}
                    >
                        Save Photo
                    </Button>
                    <Button mode='contained'
                        style={{ color: colors.white, marginVertical: 5 }}
                        onPress={showCam}
                    >
                        Take Picture
                    </Button>
                </View>
            </CustomPopUp>
            <CustomCameraView
                    cameraRef={cameraRef}
                    setPhoto={setPhoto}
                    visible={camVisibility}
                    hidePopUp={hideCam} 
            />
        </>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
    marginVertical: 10, 
    height: 100, 
    width: "100%"
  },
  scanResultContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 15,
  },
  scanResultText: {
    fontSize: 16,
    marginBottom: 10,
  },
});