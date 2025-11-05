By Anthony Condezo: 

Icon References: 
    - stoplights.svg: https://icons.getbootstrap.com/icons/stoplights/


AI ussage statement: AI was used to support development. 
- CustomTranscriber.jsx - Transcriber() - For drafting the "pause" functionality, including: 
    (A) pause const variable, 
    (B) pauseAttempted cosnt variable

- CustomTranscriber.jsx - Transcriber() - For identifying the need of "resetTrigger" parameter as a means of reseting the transciber state, which includes: 
    (A) Drafting the useEffect() on line 26 - resetting the Transriber() component state whenever resetTrigger (i.e. currentIndex) incremented.

- Interview.jsx - Interviews() - For setting up a draft Loading and Verification State, including: 
    (A) Drafting useEffect() statements, ensuring that each were dependent on the relervant variables. 

- Interview.jsx - Interviews() - For identifying the ProgressBar component that I wasn't aware of, used it's example to draft my own implementation. 

- Headding.jsx - HeadingBanner() - For identifying the useLocation() function that I wasn't aware of to identifying the page that I was on: 
    (A) I then used to independently implement the enableHomeLink functionality, to disallow applicants on the interview page from accessing other pages.
    (B) I then to refactor Heading() code to conditionally render the Header nav links ONLY on page that were no the interview page. Again, to disallow applicants on the interview page from accessing other pages.

- GoBackButtons.jsx: - GoBackButton() - For identifying the useNavigate() function that I wasn't aware of to draft an implementation of the Go Back onClick callback function.

Further Notes: 
    (i) llm_server used code from applied online practical code in week 7. 
    (ii) code in api-ready-set-hire-requests used supplied started code. 
    (iii) transcriber.js transcriber code from week 7 lectures. 
    (iv) CustomTranscriber.jsx inpired from week 7 lectures..
    (v) App.jsx and Header.jsx inspired from week 6 applied class 