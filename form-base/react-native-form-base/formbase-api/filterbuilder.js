import apiRequest from "./api-request";

// Constants
const recordEndpoint = "/record";
const AND = "AND"
const STRING_CONDITIONS = ["contain", "identical", "startWith"]

/** determines supplied condition is a string or numerical condition */
export const isStringCondition= (condition) => (STRING_CONDITIONS.find((entry) => entry === condition)) ? true : false
/** Determines if supplied value (which is of type string) is a number or not */
export const isNumber = (value) => !Number.isNaN(Number(value)); // true if value is a number, false otherwise
/** Determines a filter if valid */
export const isValidFilter = (condition, fieldIsNum, value) => 
    // valid filter must have all string or numeric based compponets (i.e. conditions, fieldIsNum, value) - types cannot be mixeds
    isStringCondition(condition) && !fieldIsNum && !isNumber(value) || !isStringCondition(condition) && fieldIsNum && isNumber(value)

    
/** Performs record filtering request */
export async function filterRecords(form_id, query) {
    return apiRequest(`${recordEndpoint}?form_id=eq.${form_id}&${query}`)
}

/**
 * Joins all url filtering strings together under logical AND or OR 
 * 
 * @param {*} joinOn 
 * @param  {...any} conditions 
 * @returns The concatation of condition with delimiter "&" or wrapped within 
 *          "or=()" clause
 */
export const join = (joinOn, ...conditions) =>{
    /* joiners */
    const AND = (...conditions) => conditions.join("&")
    const OR = (...conditions) => `or=(${conditions.join(",")})`
    return (joinOn === "AND") 
        ? AND(...conditions) 
        : OR(...conditions)}

/**
 * Resultant object is intended to be used as a builder for building url strings (e.g. values->>"category"=ilike.*JavaScript* )
 * 
 * @param {String} joinOn - "AND" or "OR" string: denoting logical AND and OR respectively
 * @param {Boolean} caseSensitive - denotes wether case sensitivity is to be enabled for string based filtering conditions 
 * 
 * @returns And object that maps all url filtering string generating functions to a specified filtering condition
 */
export function filterBuilder(joinOn = AND, caseSensitive = false) {
    const equalOp = (joinOn == AND) ? "=" : ".";
    const likeOp = (caseSensitive) ? "like" : "ilike";
    return {
        string: { // string filters
            contain: (fieldName, value) => 
                `values->>"${fieldName}"${equalOp}${likeOp}.*${value}*`, 
            identical: (fieldName, value) =>
                 `values->>"${fieldName}"${equalOp}${likeOp}.${value}`, 
            startWith: (fieldName, value) =>
                `values->>"${fieldName}"${equalOp}${likeOp}.${value}*`, 
        },
        numerical: { // numerical filters
            lessThan: (fieldName, value) =>
                `values->"${fieldName}"${equalOp}lt.${value}`, 
            lessThanEqual: (fieldName, value) =>
                `values->"${fieldName}"${equalOp}lte.${value}`, 
            greaterThan: (fieldName, value) =>
                `values->"${fieldName}"${equalOp}gt.${value}`, 
            greaterThanEqual: (fieldName, value) =>
                `values->"${fieldName}"${equalOp}gte.${value}`, 
            equal: (fieldName, value) =>
                `values->"${fieldName}"${equalOp}eq.${value}`, 
        }
    } 
}


/* Older - Non Functional Implementation */
async function filterRecords_old(formId, joinOn = "AND", ...conditions) {
    const query = filterBuilder_old(recordEndpoint, formId, joinOn, ...conditions);
    console.log("query string is: ")
    console.log(query)
    console.log("api request response is: ")
    return await apiRequest(query)
}

/* Constructs Query String */
function filterBuilder_old(endpoint, formId, joinOn = "AND", ...conditions) {
    const query = `${endpoint}?form_id=eq.${formId}`;
    /* joiners */
    const AND = (...conditions) => conditions.join("&")
    const OR = (...conditions) => `or=(${conditions.join(",")})`
    return (joinOn === "AND") 
        ? query + "&" + AND(...conditions) 
        : query + "&" + OR(...conditions)
}

/* Numerical Conditions */
const lessThan = (fieldName, value, joinOn) => 
  `values->"${fieldName}"` + 
  `${(joinOn === "AND") ? "=": "."}` +
  `lt.${value}`
const lessThanEqual = (fieldName, value) => 
  `values->"${fieldName}"` +
  `${(joinOn === "AND") ? "=": "."}` +
  `lte.${value}`
const greaterThan = (fieldName, value) => 
  `values->"${fieldName}"` + 
  `${(joinOn === "AND") ? "=": "."}` +
  `gt.${value}`
const greaterThanEqual = (fieldName, value) => 
  `values->"${fieldName}"` + 
  `${(joinOn === "AND") ? "=": "."}` +
  `gte.${value}`
const equal = (fieldName, value) => 
  `values->"${fieldName}"` + 
  `${(joinOn === "AND") ? "=": "."}` +
  `eq.${value}`
