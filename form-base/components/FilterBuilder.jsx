import { useState, useEffect } from 'react';
/* Styling */
import { View } from 'react-native'
import { Text, Button, Surface, TextInput, TouchableRipple, Checkbox } from 'react-native-paper';
import { colors, sizes } from '../data/theme';
/* Components */
import { Picker } from '@react-native-picker/picker';
/* Custom Components */
import CustomPopUp from '../customComponents/CustomPopUp';
import CustomPopUpFormContainer from '../customComponents/CustomPopupFormContainer';
import CustomAlertCard from '../customComponents/CustomAlertCard';
/* For Building Filter String */
import { filterBuilder, join, isStringCondition, isValidFilter } from '../formbase-api/filterbuilder';

/** Constant Flags */
const AND = "AND"
const OR = "OR"

//  NOTE: FilterBuilder DOES NOT perform the filtering fetch request, rather it only constructs the filtering url string
//        that is TO BE appended to /records?form_id=eq.${formId}&
//
//        The actual filtering fetch request is performed by record compoennt

/**
 * @param {Boolean} param0 - track visibility state of pop up 
 * @param {Function} param1 - a callback function which sets visble to false
 * @param {Function} param2 - a callback function which saves filtering url string to parent component
 * @param {String[]} param3 - an array of field name strings of that pertain to some form 
 * @returns A pop-up that allowes user to create and delete filters
 */
function FilterBuilder({ visible, hidePopUp, saveTo, fieldNames, fields }) { // TODO: might need to supply fields instead of fieldname to get the is_num of the field too
    /* Toracks visibility of AddFilterPopUp and RemoveFilterPopUp component */
    const [visibility, setVisibility] = useState({
        add: false, 
        remove: false
    });
    /* visibility setter functions */
    const showAction = (type) => setVisibility((prev) => ({...prev, [type]: true})); 
    const hideAction = (type) => setVisibility((prev) => ({...prev, [type]: false}));
    /* Selected filter condition to be removed */
    const [deleteFilter, setDeleteFilter] = useState(null);
    /* Stores all filtering conditions */
    const [filters, setFilters] = useState({
        joinOn: AND, 
        case: false, 
        /* each array will store [fieldName, value] tuples */
        string: { // string based filters
            contain: [], 
            identical: [], 
            startWith: []
        }, 
        numerical: { // nuermical based filters
            lessThan: [], 
            lessThanEqual: [], 
            greaterThan: [], 
            greaterThanEqual: [], 
            equal: []
        }
    })
    /** Setter - filters.string: appends to existing collection */
    const addToString = (condition, args) => setFilters((prev) => ({
        ...prev, string: {
            ...prev.string, [condition]: [...prev.string[condition], args]
        }
    }));
    /** Setter - filters.numerical: appends to existing collection */
    const addToNumerical = (condition, args) => setFilters((prev) => ({
        ...prev, numerical: {
            ...prev.numerical, [condition]: [...prev.numerical[condition], args]
        }
    }));
    /** Setter - filters.string: removes tuple from existing collection */
    const removeFromString = (condition, args) => setFilters((prev) => ({
        ...prev, string: {
            ...prev.string, [condition]: [...(prev.string[condition].filter(
                ([fieldName, value]) => fieldName != args[0] || value != args[1]
            ))]
        }
    }));
    /** Setter - filters.numerical: removes tuple from existing collection */
    const removeFromNumerical = (condition, args) => setFilters((prev) => ({
        ...prev, numerical: {
            ...prev.numerical, [condition]: [...(prev.numerical[condition].filter(
                ([fieldName, value]) => fieldName != args[0] || value != args[1]
            ))]
        }
    }));

    /** Generic Setter Function - fields */
    /* Saves filter expresion: filterCondition, [fieldName, value] on filters appropiately */
    const addToFilters = (condition, args) => {
        return (isStringCondition(condition)) 
            ? addToString(condition, args) 
            : addToNumerical(condition, args)
    } 
    /** Removes filter expression: filterCondition, [fieldName, value] on filters appropiately */
    const removeFromFilters = (condition, args) => {
        return (isStringCondition(condition)) 
            ? removeFromString(condition, args) 
            : removeFromNumerical(condition, args)
    }
    /** Function generates the filtering url string intended to be appended to /records?form_id=eq.${formId}& */
    const makeFilterUrl = () => {
        const urlConditions = [] // stores a collection of url filtering string (e.g. values->>"category"=ilike.*JavaScript* )
        const builder = filterBuilder(filters.joinOn, filters.case);
        /** 
         * A generic function that appends supplied type (i.e. string or numerical), condition (e.g. contain, identical)
         * args (i.e. [fieldname, valueToFilterAgainst]) to it appropiate filtering url string
         *  */
        const append = (type, condition, args) => urlConditions.push(builder[type][condition](args[0], args[1]))
        /* append string filters */
        const stringEntries = Object.entries(filters.string);
            stringEntries.forEach(([condition, collection]) =>
             collection.forEach((args) => append("string", condition, args))
        );
        /* append numerical filters */
        const numericalEntries = Object.entries(filters.numerical);
            numericalEntries.forEach(([condition, collection]) =>
            collection.forEach((args) => append("numerical", condition, args))
        );
        return join(filters.joinOn, ...urlConditions) 
    }
    return (
        <CustomPopUpFormContainer
            title={"Filters"}
            visible={visible}
            hidePopUp={hidePopUp}
            style={{ backgroundColor: colors.white }}
        >
            {/* Filtering All Filters By String And Numeric Type */}
            <View>
                {/* String Filters */}
                <FilterDisplay 
                    title={"Added String Filters"} 
                    filters={filters?.string}
                    setDeleteFilter={setDeleteFilter}
                    showRemovePopUp={() => showAction("remove")}
                />
                {/* Numerical Filters */}
                <FilterDisplay 
                    title={"Added Numerical Filters"} 
                    filters={filters?.numerical}
                    setDeleteFilter={setDeleteFilter}
                    showRemovePopUp={() => showAction("remove")}
                />
            </View>

            {/* Checkboxes - toggle filters.joinOn and filters.caseSensitiity */}
            {/* Join On - AND filter conditions together */}
            <Surface elevation={0} style={{
              flexDirection: "row", 
              alignItems: "center", 
              marginHorizontal: 20
            }}>
                <Checkbox 
                    status={filters.joinOn === AND ? "checked" : "unchecked"}
                    onPress={()=>setFilters((prev) => ({...prev, joinOn: AND}))}
                />
                <Text style={{color: colors.black}}> AND conditions together </Text>
                
            </Surface>
            {/* Join On - OR filter conditions together */}
            <Surface elevation={0} style={{
              flexDirection: "row", 
              alignItems: "center", 
              marginHorizontal: 20
            }}>
                <Checkbox 
                    status={filters.joinOn === OR ? "checked" : "unchecked"}
                    onPress={()=>setFilters((prev) => ({...prev, joinOn: OR}))}
                />
                <Text style={{color: colors.black}}> OR conditions together </Text>
            </Surface>
            {/* Join On - Enable Case Sensitivity */}
            <Surface elevation={0} style={{
              flexDirection: "row", 
              alignItems: "center", 
              marginHorizontal: 20
            }}>
                <Checkbox 
                    status={filters.case ? "checked" : "unchecked"}
                    onPress={()=>setFilters((prev) => ({...prev, case: !prev.case}))}
                />
                <Text style={{color: colors.black}}> Enable case sensitivity </Text>
            </Surface>
            

            {/* Action Buttons - Add and Remove Filter */}
            <Button mode="outlined" 
                style={{marginHorizontal: 2, marginVertical: 5}}
                textColor={colors.darkPurple}
                onPress={() => showAction("add")}
            >
                Add Filter
            </Button>
            <Button mode="contained" 
                style={{marginHorizontal: 2, marginVertical: 5, backgroundColor: colors.darkPurple}}
                textColor={colors.white}
                onPress={()=>saveTo(makeFilterUrl())}
            >
               Submit
            </Button>

            {/* Pop Ups - Adding and Removing Filter */}
            <AddFilterPopUp 
                fieldNames={fieldNames}
                visible={visibility.add}
                hidePopUp={() => hideAction("add")}
                fields={fields}
                addToFilters={addToFilters}

            />
            <RemoveFilterPopUp 
                filter={deleteFilter}
                visible={visibility.remove}
                hidePopUp={() => hideAction("remove")}
                removeFromFilters={removeFromFilters}

            />
        </CustomPopUpFormContainer>
    );

}
export default FilterBuilder;

