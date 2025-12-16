/* Styling */
import { View, ScrollView } from 'react-native'
import { Text, Dialog, Portal } from 'react-native-paper'

/**
 * A customised pop-up component
 * 
 * @param {String} param0 - Pop-up title
 * @param {String} param1 - Pop-up message
 * @param {Boolean} param2 - tracks visibillity state
 * @param {Function} param3 - Callback setter function which sets visisble to "false"
 * @param {React.ReactNode} param4 - Children components
 * 
 * @returns A pop-up component populated with children components
 */
function CustomPopUp({ title, message, visible, hideAlert, children, style }) {
    return (
       <Portal>
            <Dialog 
                visible={visible} 
                onDismiss={hideAlert}
                style={style?.dialog}
            >
                <Dialog.Title style={style?.title}>{title}</Dialog.Title>
                <Dialog.Content style={style?.content}>
                    <ScrollView>
                        <Text>{message}</Text>
                        <View>
                            { children }
                        </View>
                    </ScrollView>
                </Dialog.Content>
            </Dialog>
       </Portal>
    );
}

export default CustomPopUp;