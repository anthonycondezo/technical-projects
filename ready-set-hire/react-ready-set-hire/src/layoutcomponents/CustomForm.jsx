import { Container, Form, Button} from "react-bootstrap";

/**
 * A custom generic Form wrapper that performs fetch request (i.e. onSubmit callback)
 * @param {*} param0 
 * @returns - A generic form wrapper 
 */
function CustomForm({formTitle, state, setError, onSubmit, validationCheck, type = ADD, children}) {
    const EDIT = "EDIT"
    const DELETE = "DELETE"
    const handleSubmit = (e) => {
        e.preventDefault();
        const valid = validationCheck(setError); // set error flag
        if (!valid) return;
        setError(null); // reset error flag is it was non-null previously
        if (type === EDIT) {
            // send Edit fetch request
            onSubmit(state.selectedId, state.fieldState)
        } else if (type === DELETE) {
            // send Delete fetch request
            onSubmit(state.selectedId)
        } else {
            // send Create fetch request
            onSubmit(state.fieldState);
        }
    }
    return (
        <>
            <Container>
                <h2>{formTitle}</h2>
                <Container>
                    <Form onSubmit={handleSubmit}>
                        {children}
                        <Button variant="primary" type="submit" className='m-1'>
                         Submit
                        </Button>
                    </Form>
                </Container>
            </Container>
        </>
    );
}

export default CustomForm;