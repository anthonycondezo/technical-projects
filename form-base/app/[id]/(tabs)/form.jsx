import { useState, useEffect } from 'react'
import { useLocalSearchParams } from 'expo-router';
/* Styling */
import { View } from 'react-native';
import { Text, Surface, TextInput, Button, TouchableRipple, Checkbox } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { colors, sizes } from "../../../data/theme";
/* Components */

/* CustomComponets */
import CustomAlertCard from '../../../customComponents/CustomAlertCard';
import FormCard from '../../../components/FormCard';
import FieldCard from '../../../components/FieldCard';
import CustomPageContainer from '../../../customComponents/customPageContainer';
import CustomPopUpFormContainer from '../../../customComponents/CustomPopupFormContainer';
import CustomPopUp from '../../../customComponents/CustomPopUp';
import BottomSliderForm from '../../../customComponents/BottomSliderForm';
/* api Requests */
import { getForm } from '../../../formbase-api/form';
import { getFormFields, insertField } from '../../../formbase-api/field';
import { fetchData } from '../../../formbase-api/fetchers';


export default function Form() {
  const { id } = useLocalSearchParams();
  /* Stores form object and corresponding fields */
  const [data, setData] = useState({
    form: null, 
    fields: null, 
    error: null
  });
  /** Set data.form */
  const setForm = (obj) => setData((prev) => ({...prev, form: obj}));
  /** Set data.field */
  const setField = (data) => setData((prev) => ({...prev, fields: data }));
  /** Set data.error */
  const setError = (err) => setData((prev) => ({...prev, error: err }));
  /** Performs fetch request - get form specified by id */
  async function fetchForm() {
    fetchData(
      () => getForm(id), 
      setForm, 
      setError, 
      "Failed to fetch form"
    )
  }
  /** Performs fetch request - get all fields corresponding to form specified by id */
  async function fetchFormFields() {
    fetchData(
      () => getFormFields(id), 
      setField, 
      setError, 
      "Failed to fetch form fields"
    )
  }
  /* Checks that field is valid */
  const checkNewField = (newField, setError) => {
    const FIELD_ERROR = {
      missing: {
        name: "missing form name", 
        field_type: "missing field type",  
        order_index: "missing order index"
      }, 
      invalid: {
        dropdown: "please ensure that dropdown name is not empty and that you have at least two options"
      }
    }
    /* Checking for missing */
    const missingKey = Object.keys(FIELD_ERROR.missing).find((key) => !newField[key]);
    const invalidDropdown = (newField.field_type === 'dropdown') 
      && (!newField.options?.name
        || newField.options?.array.length < 2);
    
    let result = null;
    if (missingKey) {
      result = FIELD_ERROR.missing[missingKey];
    } else if (invalidDropdown) {
      result = FIELD_ERROR.invalid.dropdown;
    }
    setError(result);
    return !!result; // true if an error occurred
  }

  /* Loading in form detailed, including associated forms */
  useEffect(() => {fetchForm(); fetchFormFields()}, []);  

  return (
    <CustomPageContainer>
    <View style={{
      flex:1, 
      backgroundColor: colors.grayLight, 
      justifyContent:'center',
      alignItems:'center', 
      }}
    >
      <View style={{width: "85%"}}>
        { // Form Details 
          (data.form) ? (
            <FormCard
              form={data.form[0]}
              disableActions={true}
            />
          ) : (
              <>
                 <FormAlert message={"Form failed to load"}/>
              </>
          )
        }
        {/* Fields Title */}
        <View style={{flex: 1, alignItems: 'center', justifyContent: "center"}}>
          <Text variant="headlineLarge" style={{color: colors.purple, marginBottom: 5}}>Fields</Text>
        </View>

        { // Display all fields associated with form 
          (data.fields && data.fields.length) ? (
                data.fields.map((field) => (
                  <View key={field.id}>
                    <FieldCard field={field} refreshTrigger={fetchFormFields}/>
                  </View>
                ))
          ) : (
            <>
              {/* Notify User That Form Has No Fields */}
              <FormAlert message={"Form has no fields!"}/>
            </>
          )
        }
        {/* Form for adding new field */}
        <NewFieldForm 
          form_id={id}
          fieldCount={data.fields?.length ?? 0}
          fieldChecker={(field, setError)=>checkNewField(field, setError)} 
          refreshTrigger={fetchFormFields}/>
      </View>
    </View>
    </CustomPageContainer>
  )
}

// TODO: Consider both for myForms instead: 
//      (2)  Don't forget to include some form of validation for required and is_num (probably include a pop-up asking
//                for confirmation if either are left untouched )

// Optional: refresh NewFieldForm values one submission is successfully => update the fetchCreateField 
// include validation that dropdownname and dropdownarray are populated if the dropdown option is selected


