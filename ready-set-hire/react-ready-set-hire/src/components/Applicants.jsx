import { useState, useEffect } from 'react';
import { Container, Form, Card } from "react-bootstrap";
/* Layout Components */
import FetchAlert from '../layoutcomponents/FetchAlert.jsx';
import CustomFilterTable from '../layoutcomponents/CustomFilterTable.jsx';
import CustomEditor from '../layoutcomponents/CustomEditor.jsx';
import CustomForm from '../layoutcomponents/CustomForm.jsx';
/* API Modules */
import { fetchData, fetchAddData, fetchEditData } from '../api-ready-set-hire-requests/fetchData.js';
import { getAnswers } from "../api-ready-set-hire-requests/answerRequests.js"; 
import { getQuestions } from "../api-ready-set-hire-requests/questionsRequests.js";
import { getInterviews } from '../api-ready-set-hire-requests/interviewRequests.js';
import { getApplicants, createApplicant, editApplicant } from '../api-ready-set-hire-requests//applicantRequests.js';

/**
 * @returns Applicant Page
 */
function Applicants() {
    const [fetchError, setFetchError] = useState(''); // error tracker any fetch request that resulted in an unexpected error
    const [applicants, setApplicants] = useState([]); // all applicants
    const [questions, setQuestions] = useState([]); // all questions
    const [answers, setAnswers] = useState([]); // all answers
    const [interiews, setInterviews] = useState([]) // all interviews
    /** Populates applicants fetch results from getApplicants() */
    async function fetchApplicants() { fetchData(getApplicants, setApplicants, setFetchError, "Failed to fetch applicants:") }
    /** Populates questions with fetch results drom getquestions() */
    async function fetchQuestions() { fetchData(getQuestions, setQuestions, setFetchError, "Failed to fetch questions: ") }
    /** Populates answers with fetch results from getAsnwers() */
    async function fetchAnswers() { fetchData(getAnswers, setAnswers, setFetchError, "Failed to get applicant answers: ")}
    /** Populates interviews with fetch rsults from getInterviews() */
    async function fetchInterviews() { fetchData(getInterviews, setInterviews, setFetchError, "Failed to get interviews: ")}
    /* Populate applicants, questions and answers */
    useEffect(() => { 
        fetchApplicants(); 
        fetchQuestions();
        fetchAnswers();
        fetchInterviews();
    }, []); 

    return (
          <>
            <Container className='border rounded mt-3 mb-1'>
                <h1 className='mt-5 text-center'>Applicants</h1>
                {/* Alert User IF fetch error occurs */}
                <FetchAlert 
                    fetchError={fetchError} 
                    customMessage={" An unexpected error occured fetch remaining applicants. "}
                    />
                { !fetchError && (
                    <>
                        <ApplicantTable applicants={applicants} />
                        <LinkGenerator applicants={applicants} />
                        <ViewApplicantAnswers applicants={applicants} questions={questions} answers={answers} />
                        <ApplicantEditor applicants={applicants} refreshApplicants={fetchApplicants} interviews={interiews} />
                    </>
                )} 
            </Container>
        </>
    );
}

export default Applicants;

/**
 * A applicant table component populated with the following fields.
 * 
 * Main Fields: 
 *  Title, Firstname, Surname, Phone Number, Email Address and Interview Status    
 * 
 * @param {Applicants[]} param0 
 * @returns An applicant table compone<nt
 */
function ApplicantTable({ applicants }) {
    const COLUMN_TITLES = ["ID", "Title", "Firstname", "Surname", "Phone Number", "Email Address"]; 
    const ATTRIBUTES = ["id", "title", "firstname", "surname", "phone_number", "email_address"];
    return (
        <>
        <CustomFilterTable 
            title={{all: "Applicants", filtered: ["Remaining Applicants", "Applicants Pending Review"]}} 
            attributeFilter={"interview_status"} 
            filters={["Not Started", "Completed"]} 
            unfilteredTableData={applicants}
            columnTitles={{filtered: COLUMN_TITLES, all: [...COLUMN_TITLES, "Interview Status"]}}
            attributes={{filtered: ATTRIBUTES, all: [...ATTRIBUTES, "interview_status"]}}
            customErrorMessage={"No applicants could be found"}
        />
        </>
    );
}

