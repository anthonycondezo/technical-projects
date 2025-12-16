/* Styling */
import { View, KeyboardAvoidingView, Platform } from "react-native";
import { Dialog, Portal } from 'react-native-paper'
import { colors } from "../data/theme";

function CustomPopUpFormContainer({ title, visible, hidePopUp, style, children } ) {
    return (
        <Portal>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <Dialog
                    visible={visible}
                    onDismiss={hidePopUp}
                    style={style}
                >
                    <Dialog.Title style={(style) ? { color: colors.purple } : { }}>{title}</Dialog.Title>
                    <Dialog.Content>
                        <View>
                            { children }
                        </View>
                    </Dialog.Content>
                </Dialog>
            </KeyboardAvoidingView>
        </Portal>
    );
}

export default CustomPopUpFormContainer;