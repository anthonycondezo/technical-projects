//import fetch from 'node-fetch';

// Base URL for the Interview App RESTful API
const API_BASE_URL = 'https://comp2140a2.uqcloud.net/api';

// JWT token for authorization, replace with your actual token from My Grades in Blackboard
// From the A2 JSON Web Token column, view Feedback to show your JWT
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic3R1ZGVudCIsInVzZXJuYW1lIjoiczQ2NDgxMzAifQ.Zth3ZNIAL6i2RdXvh3BkEvEyA-aM7qC2zQHG4bfRbX4';

// Your UQ student username, used for row-level security to retrieve your records
const USERNAME = 's4648130';

/**
 * Helper function to handle API requests.
 * It sets the Authorization token and optionally includes the request body.
 * 
 * @param {string} endpoint - The API endpoint to call.
 * @param {string} [method='GET'] - The HTTP method to use (GET, POST, PATCH).
 * @param {object} [body=null] - The request body to send, typically for POST or PATCH.
 * @returns {Promise<object>} - The JSON response from the API.
 * @throws Will throw an error if the HTTP response is not OK.
 */
 async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method, // Set the HTTP method (GET, POST, PATCH)
    headers: {
      'Content-Type': 'application/json', // Indicate that we are sending JSON data
      'Authorization': `Bearer ${JWT_TOKEN}` // Include the JWT token for authentication
    },
  };

  // If the method is POST or PATCH, we want the response to include the full representation
  if (method === 'POST' || method === 'PATCH' || method === 'DELETE') {
    options.headers['Prefer'] = 'return=representation';
  }

  // If a body is provided, add it to the request and include the username
  if (body) {
    options.body = JSON.stringify({ ...body, username: USERNAME });
  }

  // Make the API request and check if the response is OK
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  // Return the response as a JSON object
  return response.json();
}

export default apiRequest;