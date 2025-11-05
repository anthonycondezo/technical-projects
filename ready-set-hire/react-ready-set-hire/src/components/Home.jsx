import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom';
import { Container, Button } from 'react-bootstrap'
/* Layout Components */
import CustomTable from "../layoutcomponents/CustomTable";
import CustomFilterTable from '../layoutcomponents/CustomFilterTable';
/* API Imports */
import { getApplicants } from '../api-ready-set-hire-requests/applicantRequests';
import { getInterviews } from "../api-ready-set-hire-requests/interviewRequests"
import { fetchData } from '../api-ready-set-hire-requests/fetchData';

/**
 * @returns The Home Page 
 */
function Home() {
    const [interviews, setInterviews] = useState({
      data: null, 
      fetchError: null
    })
    const [applicants, setApplicants] = useState({
      data: null, 
      fetchError: null
    });

    /** Populates applicants with fetch results from getApplicants() */
    async function fetchApplicants() {
      const setData = (newData) => { setApplicants((prev) => ({ ...prev, data: newData })) }; 
      const setError = (error) => { setApplicants((prev) => ({ ...prev, fetchError: error }))}
      fetchData(getApplicants, setData, setError, "Failed to fetch applicants: ");
    }
    /** Populates interviews with fetch results from getInterviews() */
    async function fetchInterviews() {
      const setData = (newData) => { setInterviews((prev) => ({ ...prev, data: newData })) };
      const setError = (error) => { setInterviews((prev) => ({ ...prev, fetchError: error})) };
      fetchData(getInterviews, setData, setError, "Failed to fetch interviews: ");
    }
    
    useEffect(() => { // fetch applicants and interviews
      fetchApplicants();
      fetchInterviews();
    }, []);
  
    return (
        <>
          <Container className='border rounded mt-3 mb-1'>
            <h1 className="mt-3 text-center"> Home </h1>
            <Container className='mt-5 mb-5'>
              <ApplicantStatusSummary applicants={applicants}/>
            </Container>
            <Container className='mt-5 mb-5'>
              <InterviewStatusSummary interviews={interviews} />
            </Container>
          </Container>
        </>
    );
}

export default Home;

/**
 * @param {Applicant[]} param0 
 * @returns A summary table where you filter applicants w.r.t. interv0ew_status
 */
function ApplicantStatusSummary({ applicants }) {
   const COLUMN_TITLES = ["ID", "Interview ID", "Title", "Firstname", "Surname"]; 
   const ATTRIBUTES = ["id", "interview_id", "title", "firstname", "surname"];
  return (
    
    <>
      <CustomFilterTable 
        title={{all: "Applicants", filtered: ["Remaining Applicants", "Applicants Pending Review"]}} 
        attributeFilter={"interview_status"} 
        filters={["Not Started", "Completed"]} 
        unfilteredTableData={applicants.data}
        columnTitles={{filtered: COLUMN_TITLES, all: [...COLUMN_TITLES, "Interview Status"]}}
        attributes={{filtered: ATTRIBUTES, all: [...ATTRIBUTES, "interview_status"]}}
        customErrorMessage={"No applicants could be found"}
      />
    </>
  );
}

/**
 * @param {Interview[]} param0 
 * @returns A summary table where you can filter interivews w.r.t status
 */
function InterviewStatusSummary({ interviews }) {
  const COLUMN_TITLES = ["ID", "Title", "Job Role", "Description"]; 
  const ATTRIBUTES = ["id", "title", "job_role", "description"];
   return (
    <>
      <CustomFilterTable 
        title={{all: "Interviews", filtered: ["Draft Interviews", "Published Interviews", "Archived Interviews"]}} 
        attributeFilter={"status"} 
        filters={["Draft", "Published", "Archived"]} 
        unfilteredTableData={interviews.data}
        columnTitles={{filtered: COLUMN_TITLES, all: [...COLUMN_TITLES, "Status"]}}
        attributes={{filtered: ATTRIBUTES, all: [...ATTRIBUTES, "status"]}}
        customErrorMessage={"No interviews could be found"}
      />
    </>
  );
}
