import { Button } from 'react-bootstrap'
import { useNavigate, useLocation } from 'react-router-dom';

function GoBackButton() {
    const nav = useNavigate();
    const location = useLocation();
    const inInterview = location.pathname.includes("/interview/");
    return (
        <>
            { !inInterview && (
                <Button variant='secondary' onClick={() => nav(-1)}>
                    Go back
                </Button>
            )}
        </>
    );
}

export default GoBackButton;