/**
 * @param {Applicants[], Function()} param0 - An array of applicant objects and a callback function to 
 *          to re-populate applicatns with latest applicants from the database.
 * @returns A component that performs Add and Edit requests to the database.
 */
function ApplicantEditor({ applicants, refreshApplicants, interviews}){
    const [fetchRequestError, setFetchRequestError] = useState(null); 
    async function fetchAddApplicant(newApplicant) { fetchAddData(newApplicant, createApplicant, setFetchRequestError, refreshApplicants); }
    async function fetchEditApplicant(id, updatedApplicant) { fetchEditData(id, updatedApplicant, editApplicant, setFetchRequestError, refreshApplicants); }
    return (
        <>
            <Container className='border rounded'>
                <h2 className="text-center mt-3 mb-4"> Applicant Editor </h2>
                <CustomEditor objectType={"Applicants"} fetchRequestError={fetchRequestError} > 
                    <ApplicantForm formTitle={"Add Applicant"} onSubmit={fetchAddApplicant} applicants={applicants} interviews={interviews}/>
                    <ApplicantForm formTitle={"Edit Applicant"} onSubmit={fetchEditApplicant} type="EDIT" applicants={applicants} interviews={interviews}/>
                </CustomEditor>
            </Container>
        </>
    );
}

function ApplicantForm({title, onSubmit, type = "ADD", applicants, interviews}) {
    // From Error messages
    const FORM_ERROR = {
        missing: {
            title: "missing title", 
            firstname: "missing firstname", 
            surname: "missing surname", 
            phone_number: "missing phone number", 
            email: "missing email", 
            interview_status: "missing interview status"    
        }    
    }
    const [editId, setEditId]  = useState(null);
    const [formResult, setFormResult] = useState({
        data: {
            interview_id: null, 
            title: "",
            firstname: "",
            surname: "",
            phone_number: "",
            email_address: "",
            interview_status: ""
        },
        error: null
    });
    /** fromResult.data setter */
    const setData = (attribute, value) => setFormResult((prev) => (
        {...prev, data: {...prev.data, [attribute]: value}}
    ));
    /** formResult.error setter */
    const setError = (err) => setFormResult((prev) => ({...prev, error: err}))
    /** Form Validtion Fucntion - Ensures all fields are populated */
    const check = (setError) => {
        /** Edit Applicant Check */
        const idCheck = () => ( !editId && setError("missing applicant is"), editId);
        /** Adding new Applicanr validity Check */
        const addCheck = () => {
            const requiredFields = [
                { key: "title", error: FORM_ERROR.missing.title },
                { key: "firstname", error: FORM_ERROR.missing.firstname },
                { key: "surname", error: FORM_ERROR.missing.surname },
                { key: "phone_number", error: FORM_ERROR.missing.phone_number },
                { key: "email_address", error: FORM_ERROR.missing.email },
                { key: "interview_status", error: FORM_ERROR.missing.interview_status }
            ];
            const missingField = requiredFields.find(({ key }) => !formResult.data[key]);
            if (missingField) setError(missingField.error)
            return !!(!missingField);
        }
        console.log(JSON.stringify(formResult, null, 2))
        return (type === "EDIT") 
            ? addCheck() && idCheck(editId)
            : addCheck();
    } 
    /* Updated formResult with applicant details chosen for editing */
    useEffect(()=>{
        if (editId) {
            const editApplicant = applicants.find((applicant) => applicant.id === Number(editId));
            setFormResult((prev) => ({
                ...prev, 
                data: {
                    interview_id: editApplicant.interview_id, 
                    title: editApplicant.title,
                    firstname: editApplicant.firstname,
                    surname: editApplicant.surname,
                    phone_number: editApplicant.phone_number,
                    email_address: editApplicant.email_address,
                    interview_status: editApplicant.interview_status
                }
            }));
        }
    }, [editId]);
    return (
        <>
            <CustomForm
                formTitle={title}
                state={{ selectedId: editId, fieldState: formResult.data}}
                setError={setError}
                onSubmit={onSubmit}
                validationCheck={check}
                type={type}
            >
               { type != 'ADD' && (
                    <Form.Group>
                        <Form.Label>Applicant ID</Form.Label>
                        <ApplicantSelect 
                            applicants={applicants} 
                            selectedId={editId} 
                            onChange={(e) => setEditId(e.target.value)} 
                        />
                    </Form.Group>
               )}
               {/* ADD/EDIT Applicant Form */}
               <ApplicantFormFields formResult={formResult} setData={setData} interviews={interviews} />
            </CustomForm>
            {/* Notify User of Unexpected Errors */}
            <FetchAlert fetchError={formResult.error} customErrorMessage={""} />
               
        </>
    );
}

