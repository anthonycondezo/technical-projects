/**
 * A generic try-catch block wrapper for fetch requests 
 * @param {*} fetchCallback 
 * @param {*} setCallback 
 * @param {*} errorPrefix 
 */

export async function fetchData(fetchCallback, setCallback, setErrorCallback, errorPrefix) {
  try {
    const data = await fetchCallback();
    setCallback(data);
  } catch (error) {
    setErrorCallback(`${errorPrefix}: ${error.message}`)
  }
}