/* Bottem Sliders */
// Adds a new form
function NewFieldForm({ form_id, fieldCount, fieldChecker, refreshTrigger }) {
  const [error, setError] = useState(null);
  /* Selected option to be removed */
  const [deleteOption, setDeleteOption] = useState(null);
  /* Stores New Field Values */
  const [field, setField] = useState({ 
    name: null, 
    field_type: null, 
    options: {
      name: "", // dropdownName
      array: [], //options
    }, 
    required: false, 
    is_num: false, 
    order_index: fieldCount + 1, 
  });

  /** Field Setters */
  const setFieldName = (name) => setField((prev) => ({...prev, name: name}))
  const setFieldType = (type) => setField((prev) => ({...prev, field_type: type}))
  const setFieldOptionName = (name) => setField((prev) => ({
    ...prev, options: {
      ...prev.options, name: name
    }
  }))

  /* appends a single or a list of values */
  const setFieldOptionArrayAdd = (commaList) => setField((prev) => ({
    ...prev, options: {
      ...prev.options,
      array: [
        ...prev.options.array, 
        ...commaList.split(",").map(s=>s.trim()).filter(Boolean)
      ]
    }
  }));

  const setFieldOptionArrayRemove = (data) => setField((prev) => ({
    ...prev, options: {
      ...prev.options, array: [...prev.options.array.filter(option=> option !== data)]
    }
  }))
  const setFieldRequired = (value) => setField((prev) => ({...prev, required: value}))
  const setFieldNum = (value) => setField((prev) => ({...prev, is_num: value}))

  /* Toggles NewOptionForm visibility */
  const [newOptionVisible, setNewOptionVisible] = useState({
    add: false, 
    remove: false,
    invalid_field: false, // invalid field detected
  });
  const showNewOptions = (popUp) => setNewOptionVisible((prev)=>({...prev, [popUp]: true})); 
  const hideNewOptions = (popUp) => setNewOptionVisible((prev)=>({...prev, [popUp]: false}));

  /** Perform fetch request - creates a new field */
  async function fetchCreateField(form_id, newField) {
    await fetchData(
      ()=>insertField(form_id, newField), 
      ()=>{}, 
      setError, 
      "Failed to create new field"
    );
    refreshTrigger();
    // TODO: make this work
    // if (error === null) {
    //   // successfully added - refresh editor 
    //   setField({
    //     name: null, 
    //     field_type: null, 
    //     options: {
    //       name: "", // dropdownName
    //       array: [], //options
    //     }, 
    //     required: false, 
    //     is_num: false, 
    //     order_index: fieldCount + 1, 
    //   })
    // }
  }
  
  return (
      <BottomSliderForm title={"Add Field"} 
        onSubmit={async () => {
          const output = fieldChecker(field, setError)
          if (output) showNewOptions("invalid_field")
          else await fetchCreateField(
            form_id, 
            {...field, options: { [field.options.name]: [...field.options.array] }}
            )
        }}>
       {/* Prompt User: Field name */}
       <TextInput 
          label="Please enter field name"
          value={field.name}
          onChangeText={setFieldName}
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

          {/* Prompt user: field type */}
          <Picker
            selectedValue={field.field_type}
            onValueChange={(value) => setFieldType(value)}
          >
            <Picker.Item label={'--- please select field type ---'} value={null}/>
            <Picker.Item label={'text'} value={'text'}/>
            <Picker.Item label={'multiline'} value={'multiline'}/>
            <Picker.Item label={'dropdown'} value={'dropdown'}/>
            <Picker.Item label={'location'} value={'location'}/>
            <Picker.Item label={'camera'} value={'camera'}/>
          </Picker>

          {/* Display All Currently Added Option */}
          {(field.field_type === "dropdown") && (
            <>
              {(field.options.array?.length) ? (
                <>
                  <TextInput
                    label="Please enter dropdown name"
                    value={field.options.name}
                    onChangeText={setFieldOptionName}
                      theme={{
                        colors: {
                          onSurfaceVariant: colors.darkPurple
                        },
                      }}
                    textColor="black"
                    style={{
                        marginBottom: 16,
                        backgroundColor: colors.white,
                      }} />
                  <OptionsDisplay
                    options={field.options.array}
                    showRemovePopUp={() => showNewOptions("remove")}
                    setDeleteOption={setDeleteOption} />
                  </>
              ) : (
                  <FormAlert message={"You currently have no options"} />
              )}
            </>
          )}

          {/* Checkboxes - required and is_num */}
          <Surface elevation={0} style={{
            flexDirection: "row", 
            alignItems: "center",
            justifyContent: "center",
            marginVertical: 5
          }}>
            {/* Required checkbox */}
            <Surface elevation={0} style={{
              flexDirection: "row", 
              alignItems: "center", 
              marginHorizontal: 20
            }}>
              <Checkbox 
                status={field.required ? "checked" : "unchecked"}
                onPress={()=>setFieldRequired(!field.required)}
              />
              <Text style={{color: colors.black}}>Required</Text>
            </Surface>
            {/* Is Number checkbox */}
            <Surface elevation={0} style={{
              flexDirection: "row", 
              alignItems: "center",    
              marginHorizontal: 20
            }}>
              <Checkbox 
                status={field.is_num ? "checked" : "unchecked"}
                onPress={()=>setFieldNum(!field.is_num)}
              />
              <Text style={{color: colors.black}}>Is number</Text>
            </Surface>
          </Surface>

          {/* 'Add Options' Action Button */}
          {(field.field_type === "dropdown") && ( 
            <>
              <Button mode='outlined'
                textColor={colors.darkPurple}
                onPress={()=>showNewOptions("add")}
                style={{ marginVertical: 5 }}>
                  Add option
              </Button> 
            </>
          )}        

          {/* Pop up editors for adding or removing an option */}
          <AddOptionPopUp 
            visible={newOptionVisible.add}
            hidePopUp={()=>hideNewOptions("add")}
            setFieldOptionArrayAdd={(e) => setFieldOptionArrayAdd(e)}
          />
          <RemoveOptionPopUp
            option={deleteOption}
            visible={newOptionVisible.remove}
            hidePopUp={()=>hideNewOptions("remove")}
            setFieldOptionArrayRemove={(e) => setFieldOptionArrayRemove(e)}
          />

          {/* Alert pop-ups */}
          <AlertInvalidFieldPopUp 
            visible={newOptionVisible.invalid_field}
            error={error}
            hidePopUp={()=>hideNewOptions("invalid_field")}
          />
      </BottomSliderForm>
  );
}

