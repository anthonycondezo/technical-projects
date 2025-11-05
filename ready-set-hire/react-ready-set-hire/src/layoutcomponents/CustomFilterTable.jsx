import { useState, useEffect } from 'react'; 
import { Container, Button } from 'react-bootstrap';
/* Custom Imports */
import CustomTable from './CustomTable';

/**
 * 
 * @param {*} param0 
 * @returns 
 */
function CustomFilterTable({ 
    title, 
    attributeFilter, 
    filters, 
    unfilteredTableData, 
    columnTitles, 
    attributes, 
    customErrorMessage
}) {
    const [index, setIndex] = useState(0);
    const [all, setAll] = useState(false)
    const nextIndex = (i) => (i + 1) % filters.length;
    const [filteredData, setFilteredData] = useState([]);
    /* Get Filtered Data */
    useEffect(() => {
           if (!unfilteredTableData) return;
            setFilteredData( unfilteredTableData.filter(
                (obj) => obj?.[attributeFilter] === filters[index]
            ));
    }, [unfilteredTableData, index, attributeFilter, filters]);
    return (
        <>
            <Container>
                { (all) ?
                    (   // Show All Entries
                        <CustomTable 
                            tableTitle={title.all}
                            data={unfilteredTableData}
                            columnTitles={columnTitles.all}
                            attributes={attributes.all}
                            customErrorMessage={customErrorMessage}
                        />
                    ) : ( // Show Filtered Entires
                        <CustomTable 
                            tableTitle={title.filtered[index]}
                            data={filteredData}
                            columnTitles={columnTitles.filtered}
                            attributes={attributes.filtered}
                            customErrorMessage={customErrorMessage}
                        />  
                    )
                }
            </Container>
            <Container className='d-flex justify-content-end'>
                <Button type='submit' className='m-1 btn-orange' disabled={all} onClick={() => setIndex(nextIndex(index))}>
                    See {filters[nextIndex(index)]}
                </Button>
                <Button variant='primary' type='submit' className='m-1' onClick={() => setAll((prev) => !prev)}>
                    See {all ? "Filtered" : "All"}
                </Button>
            </Container>
        
        </>
    );
}

export default CustomFilterTable;