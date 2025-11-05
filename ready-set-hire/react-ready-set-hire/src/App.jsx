/* Pages */
import Home from './components/Home';
import Applicants from './components/Applicants';
import Interview from './components/Interview';
import Interviews from './components/Interviews';
import Questions from './components/Questions'
import PageNotFound from './components/PageNotFound';
/* Layout Components */
import Header from './layoutcomponents/Header';
import Footer from './layoutcomponents/Footer';
import ThemeToggle from './layoutcomponents/ThemeToggle';
import GoBackButton from './layoutcomponents/GoBackButton';
/* Other */
import { Container } from 'react-bootstrap'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './custom.css'


function App() {
const brandtext = "Ready Set Hire"
const navLinks = [
    { path: "/", text: "Home" }, 
    { path: "/interviews", text: "Interviews" },
    { path: "/applicants", text: "Applicants" }, 
    { path: "/questions", text: "Questions" }
  ]
  return (
    <Router>
      {/* Navigation Handled By Header */}
      <Header brandText={brandtext} navLinks={navLinks} />
      <main className='my-5'>
        <Container className='text-end'>
          <GoBackButton />
        </Container>
         {/* Routes */}
        <Routes>      
          <Route path="/" element={<Home />} />   
          <Route path="/interviews" element={<Interviews/> }/>   
          <Route path="/applicants" element={<Applicants />}/>
          <Route path="/questions" element={<Questions />}/>
          <Route path="/interview/:id" element={<Interview />}/>
          <Route path="*" element={<PageNotFound />}/>
        </Routes>
      </main>

       <Container>
        {/* Toggle theme */}
        <ThemeToggle />
      </Container>
      <Footer />
    </Router>
  );
}

export default App;
