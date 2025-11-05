import {useState, useEffect } from 'react'
import { useLocalSearchParams } from 'expo-router';
/* Styling */
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper'
import { colors } from '../../../data/theme';
/* Components */
import MapView from 'react-native-maps';

/* Custom Components */
import CustomMapMarker from '../../../customComponents/CustomMapMarker';
/* api Requests */
import { findLocationFieldType, findAllLocationFields, findAllCameraFields } from '../../../formbase-api/field';
import { getFormRecords } from '../../../formbase-api/record';
import { fetchData } from '../../../formbase-api/fetchers'

function Map() {
  const { id } = useLocalSearchParams();
  const [error, setError] = useState(null)
  /** Stores fields and records associated with form specified by id */
  const [data, setData] = useState({
    hasLocationField: false,
    locationFields: [],
    cameraFields: [],
    cameraFieldNames: [], 
    records: [],
  })

  /** Setter function - data.hasLocationField */
  const setHasLocation = (value) => setData((prev) => ({...prev, hasLocationField: value}));
  const setLocationFields = (data) => setData((prev) => ({...prev, locationFields: data }));
  const setCamerFields = (data) => setData((prev) => ({...prev, cameraFields: data}));
  const setCamerFieldNames = (data) => setData((prev) => ({...prev, cameraFieldNames: data}))
  /** Set data.records */
  const setRecords = (data) => setData((prev) => ({...prev, records: data})); 

  /* Query database to determine if there exists at least one field that is of field_type = "location" */
  useEffect(() => { 
    fetchData(
        ()=>findLocationFieldType(id), 
        (value)=>setHasLocation(value), 
        setError, 
        "Failed to determine if form has a field of location type"
      ) 
  }, []);

    /** Performs fetch request - get all records */
    async function fetchFormRecords() { 
      fetchData(
        () => getFormRecords(id), 
        setRecords, 
        setError,
        "Failed to fetch form records"
      )
    }
    /** Performs fetch request - ger all location fields only  */
    async function fetchAllLocationFieldsOnly() {
      fetchData(
        ()=>findAllLocationFields(id), 
        setLocationFields, 
        setError, 
        "Failed to fetch all locations fields associated with form"
      ) 
    }
    /** Performs fetch request - gets all camera fields only */
    async function fetchAllCameraFieldsOnly() {
      fetchData(
        ()=>findAllCameraFields(id),
        setCamerFields, 
        setError, 
        "Failed to fetch any associated camera fields"
      )
    }

    /* Load in data only if locations exists */
    useEffect(()=>{
      fetchFormRecords();
      fetchAllLocationFieldsOnly();
      fetchAllCameraFieldsOnly();
    }, [data.hasLocationField]);
    /* Populate data.cameraFieldNames */
    useEffect(() => {
      const names = []
      data.cameraFields.forEach((field)=>{names.push(field.name)})
      setCamerFieldNames(names);
    }, [data.cameraFields]);

  return (
    <View style={styles.container}>
      {(data.hasLocationField) ? (
        <>
          {/* Renders Map */}
          <MapView 
            style={styles.map}
            initialRegion={initialRegion}
          >
            {(data.records && data.records.length > 0)  
              && (data.locationFields && data.locationFields.length > 0) 
              && (
                <>
                  {data.locationFields.map((field) => (
                    data.records.map((record) => (
                      <View key={`${field.id}-${record.id}`}>
                        <CustomMapMarker 
                          record={record} 
                          cameraFieldNames={data.cameraFieldNames} 
                          locationField={field.name}/>
                      </View>
                    ))
                  ))}
                </>
            )}
          </MapView>
        </>
      ) : (
        <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
          <Text style={{color: colors.black}}>Field does not have any field of location type.</Text>
        </View>
      )
    }
    </View>
  );
}

// TODO: allow images to be displayed

export default Map;

  /* UQ St Lucia Campuse Coordinates */
  const initialRegion = {
    latitude: -27.4975, 
    longitude: 153.0137,
    latitudeDelta: 0.01, // campus-level zoom
    longitudeDelta: 0.01,
  };

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});