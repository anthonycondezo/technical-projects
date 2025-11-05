import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button, Container, Image, Card, ProgressBar, Alert } from "react-bootstrap";
/* Page imports */
import PageNotFound from "./PageNotFound.jsx";
/* Page layout imports */
import Transcriber from "../layoutcomponents/Transcriber";
/* api imports */
import { getQuestions } from "../api-ready-set-hire-requests/questionsRequests.js"
import { getInterviews } from "../api-ready-set-hire-requests/interviewRequests";
import { getApplicants, editApplicant } from "../api-ready-set-hire-requests/applicantRequests.js";
import { createAnswer } from "../api-ready-set-hire-requests/answerRequests.js"
import { fetchData, fetchEditData } from "../api-ready-set-hire-requests/fetchData.js"
/* assest imports */
import logo from '../assets/stoplights.svg';

/** 
 * @returns Interview Page
 */
function Interview() {
    /* Applicant details fetched from the database */
    const [applicant, setApplicant] = useState({
        id: 0, 
        interview_id: 0, 
        title: "", 
        firstname: "", 
        surname: "", 
        phone_number: "", 
        email_address: "", 
        interview_status: "", 
        username: ""
    });

    /* Verify that id belongs to an applicant with a pending interview */
    const { id } = useParams(); // extracting the id from :id url parameter
    const [loading, setLoading] = useState(true); // tracks loading state of page

    const [applicants, setApplicants] = useState([]) // all applicants in database // TODO: you don't need this, refactor code to use getApplicant() using id from url
    const [fetchError, setFetchError] = useState(''); // fetchError of fetch request on line 41
    const [isValidApplicant, setIsValidApplicant] = useState(false); // check flag: ensuring supplied id from url is valid //TODO: you might not need a variable to store this, use getApplicant() instead -> if null => id is invalid by default

    /* All Interview Questions in Database */
    const [questions, setQuestions] = useState({ // all questions from database TODO:  see if you can create a cusomised fetch query using SELECT interview_id From Question WHERE applicant_id = id; query => save output to interviewQuestions 
        data: [],
        fetchError: null
    })

    /* Interview questions for THIS interveiw */
    const [interviewQuestions, setInterviewQuestions] = useState([]); // all questions relervant to this interview 
    const [noInterviewQuestions, setNoInterviewQuestions] = useState(false);

    /* For Managing Welcome, Goodbye and Questions Page State */
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showWelcome, setWelcome] = useState(true);
    const [showGoodbye, setGoodbye] = useState(false); // to set the state of goodbye
    const [savedResponses, setSavedResponses] = useState([]); // for saving the recorded transcriped responses made by applicant
    const [fetchRequestError, setFetchRequestError] = useState(null);

    /** Populates questions with getQuestions() */
    async function fetchQuestions() {
        const setData = (newData) => setQuestions((prev) => ({ ...prev, data: newData }));
        const setFetchError = (error) => setQuestions((prev) => ({ ...prev, fetchError: error }));
        fetchData(getQuestions, setData, setFetchError, "Failed to fetch interviews:")   
    };

    /* Loading Data and Verifcation */
    useEffect(() => { // fetching all applicants from database
        setLoading(true);
        fetchData(getApplicants, setApplicants, setFetchError, "Failed to fetch applicants.")
            .finally(() => setLoading(false));
    }, []);

    /** Perform validation - ensure supplied appilcant id is valid */
    useEffect(() => {
        if (!loading && applicants.length > 0) {
            const applicantId = id.slice(1);
            const validApplicant = applicants.find(a => a.id.toString() === applicantId);
            setIsValidApplicant(!!validApplicant);
            setApplicant(validApplicant); // to be used later if valud
        }
    }, [applicants, id, loading]);

    /** Populate questions  */
    useEffect(() => { fetchQuestions() }, []); 

    /** Populate interviewQuestions - questions that pertain to this interview only */
    useEffect(() => {
        if (!questions.fetchError && questions.data.length > 0 && applicant?.interview_id) {
            const relervantQuestions = questions.data.filter(
                (q) => q.interview_id === applicant.interview_id
            ); // questions pertaining to this interview only
            setInterviewQuestions(relervantQuestions);
        }
    }, [questions, applicant]);

    useEffect(() => {
        if (interviewQuestions.length === 0) {
            // there are no question avaliable for this interview - notify user
            setNoInterviewQuestions(true)
        }   
    }, [interviewQuestions]);
    /* Error Handling Pages */
    if (loading) {
        // show loading page while fetch request getApplicants() is in progress (line 37)
        return <p>Loading...</p>; // TODO: change this to a loading page
    }

    if (!isValidApplicant && !loading) {
        // show page not found IF applicant interview verification failed
        return (
            <PageNotFound 
                enableHomeButton={false} 
                customMessage={`Verifcation Failed. Please contact hiring manager`}
            />
        );
    }

    if (fetchError && !loading) {
        // show page not found link itself is not valid 
         return (
            <PageNotFound 
                enableHomeButton={false} 
                customMessage={`Broken link. Please contact hiring manager`}
            />
        );
    }
        
    if (!noInterviewQuestions && !loading) {
        return (
            <PageNotFound 
                enableHomeButton={false}
                customMessage={"No questions could be found. Please contact hiring manager"}
            />
        );
    }

    //TODO: work on error handling
    /** Callback function - gets next question card */
    const handleNext = async () => {    
         /** Attempt to save the answer to the database */
        async function fetchAddAnswer(newAnswer) {
            try {
                const createdAnswer = await createAnswer(newAnswer);
                if (!createdAnswer) {
                    // failed to save answer to database
                    return false;
                }
                return true;
            } catch (error) {
                console.error("Error saving answer:", error);
                return false;
            }
        }   
        const newAnswer = {
            interview_id: Number(applicant.interview_id), 
            question_id: Number(interviewQuestions[currentIndex].id), 
            applicant_id: Number(applicant.id),
            answer: savedResponses[currentIndex] ?? ""
        };

        try {
            const success = await fetchAddAnswer(newAnswer); // attempt to save answer to database
            
            if (!success) { // TODO: reset recording if answer could not be saved
                setFetchRequestError("Failed to save your answer. Please try again.");
                return; 
            }
            setFetchRequestError(null); // reset when successful

            if (currentIndex < interviewQuestions.length - 1) {
                // get next page
                setCurrentIndex((prev) => prev + 1);
            } else {
                // TODO: update progress bar to full 
                setGoodbye(true);
            }
        } catch (error) {
            setFetchRequestError(`Failed to save your answer: ${error.message}`);
        }
    };

    return (
        <>
            {/* Fullscreen Welcome Cover */}
            <WelcomeCover showWelcome={showWelcome} setWelcome={setWelcome} applicant={applicant} interviewQuestions={interviewQuestions}/>
            {/* Question cards */}
                {!showWelcome && !showGoodbye && (
                    <Container className="d-flex flex-column min-vh-100 justify-content-center align-items-center">
                        <Card className="shadow-lg rounded-4" 
                        style={{ width: "30rem", height: "30rem" }}>
                            <Card.Body className="d-flex flex-column justify-content-center align-items-center text-center" style={{ height: '100%' }}>
                                <Card.Title>Question {currentIndex + 1}</Card.Title>
                                <Card.Subtitle className="mb-2 text-muted">
                                    Difficulty: {interviewQuestions[currentIndex].difficulty}
                                </Card.Subtitle>
                                <Card.Text>{interviewQuestions[currentIndex].question}</Card.Text>
                               
                                <Container className="mt-3">
                                    <Container className="mt-5"> 
                                        <ProgressBar
                                        now={((currentIndex) / interviewQuestions.length) * 100}
                                        label={`${currentIndex} / ${interviewQuestions.length}`}
                                        /> 
                                    </Container>
                                </Container>
                                <Container className="mt-1"> Remaining Questions: {interviewQuestions.length - currentIndex} </Container>
                                <div className="mt-3">
                                    <Transcriber resetTrigger={currentIndex} saveToCallback={setSavedResponses} />
                                </div>
                            </Card.Body>
                        </Card>
                        <Button variant="primary" className="my-4" onClick={handleNext}>
                            {currentIndex < interviewQuestions.length - 1 ? "Next Question" : "Finish"}
                        </Button>
                        {
                            fetchRequestError && (
                                <Alert variant="warning">
                                    {fetchRequestError}
                                </Alert>
                            )
                        }
                    </Container>
                )}
            {/* Fullscreen Goodbye Cover */}
            <GoodbyeCover applicant={applicant} showGoodbye={showGoodbye} />
        </>
    );
}

