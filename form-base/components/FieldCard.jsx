import { useState, useEffect } from "react";
/* Styling */
import { View } from "react-native"
import { Text, Badge, Surface, Button } from 'react-native-paper'
import { colors, sizes, fonts } from "../data/theme";
/* Custom Imports */
import CustomCard from "../customComponents/CustomCard";
import CustomPopUp from "../customComponents/CustomPopUp";
/* api Request */
import { deleteField } from "../formbase-api/field";
import { fetchData } from "../formbase-api/fetchers";

const style = {
    badge: {
        marginHorizontal: 4,
        color: colors.white,
        justifyContent: "center",
        alignItems: "center",
        width: "110%",
        height: 28, 
        lineHeight: 20,
        borderRadius: 14,
    },
    badgeContainer: {
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-end",
        marginTop: 8,
        gap: 6
    },
}

/** 
 * Displayed field attributes: 
 *  (1) form_id
 *  (2) name
 *  (3) field_type
 *  (4) options
 *  (5) required
 *  (6) is_num
 * 
 * @param {Object} param0 - Supplied field object to be represented
 * @param {Function} param1 - A callback function which triggers a partial render refresh of the page
 * 
 * @returns A card that displays field attributes and provided field deletion functionality when card is pressed. 
 */
function FieldCard({ field, refreshTrigger }) {
    const [error, setError] = useState(null)
    const [visible, setVisible] = useState(false);
    const [options, setOptions] = useState(null);
    
    const attributes = ["form_id", "field_type"];
    const attributeTitle = (attributes) => { 
        const map = {
            form_id: "Form ID", 
            name: "Name", 
            field_type: "Field Type", 
            options: "Options", 
            required: "Required", 
            is_num: "Is Number"
        };
        return map[attributes] ?? "";
    }

    async function fetchDeleteField() {
        await fetchData(
            ()=>deleteField(Number(field.id)),
            ()=>{},
            setError,
            "Failed to delete field"
        );
        refreshTrigger();
    }

    // populate options 
    useEffect(()=>{ 
        // only for dropdown fields
        if (field.field_type === 'dropdown') {
            setOptions({
                name: Object.keys(field?.options), 
                array: Object.values(field?.options)[0]
            });
        }
    }, []);

    return (
        <CustomCard onPress={()=>setVisible(true)}>
            <View style={{flex: 1, flexDirection: "column"}}>
                <View style={{
                    flexDirection: "row", justifyContent: "space-between"}}>

                    {/* name, form_id and field_type */}
                    <View style={{flexDirection: "column", flex: 1}}>
                        <Text style={{
                            justifyContent: "flex-start",
                            ...fonts.heading,
                            color: colors.purple,
                            }}>
                                {field.name}
                        </Text>
                        <View style={{flex: 1}}>
                            { attributes.map((attribute) => (
                                <View key={`${field.id} + ${attribute}`} 
                                    style={{ flexDirection: "row", alignItems: "center"}}
                                >
                                    <Text variant="titleSmall" style={{ color: colors.lightPurple }}>
                                        { `${attributeTitle(attribute)}: ` }
                                    </Text>
                                    <Text variant="titleSmall" style={{ color: colors.black }}>
                                        { `${field[attribute]}` }
                                    </Text>
                                </View>                                        
                            ))}
                        </View>
                    </View>
                
                {/* required and is_num Badges */}
                <View style={style.badgeContainer}>
                            <Badge style={{
                                ...style.badge, 
                                backgroundColor: (field.required) ? "green" : "red", 
                            }}>
                                Required
                            </Badge>
                            <Badge style={{
                                ...style.badge, 
                                backgroundColor: (field.is_num) ? "green" : "red", 
                            
                            }}>
                                Is Number
                            </Badge>
                    </View>
                </View>
                {/* display options associated with each dropdown field */}
                {(options?.name) && (
                    <OptionsDisplay fieldId={field.id} options={options} />
                )}
            </View>
            <View>
                <DeleteFieldPopUp 
                    fieldName={field.name}
                    visible={visible}
                    hideAlert={()=>setVisible(false)}
                    fetchDeleteField={fetchDeleteField}
                />
            </View>
        </CustomCard>
    );
}

export default FieldCard;

/**
 * Helper component: Displays all options associated with supplied 'dropdown' field.
 * 
 * @param {Integer} param0 - Id of desirded field
 * @param {String[]} param1 - An array of "string" dropdown options
 * 
 * @returns A card which displays all options associated with a 'dropdown' field
 */
function OptionsDisplay({ fieldId,  options }) {
    return (
        <View style={{
            marginTop: 20, 
            borderColor: colors.lightPurple,
            borderWidth: 2, 
            borderRadius: 8, 
            paddingTop: 8,
            paddingHorizontal: 5,

         }}>
            <Text key={"options-title"} 
                variant="titleMedium"
                style={{
                    justifyContent: "center",
                    alignItems: "center", 
                    color: colors.purple,
                    marginBottom: 10
            }}>
                Dropdown Name: {options.name}
            </Text>
            { options.array.map((option) => (
                <Surface key={`${fieldId}`+`${option}`} style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: sizes.padding / 2,
                    marginBottom: sizes.padding,
                    borderRadius: sizes.radius,
                    backgroundColor: colors.lighterPurple
                }}>
                    <Text key={options.array} style={{ color: colors.white }}>{ option }</Text>
                </Surface>
            ))
            }
        </View>
    );
}

/**
 * Helper component:
 * 
 * @param {String} param0 - Name of feild to be deleted
 * @param {Boolean} param1 - tracks pop-up's visibility state
 * @param {Function} param2 - Callback setter function which sets visisble to "false"
 * @param {Function} param3 -  Callback function which performs fetch call to delete field from database
 * 
 * @returns  A pop-up which prompts user to confirm deletion of an existing field AND executes
 *           fetchDeleteField IF confirmed
 */
function DeleteFieldPopUp({ fieldName, visible, hideAlert, fetchDeleteField }) {
  return (
    <>
      <CustomPopUp 
        title={"Delete Field"}
        message={`Are you sure that you want to delete field ${fieldName}?`}
        visible={visible}
        hideAlert={()=> hideAlert("delete")}
      >
        <Button 
            mode="contained"
            buttonColor="red"
            style={{marginVertical: 10}}
            onPress={fetchDeleteField}
        >
            Delete
        </Button>
        <Button mode="contained" onPress={hideAlert}>Cancel</Button>
      </CustomPopUp>
    </>
  );
}
