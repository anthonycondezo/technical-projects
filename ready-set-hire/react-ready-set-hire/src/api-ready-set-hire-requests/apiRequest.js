
// Base URL for the Interview App RESTful API
const API_BASE_URL = "http://localhost:3000"

// JWT token for authorization - please enter your jwt token here
const JWT_TOKEN = "Please enter your JWT token here";  

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
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: method,
            headers: {
                "Authorization": `Bearer ${JWT_TOKEN}`,
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            body: (body) ? JSON.stringify(body) : undefined
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return await response.json();
    } catch (e) {
        console.error("An unexpected fetch error occured", e);
        return {
            error: true,
            message: e.message
        };
    }
}


export default apiRequest;