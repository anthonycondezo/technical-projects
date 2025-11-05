import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Container, Button, Form } from "react-bootstrap";
/* Layout Modules */
import CustomFilterTable from '../layoutcomponents/CustomFilterTable.jsx';
import CustomEditor from '../layoutcomponents/CustomEditor.jsx';
import CustomSelector from '../layoutcomponents/CustomSelector.jsx';
import CustomForm from '../layoutcomponents/CustomForm.jsx';
import FetchAlert from '../layoutcomponents/FetchAlert.jsx';
/* API Modules */
import { fetchData, fetchAddData, fetchEditData, fetchDeleteData } from '../api-ready-set-hire-requests/fetchData.js';
import { getInterviews, createInterview, editInterview, deleteInterview } from '../api-ready-set-hire-requests/interviewRequests.js'; 
import { getQuestions } from '../api-ready-set-hire-requests/questionsRequests.js';
import { getApplicants } from '../api-ready-set-hire-requests/applicantRequests.js';

/**
 * @returns The Interviews Page
 */
function Interviews() {
    const [fetchError, setFetchError] = useState(''); // error tracker for fetchApplicants() request used to populate Applicant table
    const [interviews, setInterviews] = useState([]); 
    const [tableData, setTableData] = useState([]); // interviews but argumented with question_count and applicant_count 
    /* Used by question counter */
    const [questions, setQuestions] = useState([]); // stores all of the questions in the database
    /* Used by qpplicant counter */
    const [applicants, setApplicants] = useState([]); // stores al of the applicants in the database
    /**
     * Populates interviews fetch results from getInterviews()
     */
    async function fetchInterviews() { fetchData(getInterviews, setInterviews, setFetchError, "Failed to fetch interviews:"); }

    /**
     * Populates questions with fetch results from getQuestions()
     */
    async function fetchQuestions() { fetchData(getQuestions, setQuestions, setFetchError, "Failed to fetch questions:"); }
    
    /**
     * Populates applicants with fetch results from getApplicants()
     */
    async function fetchApplicants() { fetchData(getApplicants, setApplicants, setFetchError, "Failed to fetch applicants:")}
    
    /**
     * Populates tableData using questions and applicants
     */
    function populateTableData() {
        setTableData(
            interviews.map(interview => {
            const qCount = questions.filter(q => q.interview_id === interview.id).length;
            const aCount = applicants.filter(a => a.interview_id === interview.id).length;
            return {
                ...interview,
                question_count: qCount,
                applicant_count: aCount
            };
            })
        );
    }

    /* Populate interviews, questions and applicants */
    useEffect(() => {
        fetchInterviews();  
        fetchQuestions();
        fetchApplicants();
    }, []);  

    /* Populate tableData */
    useEffect(() => { populateTableData(); }, [interviews, questions, applicants]);

    return (
        <>
            <Container className='border rounded mt-3 mb-1'>
                <h1 className='mt-3 text-center'> Interviews </h1>
                {/* Alert User IF fetch error occurs */}
                <FetchAlert 
                    fetchError={fetchError} 
                    customMessage={" An unexpected error occured fetching remaining interviews."}
                />
               { !fetchError && (
                    <>
                        <InterviewTable tableData={tableData} />
                        <Container className='mt-3 mb-5 text-center'>
                            {/* Question Page Link */}
                            <Link to="/questions" className='m-1'>
                                <Button className=''>See Questions</Button>
                            </Link>
                            {/* *Applicant Page Link */}
                            <Link to="/applicants" className='m-1'>
                                <Button>See Applicants</Button>
                            </Link>
                        </Container>
                        <Container className='mt-3'>
                            <InterviewEditor interviews={interviews} refreshInterviews={fetchInterviews} />
                        </Container>         
                    </>
               )}
            </Container>
        </>
    );
}

export default Interviews;

/**
 * @param {{{...Interview}, question_count: int, applicant_count: int}} param0 
 * @returns Returns a Table componet from the provided table data 
 */
