import apiRequest from './apiRequest.js';
import { z } from "zod";

const applicantEndpoint = '/applicant';

const applicantSchema = z.object({
  interview_id: z.int().positive(),
  title: z.string(), 
  firstname: z.string(),
  surname: z.string(),
  phone_number: z.string(),
  email_address: z.email(),
  interview_status: z.string()
});

/**
 * Function to insert a new project into the database.
 * 
 * @param {object} project - The project data to insert.
 * @returns {Promise<object>} - The created project object returned by the API.
 */
export async function createApplicant(newApplicant) {
  // const result = await applicantSchema.safeParseAsync(newApplicant);
  // if (!result.success) {
  //   console.error("Validation failed");
  //   console.error(result.error)
  //   return null;
  // }
  return await apiRequest(applicantEndpoint, 'POST', newApplicant);
}

/**
 * Function to list all projects associated with the current user.
 * 
 * @returns {Promise<Array>} - An array of project objects.
 */
export async function getApplicants() {
  return apiRequest(applicantEndpoint);
}

/**
 * Function to get a single project by its ID.
 * The url is slightly different from usual RESTFul ...
 * See the operators section https://docs.postgrest.org/en/v12/references/api/tables_views.html
 * @param {string} id - The ID of the project to retrieve.
 * @returns {Promise<object>} - The project object matching the ID.
 */
export async function getApplicant(id) {
  return apiRequest(`${applicantEndpoint}?id=eq.${id}`);
}


// TODO
export async function editApplicant(id, editedApplicant) {
    return await apiRequest(`${applicantEndpoint}?id=eq.${id}`, 'PATCH', editedApplicant);
}

/**
 * Function to delete (if it exists) applicant specified by its ID.
 * @param {String} id - The ID of the applicant to be deleted
 * @returns {Promise<object>} - The applicant that was deleted from the database
 */
export async function deleteApplicant(id) {
    return await apiRequest(`${applicantEndpoint}?id=eq.${id}`, 'DELETE');
}

// For testing API calls
async function main() {  
  // const newApplicant = {
  //   interview_id: 1, 
  //   title: "Mr", 
  //   firstname: "John", 
  //   surname: "Smith",
  //   phone_number: "+61 412 345 678",
  //   email_address: "john.smith@example.com", 
  //   interview_status: "Not Started"
  // };

  // const createdApplicant = await createApplicant(newApplicant);
  // console.log('Created applicant: ', createdApplicant)

  // showing all applicants
  // const allApplicants = await getApplicants();
  // console.log(allApplicants);
  // // delete applicant with id
  // const id = '481';
  // const deletedApplicant = await deleteApplicant(id);
  // console.log(deletedApplicant);
  // // to confirm, get all applicants again 

  //  // showing all applicants
  // console.log('Printing after deletion')
  // const allApplicants2 = await getApplicants();
  // console.log(allApplicants2);



  /* Developing PATH fucntionality */
  const newApplicant = {
    interview_id: 1, 
    title: "Mr", 
    firstname: "John", 
    surname: "Smith",
    phone_number: "+61 412 345 678",
    email_address: "john.smith@example.com", 
    interview_status: "Not Started"
  };

  const updateTo = {
    interview_id: 1, 
    title: "Mrs", 
    firstname: "Jess", 
    surname: "Tehhee",
    phone_number: "+61 678 789 324",
    email_address: "jess.tehee@example.com", 
    interview_status: "Completed"
  };


  // // Before insertion
  // console.log("Before Insertion"); 
  // const allBefore = await getApplicants();
  // console.log(allBefore);
  // // After insertion 
  // console.log("----------- Performing insertion --------------")
  // const firstCreatedApplicant = await createApplicant(newApplicant);
  // console.log("After first insertion");
  // console.log(firstCreatedApplicant);
  // const secondCreatedApplicant = await createApplicant(newApplicant)
  // console.log("After second insertion")
  // console.log(secondCreatedApplicant);
  // const afterAll = await getApplicants();
  // console.log(afterAll);
  // // After patch 
  // console.log("----------------- After Patch Request ------------------")
  // const patchedApplicant = await editApplicant(afterAll[0].id, updateTo);
  // console.log(patchedApplicant);
  // const allAfterPatch = await getApplicants();
  // console.log(allAfterPatch); 
  
  // const ids = [491, 490, 601, 580, 581, 590, 640, 663];
  // ids.forEach((id) => {
  const deleted = deleteApplicant(662);
  // });
  console.log("deletion complete - print all remaining applicants")
  const appliants = await getApplicants();
  console.log(JSON.stringify(appliants, null, 2))

}
//main();