/** 
 * @param {String} param0 - Filtering display title
 * @param {Object} param1 - filters.string or filters.numerical
 * @param {Function} param2 - Callback function which toggles RemoveFilterPopUp visisbility 
 * @param {Fucntion} param3 - Callback function that can remove a specific filter from filters
 * 
 * @returns A component that displays all filters added by the user. Enables filter deletion functionality
 */
function FilterDisplay({title, filters, showRemovePopUp, setDeleteFilter}) {
    const entries = Object.entries(filters);
    return (
        <Surface style={{  
                flexDirection: "column",
                alignItems: "center",
                padding: sizes.padding / 2,
                marginBottom: sizes.padding,
                borderRadius: sizes.radius,
                backgroundColor: colors.lighterPurple,
                borderColor: colors.darkPurple
                }}>
            {/* Filter Display Title */}
            <Text 
                variant='titleMedium'
                style={{
                    color: colors.white,
                }}>{title}
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
            { entries.map(([condition, args]) => (
                (args && args.length > 0 ) && (
                    args?.map(([fieldName, value]) => (
                    <TouchableRipple key={`${condition}-${fieldName}-${value}`}
                        onPress={()=>{
                            setDeleteFilter({
                                condition: condition, 
                                args: [fieldName, value]
                            })
                            showRemovePopUp("remove") 
                        }}
                        style={{
                            padding: 10,
                        }}
                    >
                        <Text
                            style={{
                            color: colors.white, 
                            marginVertical: 10, 
                            fontSize: 15}}
                        >{`${condition}-${fieldName}: ${value}`}
                        </Text>
                    </TouchableRipple>
                ))) 
            ))}
        </Surface>
    );
}

