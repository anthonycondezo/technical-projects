import { useState, useEffect } from 'react';
import { Container, Form, Button } from 'react-bootstrap';
/* Layout imports */
import CustomSelector from './CustomSelector';
import FetchAlert from './FetchAlert';

/**
 * Component senda a request to the llm server requesting for a new question based of the title, 
 * job_role and description of a given Interview object.
 * 
 * @param {Interview[]} param0 -  an array of interview objects 
 * @returns A compnent that generates a new question with a corresponding difficulty. 
 */
function QuestionGenerator({interviews, onSubmit }) {
    const [id, setId] = useState(null); // selected interview id
    const [interviewDetails, setInterviewDetails] = useState(null); // to be sent to the LLM model
    const [generatedQuestion, setGeneratedQuestion] = useState(null); // LLM's response  
    const ERRORS= {
        fetch: "failed to generate a new question", 
        find: "failed to find chosen interview", 
        gen: "please generate question"
    }
    const [error, setError] = useState(null); 

    /* Populate interview details */
    useEffect(() => {
        const chosenInterview = interviews.find((i) => i.id === id)
        if (!chosenInterview) { setError(null); return; } // find failed
        setError(null); // reset if triggered previously
        setInterviewDetails({
            title: chosenInterview.title, 
            job_role: chosenInterview.job_role, 
            description: chosenInterview.description
        });
    }, [interviews, id]);

    /* Send request to LLM server */
    useEffect(()  => {
        if (!interviewDetails) return; // skip when null

        /* Attempts request, catches errors othewise */
        const fetchQuestion = async () => {
            try {
                const result = await fetchNewQuestion(interviewDetails);
                if (!result) {
                    setError(ERRORS.fetch);
                    return;
                }
                setError(null); // reset
                setGeneratedQuestion(await result.json()); 
            } catch (err) {
                setError(ERRORS.fetch);
            }
        };
        fetchQuestion();
    }, [interviewDetails]);

    /* Saves generated question to the database through a fetch request */
    const handleSubmit = (e) => {
        e.preventDefault();
        if (error) {
            // error generating question 
            setError(ERRORS.gen);
            return;
        }
        setError(null);
        /* Send request to add generated question to database */
        onSubmit({ 
            interview_id: id, 
            question: generatedQuestion.question, 
            difficulty: generatedQuestion.difficulty
        });
    }

    return (
        <>
            <Container>
                <h2>Question Generator</h2>
                {/* Selects interview to generate the question from */}
                <InterviewSelect 
                    interviews={interviews}
                    selectedId={id}
                    onChange={(e) => {setId(Number(e.target.value))}}
                />
                <Container>
                    <Form onSubmit={handleSubmit}>
                    {
                        (generatedQuestion) ? (
                            <>
                                {/* Display Generated Question and Difficulty */}
                                <Form.Label className='border rounded pt-2 pb-2 me-2 text-center' style={{width: "100%"}}>
                                    Q: {generatedQuestion.question}
                                </Form.Label>
                                <Form.Label className='border rounded pt-2 pb-2 me-2 text-center' style={{width: "100%"}} >
                                    Difficulty: {generatedQuestion.difficulty}
                                </Form.Label>
                            </>
                        ) : (
                            <>
                                {/* Prompt user to coose an interivw */}
                                <Form.Label className='border rounded pt-2 pb-2 m-2 text-center' style={{width: "100%"}}> 
                                    Please choose an interview
                                </Form.Label>
                            </>
                        )
                    }
                    {/* Form Submit Button */}
                    <Button variant="primary" type="submit" className="me-2">
                        Submit generated question
                    </Button>
                </Form>
                </Container>
                <FetchAlert fetchError={error}/>
            </Container>
        </>
    );
}

export default QuestionGenerator;


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

/**
 * Sends request for a new question to LLM server
 * 
 * @param {{title: String, job_role: String, description: String}} interviewDetails 
 * @returns {question: String, description: String} - An object that includes the new generated question and description.
 */
async function fetchNewQuestion(interviewDetails) {
    const BASE_URL = "http://localhost:3001/api/generate-question"; 
    /* Populating url parameter values */
    const title = encodeURIComponent(interviewDetails.title); 
    const jobRole = encodeURIComponent(interviewDetails.job_role); 
    const description = encodeURIComponent(interviewDetails.description);
    /* Send request */
    const url = `${BASE_URL}?title=${title}&job_role=${jobRole}&description=${description}`
    const result = await fetch(url, { method: "GET" });
    // Consider: include another error handing layer i.e. use .catch()
    return result;
}


// TODO: ensure fix styling of questions being presented
// TODO: ensure add a "add generated question" button to add the generated question. 