/* Styling */
import { Surface, Text } from 'react-native-paper';
import { sizes} from '../data/theme';
/* Icons */
import { AntDesign } from '@expo/vector-icons';

/**
 * A customised alert card.
 * 
 * @param {String} param0 - Alert message 
 * 
 * @returns an alert card populated with supplied alert message
 */
function CustomAlertCard({ message }) {
    return (
        <>
           <Surface style={{flexDirection: "column",
                alignItems: "center",
                padding: sizes.padding / 2,
                marginBottom: sizes.padding,
                borderRadius: sizes.radius,
                }}
            >
                <AntDesign 
                    name="exclamation-circle"
                    size={50}
                    color={"red"}
                    elevation={5}
                />
                <Text style={{color: "red"}}>{message}</Text>
            </Surface>
        </>
    );
}

export default CustomAlertCard;