import { useState, useEffect} from "react";
/* Styling */
import { View } from "react-native"
import { Text, Button, Surface, TextInput } from 'react-native-paper';
import { colors, sizes, fonts } from "../data/theme";
/* CustomComponets */
import CustomCard from "../customComponents/CustomCard";
import CustomPopUp from "../customComponents/CustomPopUp";
import CustomPopUpFormContainer from "../customComponents/CustomPopupFormContainer";
/* api Requests */
import { editForm, deleteForm } from "../formbase-api/form";
import { fetchData } from "../formbase-api/fetchers";


/**
 * 
 * @param {Object} param0 - Supplied form object to be represented
 * @param {Function} param1 - Function to be exectued when card it pressed.
 * @param {Function} param2 - A callback function which triggers a partial render refresh of the page
 * @param {Boolean} param3 - A boolean flag that enables or disables edit and delete functionlity
 * @returns 
 */

function FormCard({ form, onPress, refreshTrigger, disableActions=false }) {
    const [error, setError] = useState(null);

    const [visible, setVisible] = useState({
        edit: false,
        delete: false
    });
    const showAlert = (type) => setVisible((prev) => ({...prev, [type]: true }));
    const hideAlert = (type) => setVisible((prev) => ({...prev, [type]: false }));

    async function fetchEditForm(id, editedForm) {
        await fetchData(
            ()=>editForm(Number(id), editedForm), 
            ()=>{},
            setError,
            "Failed to edit form"
        )
        refreshTrigger();
    }

    async function fetchDeleteForm() {
        await fetchData(
            ()=>deleteForm(Number(form.id)), 
            ()=>{},
            setError,
            "Failed to delete form" 
        );
        refreshTrigger();
    }
    
    return (
        <CustomCard onPress={onPress}>
            {/* Form Name and Description */}
            <View
                style={{
                    flex: 1,
                    width: "65%",
                    paddingHorizontal: sizes.padding / 2, 
                }}
            >
                {/* Name */}
                <Text
                    style={{
                        justifyContent: "flex-start",
                        ...fonts.heading,
                        color: colors.purple,
                        }}
                    >
                        {form.name}
                </Text>
                {/* Description */}
                <Text
                    style={{
                        ...fonts.body4,
                        color: colors.gray,
                        justifyContent: "flex-start"
                    }}
                >
                    {form.description}
                </Text>
            </View>
            {
                (!disableActions) && (
                /* Action Buttons - Edit and Delete */
                <>
                        {/* Action Buttons - Edit and Delete */}
                        <View
                            style={{
                                paddingHorizontal: sizes.padding / 2,
                            }}
                            pointerEvents="box-none"
                        >
                            <Button
                                mode="contained"
                                textColor="black"
                                buttonColor={colors.lighterPurple}
                                style={{ marginVertical: 3 }}
                                onPress={() => showAlert("edit")}
                            >
                                Edit
                            </Button>
                            <Button
                                mode="contained"
                                textColor="white"
                                buttonColor="red"
                                style={{ marginVertical: 3 }}
                                onPress={() => showAlert("delete")}
                            >
                                Delete
                            </Button>
                        </View>
                        {/* Pop Ups - EditPopUp and DeletePopUp */}
                        <View>
                            <FormEditorPopUp
                                form={form}
                                visible={visible.edit}
                                hidePopUp={() => hideAlert("edit")}
                                fetchEditForm={fetchEditForm} />
                            <DeletePopUp
                                formName={form.name}
                                visible={visible.delete}
                                hideAlert={() => hideAlert("delete")}
                                fetchDeleteForm={fetchDeleteForm} />
                        </View></>
                )
            }
        </CustomCard>

    );
}

export default FormCard;


/**
 * Helper component: form editor form
 * 
 * @param {Object} param0 - form object to be edited 
 * @param {Boolean} param1 - tracks pop-up's visibility state
 * @param {Function} param2 - Callback function setter which sets visisble to 'false'
 * @param {Function} param3 - Callback function which performs fetch call to edit form from database
 *  
 * @returns A pop-up which provides a form for editing specifed form
 */
function FormEditorPopUp({ form, visible, hidePopUp, fetchEditForm }) {
    /* Tracks the formCreator fields */
    const [editedForm, setEditedForm] = useState({
        name: null, 
        description: null
    });
    /** Sets form.name */
    const setFormName = (name) => setEditedForm((prev) => ({...prev, name: name})); 
    /** Sets from.description */
    const setFormDescription = (description) => setEditedForm((prev) => ({...prev, description: description}));
    
    useEffect(()=>{
        if (form) {
            // upload the current forms to the editor 
            setFormName(form.name);
            setFormDescription(form.description);
        }
    }, [form]);
    return (
        <>
            <CustomPopUpFormContainer
                title={"Edit Form"}
                visible={visible}
                hidePopUp={hidePopUp}
                style={{ backgroundColor: colors.white }}
            >
                <Surface elevation={0} style={{backgroundColor: colors.white}}  >
                    {/* Prompt user to add new form name */}
                    <TextInput 
                        label="Please enter form name"
                        value={editedForm.name}
                        onChangeText={setFormName}
                        theme={{
                            colors: {   
                            onSurfaceVariant: colors.darkPurple
                            },
                        }}
                        textColor="black"
                        style={{ 
                            marginBottom: 16, 
                            backgroundColor: colors.white,
                        }}
                    />
                    {/* Prompt user to add form description */}
                    <TextInput 
                        label="Please enter form description"
                        value={editedForm.description}
                        onChangeText={setFormDescription}
                        textColor="black"
                        theme={{
                            colors: {   
                            onSurfaceVariant: colors.darkPurple
                            },
                        }}                     
                        style={{ 
                            marginBottom: 16, 
                            backgroundColor: colors.white,
                        }}
                    />
                    <Button mode="contained" onPress={(e) => {
                        hidePopUp(); 
                        fetchEditForm(form.id, editedForm);
                    }}
                    >
                        Submit
                    </Button>
                </Surface>
            </CustomPopUpFormContainer>
        </>
    );
}

/**
 * Helper component:
 * 
 * @param {String} param0 - Name of form to be deleted
 * @param {Boolean} param1 - tracks pop-up's visibiity state
 * @param {Function} param2 - Callback setter function which sets visisble to 'false'
 * @param {Function} param3 - Callback function which perfoms fetch calll to delete form from database
 *   
 * @returns 
 */
function DeletePopUp({formName, visible, hideAlert, fetchDeleteForm}) {
    return (
        <>
            <CustomPopUp 
            title={"Delete Form"}
            message={`Are you sure that you want to delete form ${formName}?`}
            visible={visible}
            hideAlert={() => hideAlert("delete")}
            >
                <Button 
                    mode="contained" 
                    buttonColor="red"
                    style={{marginVertical: 10}}
                    onPress={fetchDeleteForm}
                > 
                    Delete
                </Button>
                <Button mode="contained" onPress={hideAlert}>Cancel</Button>
            </CustomPopUp>
        </>
    );
}