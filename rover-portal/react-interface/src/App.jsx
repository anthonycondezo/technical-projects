/* Pages */
import Home from './components/Home'
/* Layout components */

/* Other */
import { Container } from 'react-bootstrap'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'

function App() {
  const brandText = "Rover Web Portal";
  const navLinks = [
    { path: "/", text: "Home" }
  ];

  return (
    <>
      <Router>
        <main className='my-5'>
          {/* Routes */}
          <Routes>
            <Route path="/" element={<Home />} /> 
          </Routes>    
        </main>
      </Router>
    </>
  )
}

export default App