function InterviewTable({ tableData }) {
    const COLUMN_TITLES = ["ID", "Title", "Job Role", "Description", "Status", "Username", "Q Count", "Number of Applicants"]; 
    const ATTRIBUTES = ["id", "title", "job_role", "description", "status", "username", "question_count", "applicant_count"]
    return (
        <>
        <CustomFilterTable 
            title={{all: "Interviews", filtered: ["Draft Interviews", "Published Interviews", "Archived Interviews"]}} 
            attributeFilter={"status"} 
            filters={["Draft", "Published", "Archived"]} 
            unfilteredTableData={tableData}
            columnTitles={{filtered: COLUMN_TITLES, all: [...COLUMN_TITLES, "Interview Status"]}}
            attributes={{filtered: ATTRIBUTES, all: [...ATTRIBUTES, "status"]}}
            customErrorMessage={"No applicants could be found"}
        />
        </>
    );
}

/**
 * @param {Interview[], Function(Event)} param0 
 * @returns A component that performs Add, Edit and Delete requests to the database
 */
function InterviewEditor({ interviews, refreshInterviews }) {
    const [fetchRequestError, setFetchRequestError] = useState(null); 
    async function fetchAddInterview(newInterview) { fetchAddData(newInterview, createInterview, setFetchRequestError, refreshInterviews); }
    async function fetchEditInterview(id, updatedInterview) { fetchEditData(id, updatedInterview, editInterview, setFetchRequestError, refreshInterviews); }
    async function fetchDeleteInterview(id) { fetchDeleteData(id, deleteInterview, setFetchRequestError, refreshInterviews); }
    return (
        <>
            <Container className='border rounded'>
                <h2 className='text-center mt-3 mb-4'> Interview Editor </h2>
                <CustomEditor objectType={"Interviews"} fetchRequestError={fetchRequestError} disableDelete={false} > 
                    {/* Add Interview */}
                    <InterviewForm formTitle={"Add Interview"} onSubmit={fetchAddInterview} />
                    {/* Edit Interview */}
                    <InterviewForm formTitle={"Edit Interview"} onSubmit={fetchEditInterview} type="EDIT" interviews={interviews} />
                    {/* Delete Interview */}
                    <InterviewForm formTitle={"Delete Interview"} onSubmit={fetchDeleteInterview} type="DELETE" interviews={interviews} />
                </CustomEditor>
            </Container>
        </>
    );
}

/**
 * @param {{String, Function(), String, Interview[]}} param0 
 * @returns A Add/Edit/Delete form in accordance to the supplied type
 */
