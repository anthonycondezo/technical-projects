import apiRequest from "./api-request";

const formEndpoint = '/form'

/**
 * Function returns an array of all forms from Form table
 * 
 * @returns {Promise<object[]>} - An array of form objects 
 */
export async function getForms() { return apiRequest(formEndpoint); }

/**
 * Function returns the form with corresponding id
 * @param {Integer} id - The id of the form of interest
 * @returns {Promise<object>} - A form object, null otherwise.
 */
export async function getForm(id) { return apiRequest(`${formEndpoint}?id=eq.${id}`); }

/**
 * Function to create a new form called "Books".
 * 
 * @returns {Promise<object>} - The created form object.
 */
export async function createForm(newForm) {
  return apiRequest(formEndpoint, "POST", newForm);
}

export async function editForm(id, editedForm) {
  return apiRequest(`${formEndpoint}?id=eq.${id}`, 'PATCH', editedForm);
}

/**
 * Function deletes form specified by provided id
 * @param {Integer} id - The id of form to be deleted
 * @returns {Promise<object>} - The form that was successfully deleted, null otherwise.
 */
export async function deleteForm(id) {
  return apiRequest(`${formEndpoint}?id=eq.${id}`, 'DELETE');
}

export async function hasLocationField(id) {
  const query = `${formEndpoint}?id=eq.${id}` + 
    `&field_type=eq.location`
  return apiRequest(query)
}