/* Pop Ups */

/* Pop up for removing an option - done by pressing on the option surface */
function RemoveOptionPopUp({ option, visible, hidePopUp, setFieldOptionArrayRemove }) {
  return (
    <>
      <CustomPopUp
        title={`Delete ${option}?`}
        message={`Are you sure you want to remove ${option} from your dropdown?`}
        visible={visible}
        hideAlert={hidePopUp}
      >
        <Button 
          mode="contained" 
          buttonColor="red"
          style={{marginVertical: 10}}
          onPress={()=>{
            setFieldOptionArrayRemove(option);
            hidePopUp();
          }}
        > 
          Delete
        </Button>
        <Button mode="contained" onPress={hidePopUp}>Cancel</Button>
      </CustomPopUp>
    </>
  );
}

// Pop-up for adding an option
function AddOptionPopUp({ visible, hidePopUp, setFieldOptionArrayAdd }) {
  const [newOption, setNewOption] = useState("");
  return (
    <>
      <CustomPopUpFormContainer
        title={"Add Dropdown Option"}
        visible={visible}
        hidePopUp={hidePopUp}
        style={{ backgroundColor: colors.white }}
      >
        <Surface elevation={0} style={{backgroundColor: colors.white}}>
          {/* Prompt User to add new option */}
          <TextInput 
            label={"Please enter option name"}
            value={newOption}
            onChangeText={(e)=>setNewOption(e)}
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
          <View style={{flexDirection: "row", justifyContent: "center"}}>
             <Button mode="outlined" 
              style={{marginHorizontal: 2}}
              textColor={colors.darkPurple}
              onPress={hidePopUp}
            >
              Cancel
            </Button>
            <Button mode='contained' 
              style={{marginHorizontal: 2}}
              onPress={() => {
                hidePopUp();
                setFieldOptionArrayAdd(newOption);
                setNewOption("");
              }}
            >
              Add
            </Button>
          </View>
        </Surface>
      </CustomPopUpFormContainer>
    </>
  );
}

// Alert Pop Up Notifying Invalid Field Error 
function AlertInvalidFieldPopUp({ visible, error, hidePopUp }) {
  return (
    <>
      <CustomPopUp
        title={"Invalid Field"}
        message={""}
        visible={visible}
        hideAlert={hidePopUp}
      >
        <FormAlert
          message={error}
        />
        <Button
          mode="contained"
          onPress={hidePopUp}
        >
          Okay
        </Button>
      </CustomPopUp>
    </>
  );
}


/* Others */ 
function OptionsDisplay({ options, showRemovePopUp, setDeleteOption}) {
  return (
    <>  
      <Surface style={{  
        flexDirection: "column",
        alignItems: "center",
        padding: sizes.padding / 2,
        marginBottom: sizes.padding,
        borderRadius: sizes.radius,
        backgroundColor: colors.lighterPurple,
        borderColor: colors.darkPurple
        }}>
          {/* Options Display Title */}
          <Text 
            variant='titleMedium'
            style={{
              color: colors.white,
            }}>Added Options
          </Text>
          {/* Title underline */}
          <View  variant="titleSmall"
            style={{
              height: 2,
              backgroundColor: colors.white,
              width: "90%", // how wide you want the underline
              marginTop: 4,
              marginBottom: 8,
            }}/>
          {/* Listing out all added options */}
          { options.map((option) => (
            <TouchableRipple key={`${option}`}
              onPress={()=>{
                setDeleteOption(option);
                showRemovePopUp("remove") 
              }}
              style={{
                padding: 10,
              }}
            >
              <Text key={`${option}`}
                style={{
                  color: colors.white, 
                  marginVertical: 10, 
                  fontSize: 15}}
              >{option}
              </Text>
            </TouchableRipple>
        
          ))}
      </Surface>
    </>
  );
}

function FormAlert({message}){
  return (
    <CustomAlertCard message={message}/>
  );
}