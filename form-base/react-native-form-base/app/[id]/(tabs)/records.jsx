import { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
/* Styling  */
import { View } from 'react-native';
import { Text, Surface, TextInput, Button } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { colors, sizes } from "../../../data/theme";
/* Icons */
import { AntDesign } from '@expo/vector-icons';
/* Components */
import FormCard from '../../../components/FormCard';
import RecordCard from '../../../components/RecordCard';
import LocationInput from '../../../components/LocationInput';
import CameraInput from '../../../components/CameraInput';
import FilterBuilder from '../../../components/FilterBuilder';
import FilterViewButton from '../../../components/FilterViewButton';
/* Custom Components */
import BottomSliderForm from '../../../customComponents/BottomSliderForm';
import CustomPageContainer from '../../../customComponents/customPageContainer';
import CustomPopUp from '../../../customComponents/CustomPopUp';
import CustomAlertCard from '../../../customComponents/CustomAlertCard';
/* api Requests */
import { getForm } from '../../../formbase-api/form';
import { getFormRecords, insertRecord } from '../../../formbase-api/record';
import { getFormFields } from '../../../formbase-api/field';
import { filterRecords, isNumber } from '../../../formbase-api/filterbuilder';
import { fetchData } from '../../../formbase-api/fetchers';


export default function Records() {
    const { id } = useLocalSearchParams();
    const [filterQuery, setFilterQuery] = useState(null);
    /* Handles Visible state of Filter Builder Pop Up */
    const [visible, setVisisble] = useState(false);
    const showPopUp = () => setVisisble(true);
    const hidePopUp = () => setVisisble(false);
    /* Toggle between displaying all records or filtered records */
    const [displayFiltered, setDisplayFiltered] = useState(false)
    /* Stores all records associated with form specified by id */
    const [data, setData] = useState({
      form: null,
      fields: [],
      records: [], 
      filteredRecords: [],
      fieldNames: [],
      cameraFieldNames: [],
      error: null
    });
    /** Set data.form */
    const setForm = (data) => setData((prev) => ({...prev, form: data}));
    /** Set data.fields */
    const setFields = (data) => setData((prev) => ({...prev, fields: data}));
    /** Set data.records */
    const setRecords = (data) => setData((prev) => ({...prev, records: data})); 
    /** Set data.filteredRecords */
    const setFilteredRecords = (data) => setData((prev) => ({...prev, filteredRecords: data}))
    /** Set data.fieldNames */
    const setFieldNames = (data) => setData((prev) => ({...prev, fieldNames: data}))
    /** Set data.imageFields  */
    const setCameraFields = (data) => setData((prev) => ({...prev, cameraFieldNames: data}));
    /** Set data.error */
    const setError = (err) => setData((prev) => ({...prev, error: err}));

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
          setFields, 
          setError, 
          "Failed to fetch form fields"
        )
      }
    /** Performs fetch request - get all records */
    async function fetchFormRecords() { 
      fetchData(
        () => getFormRecords(id), 
        setRecords, 
        setError,
        "Failed to fetch form records"
      )
    }
    /* Load in data*/
    useEffect(()=>{
      fetchForm(); 
      fetchFormFields();
      fetchFormRecords();
    }, []);

    /* populate data.cameraFields and data.FieldsName */
    useEffect(() => {
      /* populate data.cameraFields */
      const cameraFields = data.fields.filter((field) => field.field_type === 'camera');
      const cameraNames = []
      cameraFields.forEach((field)=>{cameraNames.push(field.name)})
      setCameraFields(cameraNames);
      /* populate data.fieldnames*/
      const fieldNames = [];
      data.fields.forEach((field)=>fieldNames.push(field.name))
      setFieldNames(fieldNames);
    }, [data.fields]);
    /*  Send fetch request to retrieve filtered records and populate result to data.filteredRecords */
    useEffect(() => {
      (async () => {
        await fetchData(
          ()=>filterRecords(id, filterQuery), 
          setFilteredRecords, 
          setError, 
          "Failed to filter records"
        )
      })();
    }, [filterQuery]);

    return (
      <>
        <CustomPageContainer>
          <View style={{
            flex: 1,
            backgroundColor: colors.grayLight,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          >
            <View style={{ width: "85%" }}>
              {// Form Details 
                (data.form) ? (
                  <FormCard
                    form={data.form[0]}
                    disableActions={true} />
                ) : (
                  <>
                    <FormAlert message={"Form failed to load"} />
                  </>
                )}

              {(displayFiltered) ? (
                <RecordDisplay title={"Filtered Results"} data={data.filteredRecords} />
              ) : (
                <RecordDisplay title={"Records"} data={data.records} />
              )}

              {/* Pop-up form for creating a filter */}
              {(displayFiltered) && (
                 <View style={{ justifyContent: 'center', alignItems: "center" }}>
                  <Button mode="outlined" textColor={colors.darkPurple}
                    onPress={showPopUp}
                    style={{ marginBottom: 10 }}
                  >
                    Filter Records
                  </Button>
                </View>
              )}

              {(data.fields && data.fields.length > 0) && (
                <FilterBuilder
                      visible={visible}
                      hidePopUp={hidePopUp}
                      fieldNames={data.fieldNames}
                      fields={data.fields}
                      saveTo={(e) => setFilterQuery(e)} />
              )}
            

              {/* Form for adding new record */}
              <NewRecordForm form_id={id} fields={data.fields} refreshTrigger={fetchFormRecords} />
            </View>
          </View>
        </CustomPageContainer>
         <FilterViewButton
            toggleIcon={displayFiltered}
            onPress={() => (displayFiltered) ? setDisplayFiltered(false) : setDisplayFiltered(true)} />
      </>

    );
}

function RecordDisplay({ title, data }) {
  return (
    <>
      {/* Display Title */}
      <View style={{flex: 1, alignItems: 'center', justifyContent: "center"}}>
        <Text variant="headlineLarge" style={{color: colors.purple, marginBottom: 5}}>{title}</Text>
      </View>
      {/* *Display records from data */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {
          (data && data.length) ? (
            data.map((record) => (
              <View key={`${record.id}`}>
                <RecordCard record={record} cameraFieldNames={data.cameraFieldNames} refreshTrigger={()=>{}} />
              </View>   
            ))) : (
              <>
                <FormAlert message={"No record meet your filter description!"}/>
              </>
            )
        }  
      </View>
    </>
  );
}


function FormAlert({message}){
  return (
    <Surface style={{flexDirection: "column",
      alignItems: "center",
      padding: sizes.padding / 2,
      marginBottom: sizes.padding,
      borderRadius: sizes.radius,
      }}>
        <AntDesign 
          name="exclamation-circle"
          size={50}
          color={"red"}
          elevation={5}
        />
        <Text style={{color: "red"}}>{message}</Text>
    </Surface>
  );
}

// adds new record
function NewRecordForm({ form_id, fields, refreshTrigger}) {
  const [visible, setVisisble] = useState(false);
  const [error, setError] = useState(null)
  const [newRecord, setNewRecord] = useState({});
  /** Setter function: Adds attribute and corresponding value to newRecord object */
  const addToRecord = (fieldName, value) => setNewRecord((prev)=>({...prev, [fieldName]: value}))
  /** Performs fetch request - createa a new record */
  async function fetchCreateRecord(formId, newRecord) {
    await fetchData(
      ()=>insertRecord(formId,{ values: {...newRecord}}),
      ()=>{}, 
      setError, 
      "Failed to create a new record"
    );
    refreshTrigger();
  }

  /** Determines if newRecord is valid */
  const isNewRecordValid = () => {
    // determining all fields marked as is_required: 
    const requiredFields = fields.filter((field) => field.required);
    const isNumFields = fields.filter((field) => field.is_num);
   
   // you need some way to iteratre through all newRecord attributes
    const entries = Object.entries(newRecord);
    
    requiredFields.forEach(
      (field) => {
        // entry is missing (i.e. !value) for a required key (i.e. field.name)
        if (entries.find(([key, value]) => key === field.name && !value)) return false;
      }
    );

    isNumFields.forEach(
      (field) => {
        // incompatiable field data type and value (text supplied to a is_num field (or vice versa))
        if (entries.find(([key, value]) => key === field.name && !isNumber(value)))  return false
      }
    );
    return true;
  }

  return (
    <><BottomSliderForm title={"Add Record"} onSubmit={async () => {
      (!isNewRecordValid())
        ? setVisisble(true)
        : await fetchCreateRecord(form_id, newRecord);
    } }>
      {fields.map((field) => {
        if (field.field_type === 'dropdown') {
          const entries = Object.entries(field.options);
          return (
            /* dropdown input */
            <View key={field.id}>
              <Text variant='labelSmall' style={{ color: colors.purple, marginLeft: 15, fontSize: 13 }}>{entries[0][0]}</Text>
              <Picker
                selectedValue={newRecord[field.name] ?? null}
                onValueChange={(e) => addToRecord(field.name, e)}
              >
                <Picker.Item key={`${field.id}-prompt`} label={'--- please select field type ---'} value={null} />
                {entries[0][1].map((option) => (<Picker.Item key={`${field.id}`} label={option} value={option} />))}
              </Picker>
            </View>

          );
        }
        else if (field.field_type === 'location') return (
          /* Getting User's Current Location */
          <View key={`${field.id}`}>
            <LocationInput
              setData={(e) => addToRecord(field.name, e)} />
          </View>
        );
        else if (field.field_type == 'camera') return (
          /* Prompting User To Take An Camera Image */
          <View key={`${field.id}`}>
            <CameraInput saveTo={(e) => addToRecord(field.name, e)} />
          </View>
        );
        else return (
          /* Text or Multiline input */
          <TextInput
            key={field.id}
            label={field.name}
            onChangeText={(e) => (field.is_num) ?  addToRecord(field.name, Number(e)) : addToRecord(field.name, e)}
            multiline={((field.field_type === 'multiline') ? true : false)}
            keyboardType={((field.is_num) ? "numeric" : "default")}
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
        );
      })}
    </BottomSliderForm>
    <AlertInvalidRecordFilterPopUp visible={visible} hidePopUp={()=> setVisisble(false)}/></>
  );
}

function AlertInvalidRecordFilterPopUp({ visible, hidePopUp }) {
  return (
    <>
      <CustomPopUp
        title={"Invalid Record"}
        message={""}
        visible={visible}
        hideAlert={hidePopUp}
      >
        <CustomAlertCard
          message={"Please ensure that all required fields are filled and that all numerical inputs are nummerical"}
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