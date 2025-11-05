import { ScrollView } from "react-native-gesture-handler";
import { colors } from "../data/theme";


/**
 * A customised "Scrollview" based component - provides standardised styling.
 * Intended to wrap the entire page. 
 * 
 * @param {React.ReactNode} param0 - props.children  
 * @returns - A scrollable wrapper component
 */
function CustomPageContainer({ children }) {
    return (
        <ScrollView contentContainerStyle={{
            paddingTop: 10,
            backgroundColor: colors.grayLight,
            paddingBottom: 10
        }}>
            { children }
        </ScrollView>
    );
}

export default CustomPageContainer;