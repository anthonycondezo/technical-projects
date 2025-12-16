import { useState } from 'react';
/* Styling */
import { View, Image } from 'react-native'
import { Text, Button } from 'react-native-paper' 
import { colors, fonts } from "../data/theme";
/* Components */
import * as Clipboard from 'expo-clipboard';
/* Custom Components */
import CustomCard from '../customComponents/CustomCard';
import CustomPopUp from '../customComponents/CustomPopUp';
/* api Request */
import { deleteRecord } from '../formbase-api/record';
import { fetchData } from '../formbase-api/fetchers';


/**
 * @param {Object} param0 - Supplied record object to be represented
 * @param {Function} param1 - A callback function which triggers a partial render refresh of the page
 * 
 * @returns A card that displays record.value attributes and provides record deletion functionality when card is pressed. 
 */
function RecordCard({ record, cameraFieldNames, refreshTrigger, disableAction = false}) {
    const entries = Object.entries(record.values);
    const [error, setError] = useState(null);
    const [visible, setVisible] = useState(false);
    async function fetchDeleteRecord() {
        await fetchData(
            ()=>deleteRecord(Number(record.id)),
            ()=>{}, 
            setError, 
            "Failed to delete field"
        );
        refreshTrigger();
    }

    return (
        <CustomCard onPress={()=>setVisible(
            (!disableAction) 
            ? true 
            : Clipboard.setStringAsync(JSON.stringify(record, null, 2)))}>
            <View style={{
                flexDirection: "column", 
                alignItems: "center",
                justifyContent: "center", 
                width: "100%", 
            }}
            >
                {/* Display Record id */}
                <Text style={{
                    ...fonts.heading,
                    color: colors.purple,
                }}>
                    Record ID: {record.id}
                </Text>
                {/* Record id underline */}
                <View  variant="titleSmall"
                    style={{
                    height: 2,
                    backgroundColor: colors.purple,
                    width: "90%",
                    marginBottom: 8,
                    }}/>

                {/* Displaying value object keys and values */}
                {entries.map(([key, value], index) => (
                    <View key={index} style={{
                        flexDirection: "column",
                        justifyContent: "center", 
                        alignItems: "center", 
                    }}>
                        <Text variant='titleSmall'
                            style={{
                                color: colors.purple,
                            }}
                        >
                            {key}
                        </Text>

                    {(cameraFieldNames?.includes(key)) ? (
                           <Image source={{uri: value}} style={{height: 100, width: 100}} />
                        ) : (
                            <Text variant='titleSmall'
                                style={{
                                    color: colors.black,
                                }}
                            >
                                {(value && typeof value === "object" && !Array.isArray(value)) 
                                    ? JSON.stringify(value, null,  2)
                                    : value
                                }
                            </Text>
                        )}
                    </View>
                ))}
            </View>
            <View>
                {(!disableAction) && (
                    <ActionSelectPopUp 
                        record={record} 
                        visible={visible} 
                        hideAlert={()=>setVisible(false)}
                        deleteActionCallback={fetchDeleteRecord}
                    />
                )}
            </View>            
        </CustomCard>  
    );
}

export default RecordCard;


function ActionSelectPopUp({ record, visible, hideAlert, deleteActionCallback }) {
    const [action, setAction] = useState({
        copy: false, 
        delete: false
    });
    const showAction = (type) => setAction((prev) => ({...prev, [type]: true }));
    const hideAction = (type) => setAction((prev) => ({...prev, [type]: false }));
    return (
        <>
            <CustomPopUp
                title={"Select Action"}
                message={`What action would you like to perform on the record ${record.id}?`}
                visible={visible}
                hideAlert={hideAlert}
            >
               <View style={{flexDirection: "column",  marginTop: 20}}>
                    <Button
                        mode="outlined"
                        textColor='white'
                        style={{marginVertical: 5}}
                        onPress={()=>{
                            Clipboard.setStringAsync(JSON.stringify(record, null, 2));
                            hideAlert();
                        }}
                    >
                        Copy To Clipboard
                    </Button>
                    <Button
                        mode="contained"
                        buttonColor='red'
                        textColor='white'
                        style={{marginVertical: 5}}
                        onPress={()=>showAction("delete")}
                    >
                        Delete Record
                    </Button>
               </View>

                <View>     
                    <DeleteRecordPopUp 
                        recordId={record.id}
                        visible={action.delete}
                        hideAlert={()=>hideAction("delete")}
                        fetchDeleteRecord={deleteActionCallback}
                    />
                </View>
            </CustomPopUp>
        </>
    );
}

/**
 * Helper component:
 * 
 * @param {String} param0 - Name of record to be deleted
 * @param {Boolean} param1 - tracks pop-up's visibility state
 * @param {Function} param2 - Callback setter function which sets visisble to "false"
 * @param {Function} param3 -  Callback function which performs fetch call to delete field from database
 * 
 * @returns  A pop-up which prompts user to confirm deletion of an existing record AND executes
 *           fetchDeleteRecord IF confirmed
 */
function DeleteRecordPopUp({ recordId, visible, hideAlert, fetchDeleteRecord }) {
    return (
        <>
            <CustomPopUp
                title={"Delete Record"}
                message={`Are you sure that you want to delete record ${recordId}?`}
                visible={visible}
                hideAlert={hideAlert}
            >   
                <Button
                        mode="outlined"
                        textColor={colors.white}
                        style={{marginVertical: 5}}
                        onPress={hideAlert}
                    >
                        Cancel
                    </Button>            
                <Button
                    mode="contained"
                    buttonColor='red'
                    style={{marginVertical: 5}}
                    onPress={fetchDeleteRecord}
                >
                    Delete
                </Button>
            </CustomPopUp>
        </>
    );
}