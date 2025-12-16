/* Styling */
import { Pressable } from 'react-native'
import { Surface } from 'react-native-paper'
import { colors, sizes } from '../data/theme'

const defaultStyle = {
    flexDirection: "row",
    alignItems: "center",
    padding: sizes.padding / 2,
    marginBottom: sizes.padding,
    borderRadius: sizes.radius,
}

/**
 * A customised wrapper component.
 * 
 * @param {*} param0 - onPress callback function. If not supplied, card is NOT pressable
 * @param {React.ReactNode} - Form Children components
 * 
 * @returns A card component populated with supplied children comopnents. 
 */
function CustomCard({ onPress, children }) {
    if (onPress) {
        // return a pressable component 
        return (
            <Pressable
                style={({ pressed }) => [
                    {
                        ...defaultStyle, 
                        backgroundColor: pressed ? colors.lighterPurple : colors.white,
                    }
                ]}
                onPress={onPress ?? (()=>{})}        
            >
                {children}
            </Pressable>
        );
    } 

    // by default - return un-pressable component
    return (
            <Surface
                style={{
                    ...defaultStyle, 
                    backgroundColor: colors.white,
                }}
                onPress={onPress ?? (()=>{})}        
            >
                {children}
            </Surface>
        );
    
}

export default CustomCard;