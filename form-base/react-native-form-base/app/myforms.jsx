import { useState, useEffect } from 'react';
import { router } from 'expo-router';
/* Styling */
import { View, FlatList } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { colors, sizes } from "../data/theme";
/* Components */
import FormCard from '../components/FormCard';
/* Custom Components */
import BottomSliderForm from '../customComponents/BottomSliderForm';
import CustomAlertCard from '../customComponents/CustomAlertCard';
import CustomPopUp from '../customComponents/CustomPopUp';
/* api Requests */
import { createForm, getForms } from '../formbase-api/form'; 
import { fetchData } from '../formbase-api/fetchers';

export default function MyForms() {
  /* Array of forms fetched from database */
  const [forms, setForms] = useState({
    data: [],
    error: null
  });
  /** Set forms.data */
  const setData = (data) => setForms((prev) => ({...prev, data: data}));
  /** Set forms.error */
  const setError = (err) => setForms((prev) => ({...prev, error: err}));
  /**  Performs fetch request - gets all forms */
  async function fetchFormData() { fetchData(getForms, setData, setError, "Failed to fetch forms") }
  /* fetch forms */
  useEffect(() => { fetchFormData() }, []);

  return (
    <>
      <View style={{ flex: 1, backgroundColor: colors.grayLight }}>
        <FlatList
          data={forms.data}
          keyExtractor={form => form.id.toString()}
          renderItem={({ item }) => (
            <FormCard
              form={item}
              onPress={() => router.push(`${item.id}/(tabs)/form`)}
              refreshTrigger={fetchFormData}
            />
          )}
          style={{
            padding: sizes.padding,
          }}
        />
      </View>
      <View>
        <NewFormForm refreshTrigger={fetchFormData}/>
      </View>
    </>
  )
}

// TODO: use error to create an alert
function NewFormForm({ refreshTrigger }) {
  const [visible, setVisible] = useState(false)
  /* Fetch error tracker */
  const [error, setError] = useState(null);
  async function fetchCreateForm(newForm) { 
    await fetchData(
      () => createForm(newForm), 
      () => {}, 
      setError, 
      "Failed to create new form"
    ); 
    refreshTrigger(); // refresh page to show new form also
  }
  /* Tracks the formCreator fields */
  const [form, setForm] = useState({
    name: null, 
    description: null
  });
  /** Sets form.name */
  const setFormName = (name) => setForm((prev) => ({...prev, name: name})); 
  /** Sets from.description */
  const setFormDescription = (description) => setForm((prev) => ({...prev, description: description}));
  return (
    <>
      <BottomSliderForm title={"Create Form"} onSubmit={()=>
      (!form.name || !form.description) 
        ? setVisible(true)
        : fetchCreateForm(form)
      }>
         {/* Prompt user to add new form name */}
                <TextInput 
                  label="Please enter form name"
                  value={form.name}
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
                  value={form.description}
                  onChangeText={setFormDescription}
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
      </BottomSliderForm>
      <AlertInvalidFormPopUp visible={visible} hidePopUp={()=>setVisible(false)} />
    </>
  );
}

/**
 * 
 * @param {*} param0 
 * @returns 
 */
function AlertInvalidFormPopUp({ visible, hidePopUp }) {
  return (
    <>
      <CustomPopUp
        title={"Invalid Form"}
        message={""}
        visible={visible}
        hideAlert={hidePopUp}
      >
        <CustomAlertCard
          message={"Please fill out all fields to create a form"}
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