export default Interview;

/**
 * Renders the Fullscreen welcome cover
 * @param {*} param0 
 * @returns A WelcomeCover componet
 */
function WelcomeCover({ showWelcome, setWelcome, applicant, interviewQuestions = null }) {
    const [interview, setInterview] = useState(null);
    const [interviews, setInterviews] = useState({
        data: [], 
        fetchError: null
    })
    
    /**
     * Populates interviews with fetch results from getInterviews()
     */
    async function fetchInterviews() {
        const setData = (newData) => setInterviews((prev) => ({ ...prev, data: newData }));
        const setFetchError = (error) => setInterviews((prev) => ({ ...prev, fetchError: error }));
        fetchData(getInterviews, setData, setFetchError, "Failed to fetch interviews:")   
    };

    useEffect(() => { // send fetch request 
        fetchInterviews();
    }, []); 

    useEffect(() => { // find relervant interview
        if (!interviews.fetchError && interviews.data.length > 0) {
            setInterview(interviews.data.find((i) => i.id === applicant.interview_id));
        }
    }, [interviews, applicant]);

    return (
        <>
        {showWelcome && interview && (
                <Container className="
                    d-flex 
                    flex-column 
                    min-vh-100 
                    justify-content-center 
                    align-items-center 
                    text-center 
                    bg-primary
                    rounded-4">
                        <div className="bg-white rounded-circle" 
                          style={{ width: '130px', height: '130px', overflow: 'hidden' }}>
                            <Image 
                                src={logo} 
                                alt="Logo" 
                                width={100} 
                                height={100} 
                                className="my-3"
                            />
                        </div>
                        <h1 className="my-2"> {`Welcome ${applicant.firstname.trim()}`}!</h1>
                        <Container>
                            <p> 
                            {`${applicant.title.trim()} ${applicant.firstname.trim()} ${applicant.surname.trim()},
                            please ensure your contact details and position details you wish for are correct.`}
                            </p>
                            <p> 
                            {`Email: ${applicant.email_address.trim()}`}
                            </p>
                            <p>
                            {`Phone Number: ${applicant.phone_number.trim()}`}
                            </p>
                        </Container>
                        <Container>
                            <h3>Interview Details</h3>
                            <p>{`Position: ${interview.title} - ${interview.job_role}`}</p>
                            <p>{`Description: ${interview.description}`}</p>
                            <p>{`Status: ${interview.status}`}</p>
                        </Container>                    
                        <Container>
                            <h3>Instructions:</h3>
                            <p> You will be dislayed one question per page. 
                                A next button is included to proceed to the next quesiton only when you have successfully recorded your response.
                                You cannot re-record/restart your response. But you are given a pause/resume recording button for your convenience.
                            </p>
                        </Container>
                        <Button variant="success" className="m-1 border" onClick={() => setWelcome(!showWelcome)}>
                            Begin Interview
                        </Button>
                </Container>
            )}

            {showWelcome && !interview && ( 
                <Alert variant="warning">
                    An unexpected error occured loading interview details. Please contact us. 
                </Alert>
            )}
        </>
    );
}


