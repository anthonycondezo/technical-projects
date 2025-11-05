import { useState, useEffect } from 'react';
import { Container, Form } from "react-bootstrap";
/* Layout Modules */
import CustomTable from '../layoutcomponents/CustomTable.jsx';
import CustomFilterTable from '../layoutcomponents/CustomFilterTable.jsx';
import CustomEditor from '../layoutcomponents/CustomEditor.jsx';
import CustomSelector from '../layoutcomponents/CustomSelector.jsx';
import FetchAlert from '../layoutcomponents/FetchAlert.jsx';
import QuestionGenerator from '../layoutcomponents/QuestionGenerator.jsx';
import CustomForm from '../layoutcomponents/CustomForm.jsx';
/* API Modules */
import { fetchData, fetchAddData, fetchEditData, fetchDeleteData } from '../api-ready-set-hire-requests/fetchData.js';
import { getQuestions, createQuestion, editQuestion, deleteQuestion } from '../api-ready-set-hire-requests/questionsRequests.js'; 
import { getInterviews } from '../api-ready-set-hire-requests/interviewRequests.js';

/**
 * 
 * @returns The Question Page
 */
function Questions() {
    const [fetchError, setFetchError] = useState(''); // error tracker for fetchApplicants() request used to populate Applicant table
    const [questions, setQuestions] = useState([]); // this might need to be passed an a different paramter.
    const [interviews, setInterviews] = useState([]);
    /** Populates questions fetch results from getQuestions() */
    async function fetchQuestions() { fetchData(getQuestions, setQuestions, setFetchError, "Failed to fetch questions:"); }
    async function fetchInterviews() { fetchData(getInterviews, setInterviews, setFetchError, "Failed to fetch interviews: ")}
    useEffect(() => { fetchQuestions(); fetchInterviews(); }, []);    
    return (
        <>
            <Container className='border rounded mt-3 mb-1'>
                <h1 className='mt-5 text-center'>Questions</h1>
                {/* Alert User IF fetch error occurs */}
                <FetchAlert 
                    fetchError={fetchError} 
                    customMessage={" An unexpected error occured fetching questions."}
                />
                <QuestionTable questions={questions} />
                <QuestionEditor questions={questions} interviews={interviews} refreshQuestions={fetchQuestions} />
            </Container>
        </>
    );
}

export default Questions;

/**
 * @param {{Question[]}} param0 
 * @returns A Table from and array of question objects
 */
function QuestionTable({ questions }) {
    const COLUMN_TITLES = ["ID", "Interview ID", "Question"]; 
    const ATTRIBUTES = ["id", "title", "interview_id", "question"]
    return (
        <>
        <CustomFilterTable 
            title={{all: "Questions", filtered: ["Easy", "Intermediate", "Advanced"]}} 
            attributeFilter={"difficulty"} 
            filters={["Easy", "Intermediate", "Advanced"]} 
            unfilteredTableData={questions}
            columnTitles={{filtered: COLUMN_TITLES, all: [...COLUMN_TITLES, "Difficulty"]}}
            attributes={{filtered: ATTRIBUTES, all: [...ATTRIBUTES, "difficulty"]}}
            customErrorMessage={"No questions could be found"}
        />
        </>
    );
}

/**
 * @param {{ Question[], Function() }} param0 - An array of question objects and a callback function 
 *        to repopulated questions with latest questions from the database.
 * @returns A component that performs Add, Edit and Delete requests to the database.
 */

function QuestionEditor({questions, interviews, refreshQuestions}) {
    const [fetchRequestError, setFetchRequestError] = useState(null); 
    async function fetchAddQuestion(newQuestion) { fetchAddData(newQuestion, createQuestion, setFetchRequestError, refreshQuestions); }
    async function fetchEditQuestion(id, updatedQuestion) { fetchEditData(id, updatedQuestion, editQuestion, setFetchRequestError, refreshQuestions); }
    async function fetchDeleteQuestion(id) { fetchDeleteData(id, deleteQuestion, setFetchRequestError, refreshQuestions); }
    return (
            <>
                <Container className='border rounded'>
                    <h2 className='text-center mt-3 mb-4'> Question Editor </h2>
                    <CustomEditor objectType={"Questions"} fetchRequestError={fetchRequestError} disableDelete={false} > 
                        {/* Add Question Form */}
                        <QuestionForm title={'Add Question'} interviews={interviews} questions={questions} onSubmit={fetchAddQuestion} />
                        {/* Edit Question Form */}
                        <QuestionForm title={'Edit Question'} interviews={interviews} questions={questions} onSubmit={fetchEditQuestion} type='EDIT' />
                        {/* Delete Question Form */}
                        <QuestionForm title={"Delete Question"} interviews={interviews} questions={questions} onSubmit={fetchDeleteQuestion} type='DELETE'/>
                    </CustomEditor>
                </Container>
            </>
        );   
}

/**
 * @param {String, Interview[], Function(), Question[], String} param0 
 * @returns Returns a Add/Edit/Delete form in accordence to the supplied type
 */
