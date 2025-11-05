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

/**
 * 
 * @param {*} newData 
 * @param {*} setErrorCallback 
 * @param {*} refreshTrigger 
 * @returns 
 */
export async function fetchAddData(newData, addFetchCall, setErrorCallback, refreshTrigger) {
  try {
    // attempt 'POST' request
    const createdObj = await addFetchCall(newData);
    if (!createdObj) {
      setErrorCallback("An unexpected error has occured")
      return;
    }
    setErrorCallback(null);
    refreshTrigger();
  } catch (error) {
    setErrorCallback(error.message);
  }
}

/**
 * 
 * @param {*} id 
 * @param {*} updatedData 
 * @param {*} editFetchCall 
 * @param {*} setErrorCallback 
 * @param {*} refreshTrigger 
 * @returns 
 */
export async function fetchEditData(id, updatedData, editFetchCall, setErrorCallback, refreshTrigger) {
 try {
    // attempt 'PATCH' request
    const editedObj = await editFetchCall(id, updatedData);
    if (!editedObj) {
      setErrorCallback("An unexpected error has occured")
      return;
    }
    setErrorCallback(null);
    refreshTrigger();
    } catch (error) {
      setErrorCallback(error.message);
    }
}

export async function fetchDeleteData(id, deleteFetchCall, setErrorCallback, refreshTrigger) {
  try {
    // attempt 'DELETE' request
    const deletedObj = await deleteFetchCall(id);
    if (!deletedObj) {
      setErrorCallback("An unexpected error has occured")
      return;
    } 
    setErrorCallback(null);
    refreshTrigger();
  } catch (error) {
    setErrorCallback(error.message);
  }
}
