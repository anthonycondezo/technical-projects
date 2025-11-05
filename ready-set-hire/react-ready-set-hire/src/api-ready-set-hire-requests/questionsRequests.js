import apiRequest from "./apiRequest.js";

const questionEndpoint = '/question';

/**
 * Function to insert a new project into the database.
 * 
 * @param {object} project - The project data to insert.
 * @returns {Promise<object>} - The created project object returned by the API.
 */
export async function createQuestion(question) {
  return apiRequest(questionEndpoint, 'POST', question);
}

/**
 * Function to list all projects associated with the current user.
 * 
 * @returns {Promise<Array>} - An array of project objects.
 */
export async function getQuestions() {
  return apiRequest(questionEndpoint);
}

/**
 * Function to get a single project by its ID.
 * The url is slightly different from usual RESTFul ...
 * See the operators section https://docs.postgrest.org/en/v12/references/api/tables_views.html
 * @param {string} id - The ID of the project to retrieve.
 * @returns {Promise<object>} - The project object matching the ID.
 */
export async function getQuestion(id) {
  return apiRequest(`${questionEndpoint}?id=eq.${id}`);
}


export async function editQuestion(id, editedQuestion) {
  return await apiRequest(`${questionEndpoint}?id=eq.${id}`, 'PATCH', editedQuestion);
}


export async function deleteQuestion(id) {
  return await apiRequest(`${questionEndpoint}?id=eq.${id}`, 'DELETE');
}

async function main() {
  // const allInterviews = await getInterviews();
  // console.log("--- Printing All Interviews ---");
  // console.log(JSON.stringify(allInterviews, null, 2));
  // console.log("--- Adding All Questions ---");
  // const testInterviewQuestions = [
  //   { interview_id: 1385, question: "Explain the difference between let and const in JavaScript",  difficulty: "Easy", username: "s4648130" }, 
  //   { interview_id: 1876, question: "Explain the difference between useState and useEffect in JavaScript", difficulty: "Intermediate", username: "s4648130" }, 
  //   { interview_id: 1385, question: "Explain the difference between \'export default\' and \'export\' in JavaScript", difficulty: "Intermediate", username: "s4648130"  }, 
  //   { interview_id: 1876, question: "Explain the difference between react-bootstrap and bootstrap modules", difficulty: "Easy", username: "s4648130"  }, 
  //   { interview_id: 1385, question: "Explain the following error: \'Rendered more hooks than during the previous render\' and give an example that can cause this", difficulty: "Advanced", username: "s4648130"}, 
  //   { interview_id: 1876, question: "Explain why useEffect is often used in conjunction with async function", difficulty: "Advanced", username: "s4648130" }
//   // ];
// for (const question of testInterviewQuestions) {
//   const createdQuestion = await createQuestion(question);
//   if (!createdQuestion) {
//       console.error(`An unexpected error has occured adding ${JSON.stringify(createQuestion, null, 2)}`)
//   }
// }
const allQuestions = await getQuestions();
console.log(JSON.stringify(allQuestions, null, 2));

}

//main();