/**
 * Renders the Fullscreen goodbye cover
 * @param {*} param0 
 * @returns A GoodbyeCover compoent
 */
function GoodbyeCover({ showGoodbye, applicant, debugResponses = null }) {
    const [error, setError] = useState(null);
    async function fetchEditApplicant(id, updatedApplicant) { 
        fetchEditData(id, updatedApplicant, editApplicant, setError, () => {}); 
    }
    useEffect(() => {
        fetchEditApplicant(
            applicant.id, 
            {
                interview_id: applicant.interview_id, 
                title: applicant.title, 
                firstname: applicant.firstname, 
                surname: applicant.surname,
                phone_number: applicant.phone_number,
                email_address: applicant.email_address, 
                interview_status: "Completed"
            });
    }, []);
    return (
        <>
            {showGoodbye && (
                <Container className="
                    d-flex 
                    flex-column 
                    min-vh-100 
                    justify-content-center 
                    align-items-center 
                    text-center 
                    bg-primary
                    rounded-4">
                        <h1 className="my-2"> Interview Complete </h1>
                        <p>Thank you for completing the interview</p>
                        { debugResponses && (
                            <Container>
                            {/* TODO: do not include in final */}
                            <p>TODO: Remove one debugging is complete</p>
                            <div><strong> debugging: saved responses </strong></div>
                            {debugResponses.map((response, index) => (
                                <div key={index}>{response}</div>
                            ))}
                        </Container>
                        )}
                </Container>
            )}
        </>
    );
}

// Populate the questions cards accordingly
// TODO: Consider creating a customised loading page. 
// TODO: Make it that the user cannot progress further without completing the recording -> You might need to pass a variable into Transcriber so transcriber can update it when recording is complete
//  MAYBE you can you can use the length of the resposne array to determine if the applicant has answered the interview?

// MAKE ERROR Handling more robust = applicant not found => Alert, interview not found Alert, questions nor found => Alert

// Resest or disable pause button when user decides to move onto the next question

// TODO: refactor code to just use getAppicant(int id)

// TODO: Update Interview component to display -> interview already taken. 