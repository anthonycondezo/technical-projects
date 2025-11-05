import apiRequest  from "./apiRequest.js";

const interviewEndpoint = '/interview';

/**
 * Function to insert a new project into the database.
 * 
 * @param {object} project - The project data to insert.
 * @returns {Promise<object>} - The created project object returned by the API.
 */
export async function createInterview(interview) {
  return apiRequest(interviewEndpoint, 'POST', interview);
}

/**
 * Function to list all projects associated with the current user.
 * 
 * @returns {Promise<Array>} - An array of project objects.
 */
export async function getInterviews() {
  return apiRequest(interviewEndpoint);
}

/**
 * Function to get a single project by its ID.
 * The url is slightly different from usual RESTFul ...
 * See the operators section https://docs.postgrest.org/en/v12/references/api/tables_views.html
 * @param {string} id - The ID of the project to retrieve.
 * @returns {Promise<object>} - The project object matching the ID.
 */
export async function getInterview(id) {
  return apiRequest(`${interviewEndpoint}?id=eq.${id}`);
}

// TODO
export async function editInterview(id, editedInterview) {
    return await apiRequest(`${interviewEndpoint}?id=eq.${id}`, 'PATCH', editedInterview);
}

// TODO
export async function deleteInterview(id) {
    return await apiRequest(`${interviewEndpoint}?id=eq.${id}`, 'DELETE');
}