function ApplicantFormFields({ formResult, setData, interviews }) {
    // Form MARCOS for populating select fields
    const TITLES = [ "Mr", "Ms", "Dr" ];
    const INTERVIEW_STATUS = ["Not Started", "Completed"];
    const TEXTFIELDS = [
        { label: "Firstname", placeholder: "Anthony", attribute: "firstname"}, 
        { label: "Surname", placeholder: "Condezo", attribute: "surname" }, 
        { label: "Email", placeholder: "anthonycondezo@gmail.com", attribute: "email_address", type: "email"}, 
        { label: "Phone Number", placeholder: "+61 312 346 014", attribute: "phone_number" }  
    ]
    return (
        <>
            <Form.Group>
                {/* Interview Id*/}
                <Form.Label>Interview ID</Form.Label>
                <Form.Select
                    value={formResult.data.interview_id ?? ""}
                    onChange={(e) => {
                        setData("interview_id", Number(e.target.value));
                    }}
                >
                    <option value="">-- Please select an interview --</option>
                    {interviews.map((interview) => (
                        <option key={interview.id} value={interview.id}>
                            {`${interview.title} - ${interview.job_role}`} 
                        </option>
                    ))}        
                </Form.Select>
            </Form.Group>
            <Form.Group>
                {/* Title */}
                <Form.Label>Title</Form.Label>
                <Form.Select 
                    value={formResult.data.title ?? ""}
                    onChange={(e) => {
                        setData("title", e.target.value);
                    }}
                >
                    <option value="">-- Please select a title --</option>
                    {TITLES.map((title, index) => (
                        <option key={index} value={title}>{title}</option>
                    ))}
                </Form.Select>
            </Form.Group>
            { // Rendering Email, Firstname, Surname and phone number fields here
                TEXTFIELDS.map((field) => (
                    (
                        <Form.Group key={field.attribute || index}>
                            <Form.Label>{field.label}</Form.Label>
                            <Form.Control
                                type={ field.type ?? "text" }
                                placeholder={field.placeholder}
                                value={formResult.data[field.attribute] ?? ""}
                                onChange={(e) => {
                                    setData(field.attribute, e.target.value)
                                }}
                            />
                        </Form.Group>
                    )
                ))
            }
            <Form.Group>
                {/* Interview Status */}
                <Form.Label>Interview Status</Form.Label>
                <Form.Select
                    value={formResult.data.interview_status ?? ""}
                    onChange={(e) => {setData("interview_status", e.target.value)}}
                >
                    <option value="">-- Please select a status --</option>
                    {INTERVIEW_STATUS.map((status, index) => (
                        <option key={index} value={status}>{status}</option>
                    ))}   
                </Form.Select>
            </Form.Group>
        </>
    );
}

/**
 * @param {Applicant[], int, Function(Event)} param0 
 * @returns A Form.Select from the supplied array of applicants
 */
