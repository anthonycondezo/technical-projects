/* Styling */
import { useWindowDimensions } from 'react-native'
import { Button, Portal, Modal, Surface } from 'react-native-paper';
import { colors } from '../data/theme'
/* Components */
import { CameraView } from 'expo-camera';

function CustomCameraView({ visible, hidePopUp, setPhoto, cameraRef }) {
    const {width, height} = useWindowDimensions();
    const takePicture = async () => {
        if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
            quality: 0.7,
            base64: true,
        });
        setPhoto(photo.uri);
        hidePopUp();
        }
    };
    return (
        <Portal>
            <Modal
                style={{height: "100%", width: "100%"}}
                visible={visible}
                onDismiss={hidePopUp}
            >
                <Surface style={{height: height, width: width}}>
                <CameraView 
                    style={{
                        flex: 1, 
                        height: "100%",
                        width: "100%"
                    }}
                    ref={cameraRef}
                />
                <Button mode='contained' 
                    style={{color: colors.white, marginTop: 4, marginBottom: 25}}
                    onPress={takePicture}
                >
                    Take Picture
                </Button>
                </Surface>
            </Modal>
        </Portal>
    )
}

export default CustomCameraView;