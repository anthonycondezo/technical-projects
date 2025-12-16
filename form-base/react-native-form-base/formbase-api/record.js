import apiRequest from "./api-request";

const recordEndpoint = "/record";

/**
 * Function returns an array of all forms from Form table
 * 
 * @returns {Promise<object[]>} - An array of form objects 
 */
export async function getRecords() { return apiRequest(recordEndpoint); }

/**
 *  Function returns an array of all records that corresponds to a form specified by formId
 * 
 * @param {Interger} formId - The form_id of the desired form
 * @returns {Promise<object[]>} - An array of record objects
 */
export async function getFormRecords(formId) { return apiRequest(`${recordEndpoint}?form_id=eq.${formId}`); }

/**
 * Function to insert a single record (book entry) into the form.
 * 
 * @param {number} formId - The ID of the form to attach this record to.
 * @param {object} record - The record data (with a "values" object).
 * @returns {Promise<object>} - The created record object.
 */
export async function insertRecord(formId, record) {
  return apiRequest(recordEndpoint, "POST", {
    ...record,
    form_id: formId,
  });
}

/**
 * Function deletes record specified by provided id
 * 
 * @param {Integer} id - The is of record to be deleted
 * @returns {Promise<object>} - The form that was successfully deleted, null otherwise. 
 */
export async function deleteRecord(id) {
  return apiRequest(`${recordEndpoint}?id=eq.${id}`, "DELETE")
}
