/**
 * A generic try-catch block wrapper for fetch requests 
 * @param {*} fetchCallback 
 * @param {*} setCallback 
 * @param {*} errorPrefix 
 */

async function fetchData(fetchCallback, setCallback, setErrorCallback, errorPrefix) {
  try {
    const data = await fetchCallback();
    setCallback(data);
  } catch (error) {
    setErrorCallback(`${errorPrefix}: ${error.message}`)
  }
}

export default fetchData;
