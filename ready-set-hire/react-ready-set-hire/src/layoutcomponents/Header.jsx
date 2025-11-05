import { Link, useLocation } from 'react-router-dom';
import { Navbar, Container, Nav, Image } from 'react-bootstrap';
import logo from '../assets/stoplights.svg';
/* Bootstap Imports */
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; 

/**
 * 
 * @param {{String, {path: String, text: String}[]}} param0 - Company logo and an array of navlink object paramters used to initialised Navlink components
 * @returns The Header Component
 */
function Header({ brandText, navLinks }) {
  const location = useLocation();
  const inInterview = location.pathname.includes("/interview:");
  return (
    <Navbar bg="primary" variant="dark" expand="lg">
      <Container>
          <HeadingBanner brandText={brandText} enableHomeLink={!inInterview} />
          {/* Collapable Hamburger + Navlinks*/}
          { !inInterview && (
            <><Navbar.Toggle aria-controls="navbar-nav"
            className='border border-white' /><Navbar.Collapse id="navbar-nav">
              <Nav className="ms-auto flex-column flex-lg-row">
                {navLinks.map((link, index) => (
                  <Nav.Link
                    as={Link}
                    to={link.path}
                    key={link.path}
                    active={location.pathname === link.path}
                    className='my-0 py-0'
                  >
                    {link.text}
                    <div className={index < navLinks.length - 1 ? "my-1 border-bottom border-white d-lg-none" : ""}></div>
                  </Nav.Link>
                ))}
              </Nav>
            </Navbar.Collapse></>
          )}
      </Container>
    </Navbar>
  );
}

export default Header;


/**
 * Returns the Heading Banner that includes company logo. Banner servers as a link to home page if enabled.
 * @param {{String, boolean}} param0 - The Company Name and home link flag respectfully 
 * @returns A Heading Banner
 */
function HeadingBanner({ brandText, enableHomeLink}) {
  return (<>
    {enableHomeLink ? 
      (
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          {/* Logo container */}
          <div
            className="bg-white rounded-circle d-flex justify-content-center align-items-center me-2"
            style={{ width: '60px', height: '60px', overflow: 'hidden' }}
          >
            <Image
              src={logo}
              alt="Logo"
              width={40}
              height={40}
            />
          </div>

          {/* Brand text */}
          <span>{brandText}</span>
        </Navbar.Brand>
      ) : (
        <Navbar.Brand className='d-flex align-items-center'>
           {/* Logo container */}
          <div
            className="bg-white rounded-circle d-flex justify-content-center align-items-center me-2"
            style={{ width: '60px', height: '60px', overflow: 'hidden' }}
          >
            <Image
              src={logo}
              alt="Logo"
              width={40}
              height={40}
            />
          </div>

          {/* Brand text */}
          <span>{brandText}</span>
        </Navbar.Brand>
      )
    }
  </>
  );
}