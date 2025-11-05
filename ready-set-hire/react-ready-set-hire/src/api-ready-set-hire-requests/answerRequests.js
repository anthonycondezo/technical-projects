import apiRequest  from "./apiRequest.js";

const answerendpoint = '/applicant_answer';

/**
 * Function to insert a new project into the database.
 * 
 * @param {object} project - The project data to insert.
 * @returns {Promise<object>} - The created project object returned by the API.
 */
export async function createAnswer(answer) {
  return await apiRequest(answerendpoint, 'POST', answer);
}

/**
 * Function to list all projects associated with the current user.
 * 
 * @returns {Promise<Array>} - An array of project objects.
 */
export async function getAnswers() {
  return apiRequest(answerendpoint);
}

/**
 * Function to get a single project by its ID.
 * The url is slightly different from usual RESTFul ...
 * See the operators section https://docs.postgrest.org/en/v12/references/api/tables_views.html
 * @param {string} id - The ID of the project to retrieve.
 * @returns {Promise<object>} - The project object matching the ID.
 */
async function getAnswer(id) {
  return apiRequest(`${answerendpoint}?id=eq.${id}`);
}


// TODO
async function editAnswer() {
    return [];
}

// TODO
async function deleteAnswer() {
    return [];
}

async function main() {
  const answers = getAnswers();
  console.log(JSON.stringify(answers, null, 2))
}

//main();