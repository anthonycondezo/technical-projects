import { Container, Table, Alert } from "react-bootstrap";
// tableTitle - name of table
// data - applicants, questions, interviews etc
// coloumn title - 
// attribute - used to access attributes of a given data object

function CustomTable({tableTitle, data, columnTitles, attributes, customErrorMessage = null}) {
    const ID = 0;
    return (
        <>
            <Container className='border rounded my-3'>
                <h2>{tableTitle}</h2>
                {
                (data.length != 0) ? (
                    <Container className="my-3">
                        <Table striped bordered hover size="sm" className="my-2">
                            <thead>
                                <tr>
                                    { // poopulating column title
                                        columnTitles.map((col, index) => (
                                            <th key={index}>{col}</th>
                                        ))
                                    }
                                </tr>
                            </thead>
                            <tbody>
                                    { // populating rom columns
                                        data.map((obj, colIndex) => (
                                            <tr key={obj[attributes[ID]]}>
                                                {
                                                    attributes.map((at, attrIndex) => (
                                                        <td key={`${obj[attributes[ID]]}-${attrIndex}`}>{obj[at]}</td>
                                                    ))
                                                }
                                            </tr>
                                    ))
                                }
                            </tbody>
                        </Table>
                        
                    </Container>
                ) : (
                    <Alert variant="info">
                       {customErrorMessage 
                       ? customErrorMessage
                       : `No records found for ${tableTitle}`}
                    </Alert>
                )
            }
            </Container>
        </>
    );   
}

export default CustomTable;