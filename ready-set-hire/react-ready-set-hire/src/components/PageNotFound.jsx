import { Link } from "react-router-dom";
import { Container, Button } from "react-bootstrap";

/**
 * @param {{boolean, String}} param0 - enable header banner as a link to the home page and the reason that the page was not found.  
 * @returns 
 */
function PageNotFound({ enableHomeButton = true, customMessage = ''}) {
    const defaultMessage = "An unexpected error has occured loading page";
    return (
        <>
            <Container>
                <h1> Page not found</h1>
                <p>{customMessage ? customMessage : defaultMessage}</p>
                { enableHomeButton && (
                    <Link to='/'>
                      <Button variant='success' className='m-1'>
                        Go Home
                      </Button>
                    </Link>
                )}
            </Container>
           
        </>
    );
}

export default PageNotFound;