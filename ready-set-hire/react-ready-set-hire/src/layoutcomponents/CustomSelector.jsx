import { Form } from 'react-bootstrap';
import {Container } from 'react-bootstrap';

/**
 * An customised extension of Form.Select
 * 
 * @param {{String[2], Object[], int, Function(Event)}} param0 
 * @returns A Form.Select component from that supplied attributeKeys and data
 */
function CustomSelector({attributesKeys, data, selectedId, onChange }) {
    const FIRST = 0;
    const SECOND = 1;
    return (
       <>
        <Container>
            <Form.Select value={selectedId || ""} onChange={onChange}>
                <option value="" className='text-center'>-- Please select a interview --</option>
                {/* Generating all options from supplied data */}
                {data.map((obj) => (
                    <option key={obj.id} value={obj.id}>
                        {/* Constructing formated option message from supplied attribute keys */}
                        {`${obj[attributesKeys[FIRST]]} ${obj[attributesKeys[SECOND]]} (id: ${obj.id})`}
                    </option>
                ))}
                </Form.Select>
        </Container>
      </>
    );
}

export default CustomSelector;