function QuestionForm({title, interviews, onSubmit, questions, type = "ADD"}) {
    const FORM_ERROR = {
        missing: {
            interview_id: "missing interviewer id", 
            question: "missing question", 
            difficulty: "missing difficulty"
        },
        selected: {
            question_id: "question not selected"
        }
    }
    const [deleteId, setDeleteId] = useState(null); // question id of question to be deleted
    const [editId, setEditId] = useState(null); // question id of question selected for editing
    const [formResult, setFormResult] = useState({ // field value input from user
        data: {
            interview_id: null, 
            question: "", 
            difficulty: ""
        }, 
        error: null
    });
    /** formResult.data setter */
    const setData = (attribute, value) => setFormResult((prev) => (
        {...prev, data: {...prev.data, [attribute]: value }}
    ));
    /** formResult.error setter */
    const setError = (err) => setFormResult((prev) => ({...prev, error: err}))
    /** Form Validation Function - Ensures all fields are populated */
    const check = (setError) => {
        /** Delete/Edit question check */
        const idCheck = (id) => ( !id && setError("missing question id"), !!id );
        /** Adding new question validity check */
        const addCheck = () => {
            const requiredFields = [
                { key: "interview_id", error: FORM_ERROR.missing.interview_id },
                { key: "question", error: FORM_ERROR.missing.question },
                { key: "difficulty", error: FORM_ERROR.missing.difficulty }
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
    /* Updated formResult with question details chosen for editing */
    useEffect(()=>{
        if (editId) {
            const editQuestion = questions.find((question) => question.id === Number(editId));
            setFormResult((prev) => ({
                ...prev, 
                data: {
                    interview_id: editQuestion.interview_id, 
                    question: editQuestion.question,
                    difficulty: editQuestion.difficulty
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
            {   // Selector of choosing a question to edit
                type != 'ADD' && (
                    <Form.Group>
                        <Form.Label>Question ID</Form.Label>
                        <QuestionSelect
                            questions={questions}
                            selectedId={(type === 'EDIT') ? editId : deleteId} 
                            onChange={(e) => (type === 'EDIT') ? setEditId(e.target.value) : setDeleteId(e.target.value)} 
                        />
                    </Form.Group>
                )
            }
            {   // Form Fields for adding or editing a question
                type != 'DELETE' && (
                    <QuestionFormFields 
                        formResult={formResult}
                        interviews={interviews}
                        setData={setData}
                    />
                )
            } 
            </CustomForm>
            {   // Question Generator 
                type === 'ADD' && (
                    <Container>
                        <QuestionGenerator interviews={interviews} onSubmit={onSubmit} />
                    </Container>
                )
            }
            {/* Notify User of unexpected errors */}
            <FetchAlert fetchError={formResult.error} customErrorMessage={""}/>
        </>
    );
}

/**
 * @param {{FormResult, Interviews[], String, Function(), Function()}} param0 
 * @returns 
 * 
 * NOTE: FormResult = {
 *      data: {
 *          interview_id: int,
 *          question: String, 
 *          difficulty: String 
 *      }, 
 *      error: String
 * }
 */
function QuestionFormFields({ formResult, interviews, setData }) {
    const DIFFICULTY = [ "Easy", "Intermediate", "Advanced"]; // Form MACROS for populating difficulty Select field
    return (
        <>
            {/* Selecting Interview */}
            <InterviewSelect
                interviews={interviews}
                selectedId={formResult.data.interview_id ?? ""}
                onChange={(e) => {
                    setData("interview_id", Number(e.target.value));
                }}
            />
            {/* Question */}
            <Form.Group>
                <Form.Label>Question</Form.Label>
                <Form.Control 
                    type="text"
                    value={formResult.data.question ?? ""}
                    placeholder="e.g. Explain the difference between \'let\' and \'const\' in js"
                    onChange={(e) => setData("question", e.target.value)}
                />
            </Form.Group>
            {/* Difficulty */}
            <Form.Group>
                <Form.Label>Difficulty</Form.Label>
                <Form.Select
                    value={formResult.data.difficulty ?? ""}
                    onChange={(e) => {
                        setData("difficulty", e.target.value)
                    }}
                    >
                        <option value="">-- Please select question difficulty --</option>
                        {DIFFICULTY.map((status, index) => (
                            <option key={index} value={status}>{status}</option>
                        ))}
                </Form.Select>
            </Form.Group>
        </>
    );
}

/**
 * @param {{Questions[], int, Fucntion(Event)}} param0 
 * @returns A Form.Select from the supplied array of question objects
 */
function QuestionSelect({ questions, selectedId, onChange }) {
    return (
        <>
            <CustomSelector 
                attributesKeys={["question", "difficulty"]}
                data={questions}
                selectedId={selectedId}
                onChange={onChange}
            />
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
            <Container className='pt-2 pb-2 me-2'>
                <CustomSelector 
                attributesKeys={["title", "job_role"]}
                data={interviews}
                selectedId={selectedId}
                onChange={onChange}
                />
            </Container>
        </>
    );
}