function InterviewForm({ title, onSubmit, type = "ADD", interviews = null }) {
    // From Error messages
    const FORM_ERROR = {
        missing: {
            title: "missing title", 
            job_role: "missing job role", 
            description: "missing description", 
            status: "missing status"  
        }    
    }
    const [editId, setEditId]  = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [formResult, setFormResult] = useState({
        data: {
            title: "", 
            job_role: "", 
            description: "", 
            status: ""
        }, 
        error: null
    });
    /** fromResult.data setter */
    const setData = (attribute, value) => setFormResult((prev) => (
        {...prev, data: {...prev.data, [attribute]: value}}
    ));
    /** formResult.error setter */
    const setError = (err) => setFormResult((prev) => ({...prev, error: err}))
    /** Form Validation Function - Ensures all fields are populated */
    const check = (setError) => {
        /** Delete/Edit Interview Check */
        const idCheck = (id) => ( !id && setError("missing interview id"), id );
        /** Adding new interview validity Check */
        const addCheck = () => {
            const requiredFields = [
                { key: "title", error: FORM_ERROR.missing.title },
                { key: "job_role", error: FORM_ERROR.missing.job_role },
                { key: "description", error: FORM_ERROR.missing.description },
                { key: "status", error: FORM_ERROR.missing.status }
            ];
            const missingField = requiredFields.find(({ key }) => !formResult.data[key]);
            if (missingField) setError(missingField.error)
            return !!(!missingField);
        }
        return (type === 'DELETE')
            ? idCheck(deleteId)
            : (type === "EDIT") 
            ? addCheck() && idCheck(editId)
            : addCheck();
    }
    /* Updated formResult with interview for editing */
    useEffect(()=>{
        if (editId) {
            const editInterview = interviews.find((interview) => interview.id === Number(editId));
            setFormResult((prev) => ({
                ...prev, 
                data: {
                    title: editInterview.title, 
                    job_role: editInterview.job_role, 
                    description: editInterview.description, 
                    status: editInterview.status                
                }
            }));
        }
    }, [editId]);
    return (
        <>
            <CustomForm
                formTitle={title}
                state={{ selectedId: ((type === 'EDIT') ? editId : deleteId), fieldState: formResult.data}}
                setError={setError}
                onSubmit={onSubmit}
                validationCheck={check}
                type={type}
            >
                { type != 'ADD' && (
                    <Form.Group>
                        <Form.Label>Interview ID</Form.Label>
                        <InterviewSelect
                            interviews={interviews}
                            selectedId={(type === 'EDIT') ? editId : deleteId} 
                            onChange={(e) => (type === 'EDIT') ? setEditId(e.target.value) : setDeleteId(e.target.value)} 
                        />
                     </Form.Group>
                )}
                { type != 'DELETE' && (
                    <InterviewFormFields formResult={formResult} setData={setData} />
                )}    
            </CustomForm>
            {/* Notify User of unexpected errors */}
            <FetchAlert fetchError={formResult.error} customErrorMessage={""}/>
        </>
    );
}

/**
 * @param {{FormResult, Function()}} param0 
 * @returns A compoent of Form fields sets FormResults to supplied field values with setData()
 * 
 * Note: FormResult = {
 *      data: {
 *          title: String, 
 *          job_role: String, 
 *          description: String, 
 *          status: String
 *      }, 
 *      error: String
 * }
 */
function InterviewFormFields({ formResult, setData }) {
    const INTERVIEW_STATUS = [ "Published", "Draft", "Archived" ]; // Form MARCOS for populating select fields
    return (
        <>
            <Form.Group>
                {/* Title */}
                <Form.Label>Title</Form.Label>
                <Form.Control
                    type="text"
                    value={formResult.data.title ?? ""}
                    placeholder="Front-end Developer Interview"
                    onChange={(e) => { setData("title", e.target.value); }} 
                />
            </Form.Group>
            <Form.Group>
                {/* Job Role */}
                <Form.Label>Job Role</Form.Label>
                <Form.Control
                    type="text"
                    value={formResult.data.job_role ?? ""}
                    placeholder="Senior Front-end Developer"
                    onChange={(e) => { setData("job_role", e.target.value) }} 
                />
            </Form.Group>
            <Form.Group>
                {/* Description */}
                <Form.Label>Description</Form.Label>
                <Form.Control
                    type="text"
                    value={formResult.data.description ?? ""}
                    placeholder="Interview for candidates with React experience"
                    onChange={(e) => { setData("description", e.target.value); }} 
                />
            </Form.Group>
            <Form.Group>
                {/* Status */}
                <Form.Label>Status</Form.Label>
                <Form.Select
                    value={formResult.data.status ?? ""}
                    onChange={(e) => { setData("status", e.target.value); }}
                >
                    <option value="">-- Please select a title --</option>
                    {INTERVIEW_STATUS.map((status, index) => (
                        <option key={index} value={status}>{status}</option>
                    ))}
                </Form.Select>
            </Form.Group>        
        </>
    );
}

/**
 * @param {{Interviews[], int, Function(Event)}} param0 
 * @returns A Form.Select from the supplied array of interiew objects 
 */
function InterviewSelect({ interviews, selectedId, onChange }) {
    return (
        <>
            <CustomSelector 
                attributesKeys={["title", "job_role"]}
                data={interviews}
                selectedId={selectedId}
                onChange={onChange}
            />
        </>
    );
}