/**
 * @param {Boolean} param0 - track visibility state of pop up 
 * @param {Function} param1 - a callback function which sets visble to false
 * @param {String[]} param2 - an array of field name strings of that pertain to some form 
 * @param {Function} param3 - callback function that saves new filter to filters
 *  
 * @returns A  pop up that allows user to add filters
 */
function AddFilterPopUp({ visible, hidePopUp, fieldNames, fields, addToFilters }) {
    const [error, setError] = useState(false);
    const [filter, setFilter] = useState({
        condition: null, 
        fieldName: null, 
        value: null
    })
    /* Setters */
    const setCondition = (condition) => setFilter((prev) => ({...prev, condition: condition}));
    const setFieldName = (name) => setFilter((prev) => ({...prev, fieldName: name}));
    const setValue = (value) => setFilter((prev) => ({...prev, value: value}))
    /** Returns the corresponding field.is_num value that corresponds to a field._name */
    const getIsNum = (fieldName) => {
        const result = fields?.find((field) => fieldName === field.name);
        return result.is_num
    }

    return (
        <CustomPopUpFormContainer
            title={"Add filter"}
            visible={visible}
            hidePopUp={hidePopUp}
            style={{ backgroundColor: colors.white }}
        >
            <Surface elevation={0} style={{ backgroundColor: colors.white }}>
                {/* Prompt User to add new filter-builder function */}
                <Picker
                    selectedValue={filter.condition}
                    onValueChange={(e) => setCondition(e)}
                > 
                    <Picker.Item label={'--- please select field type ---'} value={null}/>
                    <Picker.Item label={'Includes word'} value={'contain'}/>
                    <Picker.Item label={'Identical to word'} value={'identical'}/>
                    <Picker.Item label={'Starts with word'} value={'startWith'}/>
                    <Picker.Item label={'Less than'} value={'lessThan'}/>
                    <Picker.Item label={'Less than or equal to'} value={'lessThanEqual'}/>
                    <Picker.Item label={'Greater than'} value={'greaterThan'}/>
                    <Picker.Item label={'Greater than or equal to'} value={'greaterThanEqual'}/>
                    <Picker.Item label={'Equal to'} value={'equal'}/>
                </Picker>
                {/* Prompt User to choose a field name */}
                 <Picker
                    selectedValue={filter.fieldName}
                    onValueChange={(e)=> setFieldName(e)}
                > 
                    <Picker.Item label={'--- please select field type ---'} value={null}/>
                    {
                        fieldNames.map((name, index) => (
                            <Picker.Item key={`${name}-${index}`} label={name} value={name}/>
                        ))
                        
                    }
                </Picker>
                {/* Prompt User to select a value */}
                <TextInput 
                    label={"Please enter filtering value"}
                    value={filter.value ?? ""}
                    onChangeText={(e) => setValue(e)}
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
                {/* Action Buttons */}
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
                             if (!isValidFilter(filter.condition, getIsNum(filter.fieldName), filter.value)) { 
                                setError(true)
                                return
                            }
                            addToFilters(filter.condition, [filter.fieldName, filter.value]);
                            setFilter({
                                condition: null, 
                                fieldName: null, 
                                value: null
                            });
                            hidePopUp();
                        }}
                        >
                        Add
                    </Button>
                </View>
            </Surface>

            {/* Pop-Up Alert which notifies user of invlid filter */}
            <AlertInvalidFilterPopUp visible={error} hidePopUp={()=>setError(false)}/>
        </CustomPopUpFormContainer>
    );
}

/**
 * @param {Boolean} param0 - filter to be delteted (e.g) 
 * @param {Boolean} param1 - track visibility state of pop up 
 * @param {Function} param2 - a callback function which sets visible to false
 * @param {Function} param3 - callback function that removes filter from filters
 *  
 * @returns A  pop up that allows user to add filters
 */
function RemoveFilterPopUp({ filter, visible, hidePopUp, removeFromFilters }) {
    return (
        <>
        <CustomPopUp
            title={`Delete ${filter?.condition} filter?`}
            message={`Are you sure you want to remove ${filter?.condition}-${filter?.args[0]}-${filter?.args[1]} from your dropdown?`}
            visible={visible}
            hideAlert={hidePopUp}
        >
            <Button 
            mode="contained" 
            buttonColor="red"
            style={{marginVertical: 10}}
            onPress={()=>{
                removeFromFilters(filter?.condition, filter?.args);
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


function AlertInvalidFilterPopUp({ visible, hidePopUp }) {
  return (
    <>
      <CustomPopUp
        title={"Invalid Filter"}
        message={""}
        visible={visible}
        hideAlert={hidePopUp}
      >
        <CustomAlertCard
          message={"Created an invalid filter. Please ensure that condition type, field and value are all of either text or numerical based"}
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