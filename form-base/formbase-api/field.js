import apiRequest from "./api-request";

const fieldEndpoint = `/field`;

/**
 * Functino returns an array of all fields that corresponds to a form specified by formId
 * 
 * @param {Integer} formId - The form_id od the desired form 
 * @returns {Promise<object[]>} - An array of field objects
 */
export async function getFormFields(formId) {return apiRequest(`${fieldEndpoint}?form_id=eq.${formId}`); }

/**
 * Function to insert a single field for the form.
 * Call this function once for each field you want to add.
 * 
 * @param {number} formId - The ID of the form to attach this field to.
 * @param {object} field - The field definition object.
 * @returns {Promise<object>} - The created field object.
 */
export async function insertField(formId, field) {
  return apiRequest(fieldEndpoint, "POST", {
    ...field,
    form_id: formId,
  });
}

/**
 * Function delete field specified by provided id
 * 
 * @param {Integer} id - The is of field to be deleted
 * @returns {Promise<object>} - The form that was successfully deleted, null otherwise. 
 */
export async function deleteField(id) {
  return apiRequest(`${fieldEndpoint}?id=eq.${id}`, 'DELETE');
}

/**
 * @param {Interger} formId - id of form of interest
 * @returns true if there exists a field that is of field_type = 'location'
 */
export async function findLocationFieldType(formId) {
  return (await findAllLocationFields(formId))?.length > 0 
}

/**
 * @param {Interger} formId - id of form of interest
 * @returns Returns an array of all fields that are of field_type = 'location' associated with form specified by formId
 */
export async function findAllLocationFields(formId) {
  const query = `${fieldEndpoint}?form_id=eq.${formId}` + 
  `&field_type=eq.location`
  return await apiRequest(query)
}

/**
 * @param {Interger} formId - id of form of interest
 * @returns Returns an array of all fields that are of field_type = 'camera' associated with form specified by formId
 */
export async function findAllCameraFields(formId) {
  const query = `${fieldEndpoint}?form_id=eq.${formId}` + 
  `&field_type=eq.camera`
  return await apiRequest(query)

}