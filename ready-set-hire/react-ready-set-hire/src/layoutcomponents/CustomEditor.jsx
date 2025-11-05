import React, { useState } from "react";
import { Container, Button, CloseButton } from "react-bootstrap";
import FetchAlert from "./FetchAlert";
// callBacks = {fetchAddObject, fetchEditObject, fetchDeletObject}

function CustomEditor({ objectType, fetchRequestError, disableDelete = true, children}) {
    const ADD = 0;
    const EDIT = 1;
    const DELETE = 2;
    const childArray = React.Children.toArray(children);
    // Tracks if an error occured when attempting some fetch request
    const [newFlag, setNew] = useState(false);
    const [editFlag, setEdit] = useState(false);    
    const [deleteFlag, setDelete] = useState(false);
    return (
        <>
            <Container className={(newFlag || editFlag || deleteFlag) ? 'border rounded' : ''}>
                 {/* Close Editor Button */}
                 { (newFlag || editFlag || deleteFlag) && (
                    <CloseButton onClick={() => {setNew(false); setEdit(false); setDelete(false)}}/>
                )}
                {/* Forms - Add, Edit and Delete */}
                 {newFlag && !editFlag && !deleteFlag && (
                        //<ApplicantForm formTitle={"Add Applicant"} onSubmit={fetchAddApplicant} />
                        <div>{ childArray[ADD] }</div>
                )}
                {!newFlag && editFlag && !deleteFlag && (
                        //<ApplicantForm formTitle={"Edit Applicant"} onSubmit={fetchEditApplicant} type="EDIT" applicants={applicants}/>
                        <div>{ childArray[EDIT] }</div>
                )}
                {!disableDelete && !newFlag && !editFlag && deleteFlag &&(
                        //<ApplicantForm formTitle={"Edit Applicant"} onSubmit={fetchEditApplicant} type="EDIT" applicants={applicants}/>
                        <div>{ childArray[DELETE] }</div>
                )}
                {/* Buttons */}
                  <Container className='me-3 text-center'>
                    <Button variant='success' className='m-1' disabled={newFlag} onClick={() => {setNew(true), setEdit(false), setDelete(false)}}>
                        New {objectType}
                    </Button>
                    <Button variant='primary' className='m-1' disabled={editFlag} onClick={() => {setNew(false), setEdit(true), setDelete(false)}}>
                        Edit {objectType}
                    </Button>
                    {!disableDelete && (
                        <Button variant='danger' className='m-1' disabled={deleteFlag} onClick={() => {setNew(false), setEdit(false), setDelete(true)}}>
                        Delete {objectType}
                        </Button>
                    )}
                </Container>
                <FetchAlert 
                    fetchError={fetchRequestError} 
                    customMessage={`An unexpected error occured: ${fetchRequestError}`}
                />
            </Container>
        </>
    );
}

export default CustomEditor;
