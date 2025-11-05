import { Alert } from 'react-bootstrap';

/**
 * A custom Aler componet that become visable only when an error occurs
 * @param {{ *, Sring }} param0 - An error variable which denotes if a fetch error has occured and a error message. 
 * @returns 
 */
function FetchAlert({ fetchError, customMessage }) {
    return (
        <>
            { fetchError && (
                <Alert variant='warning'>
                    {`
                        ${customMessage}
                         Error:\n${fetchError}
                    `}                       
                </Alert>
            )}
        </>
    );
}

export default FetchAlert;