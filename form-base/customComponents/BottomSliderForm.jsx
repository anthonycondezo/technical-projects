import { useState } from 'react'
/* Styling */
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Surface, Portal, Modal, Text } from 'react-native-paper';
import { colors } from "../data/theme";
/* Custom Components */
import CustomCloseButton from './CustomCloseButton';


/**
 * A customised form compomonet
 * 
 * @param { String } param0 - Form title
 * @param {Function} param1 - onSumbit callback function 
 * @param {React.ReactNode} param2 - Form children components
 * 
 * @returns A Bottom slider form populated with supplied children components
 */
function BottomSliderForm({ title, onSubmit, children }) {
    /* Tracks visibility of BottomSlider */
    const [visible, setvisible] = useState(false);
    /** Sets visible to true */
    const showModal = () => setvisible(true); 
    /** Sets visible to false */
    const hideModal = () => setvisible(false);

    /** FormCreator Styling */
    const styles = StyleSheet.create({
        container: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20, 
        backgroundColor: colors.grayLight
        },
        modalContainer: {
        justifyContent: 'flex-end',
        flex: 1,
        },
        bottomSheet: {
        padding: 16,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        backgroundColor: colors.white,
        elevation: 4,
        },
    });

    return (
        <>
            <View style={styles.container}>
                <Button mode="contained" onPress={showModal} elevation={5} style={{marginBottom: 10 }}>
                    { title }
                </Button>
                
                {/* Bottom Slide Form */}
                <Portal>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={{ flex: 1 }}
                    >
                        <Modal
                            visible={visible}
                            onDismiss={hideModal}
                            contentContainerStyle={styles.modalContainer}
                        >
                            <Surface style={styles.bottomSheet}> 
                                {/* Close Button - Hides FormCreator */}
                                <CustomCloseButton size={40} onPress={hideModal}/>
                                
                                <View style={{flexDirection: "column", alignItems: "center"}}>
                                    <Text variant='headlineLarge' style={{color: colors.purple, marginBottom: 20}}>{ title }</Text>
                                </View>

                                { children }

                                <Button mode="contained" onPress={(e) => {
                                    onSubmit();
                                    hideModal(); 
                                }}
                                >
                                    Submit
                                </Button>
                            </Surface>
                        </Modal>
                    </KeyboardAvoidingView>
                </Portal>
            </View>
        </>
    );
}

export default BottomSliderForm;