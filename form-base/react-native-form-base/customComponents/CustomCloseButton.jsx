import { View } from 'react-native'
import { IconButton } from 'react-native-paper'


/**
 * A customised 'close' icon button component.
 * 
 * @param {Integer} param0 - Desired size of component
 * @param {Function} param1 - onPress callback function
 * 
 * @returns 
 */
function CustomCloseButton({ size, onPress }) {
    return (
        <View style={{flexDirection: "row", justifyContent: 'flex-end'}}>
            <IconButton 
                icon="close"
                size={size}
                onPress={onPress}
            />
        </View>
    );
}

export default CustomCloseButton;