function ApplicantSelect({ applicants, selectedId, onChange }) {
    return (
      <>
        <Form.Select value={selectedId || ""} onChange={onChange}>
            <option value="">-- Please select an applicant --</option>
            {applicants.map((applicant) => (
                <option key={applicant.id} value={applicant.id}>
                    {`${applicant.firstname} ${applicant.surname} (id: ${applicant.id})`}
                </option>
            ))}
        </Form.Select>
      </>
    );
}

/**
 * @param {{Applicant[]}} param0 
 * @returns A component that generates a interview page link unique to the chosen applicant from applicants.
 */
function LinkGenerator({ applicants }) {
    const baseUrl = window.location.origin;
    const [id, setId] = useState(0);
    const [status, setStatus] = useState(null);

    useEffect(() => {
        if (id) {
            setStatus(
                applicants.find((applicant) => applicant.id === Number(id)).interview_status
            );
        }
    }, [id]);
    return (
        <>  
            <Container className='border rounded my-3'>
                <h3>Interview Link Generator</h3>
                {/* Selecting applicant */}
                <Container>
                    <ApplicantSelect 
                    applicants={applicants} 
                    selectedId={id} 
                    onChange={(e) => setId(e.target.value)} 
                />
                </Container>
                {/* Display unique link for chosen applicant */}
                <Container className='my-3'>
                    <Form.Group className='mt-3'>
                    <Form.Label className='border rounded pt-2 pb-2 ' style={{width: "100%"}}>
                        {(!id) ? "Applicant not selected" : (status != 'Completed') ? `${baseUrl}/interview/:${id}` : 'Interview complete, cannot generate link'}
                    </Form.Label>
                </Form.Group>
                </Container>
            </Container>  
        </>
    );
}

/**
 * 
 * @param {{Applicant[]}} param0 
 * @returns A component that displays all interview questions and answers given by a applicant for 
 *       a particular interview.
 */
function ViewApplicantAnswers({ applicants, questions, answers }) {
    const ERR_MSG = {
        find: {
            interview_id: "failed to find corresponding interview for chosen applicant",
            questions: "failed to find interview questions", 
            answers: "failed to find interview answers"
        }
    }
    const [id, setId] = useState(null); // chosen applicant's id
    const [interviewId, setInterviewId] = useState(null); // chosen applicants's interview_id
    const [interviewAnswers, setInterviewAnswers] = useState([]); // all interview answers 
    const [error, setError] = useState(null);

    useEffect(() => { // get corresponding interview_id
        if (id) {
            const result = applicants.find((a) => a.id === id)?.interview_id;
            if (result) { setInterviewId(result);  setError(null) }
            else { setError(ERR_MSG.find.interview_id) }
        }
    }, [id, applicants]);

    useEffect(() => { // get all corresponding interview answers
        if (interviewId && answers) {
            const result = answers.filter((a) => a.interview_id === interviewId);
            if (result.length) { setInterviewAnswers(result); setError(null) }
            else { setError(ERR_MSG.find.answers) }
        }
    }, [interviewId, answers]);

    return (
        <>
            <Container className='border rounded my-3'>
                        <h3>View Applicant Interview Answers</h3>
                        {/* Select Applicant */}
                        <ApplicantSelect 
                            applicants={applicants}
                            selectedId={id}
                            onChange={(e) => setId(Number(e.target.value))}
                        />

                        {/* Displaying Questions and Corresponding Answers For Selected Applicant */}
                        <Container className='my-3 border'>
                            {interviewAnswers.map((answer) => {
                                const question = questions.find((q) => q.id === answer.question_id);
                                return (
                                    <Card key={answer.id} className="my-2 p-2">
                                    <Card.Text>
                                        <strong>Q:</strong> {question ? question.question : "Question not found"}
                                    </Card.Text>
                                    <Card.Text>
                                    <strong>A:</strong> {answer.answer}
                                    </Card.Text>
                                    </Card>
                                );
                            })}
                        </Container>
                    </Container>
            { (error) && (
                <FetchAlert fetchError={error} customErrorMessage={""} />
            )}
        </>
    );    
}

