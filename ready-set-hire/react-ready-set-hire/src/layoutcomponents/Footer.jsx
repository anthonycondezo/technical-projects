import { Container } from "react-bootstrap";

function Footer() {
    return (
        <>
            <footer 
            className="bg-dark text-white text-center py-3 mt-5 border-top border-white">
                  <p>&copy; {new Date().getFullYear()} Ready Set Hire</p>
            </footer>
        </>
    );
}

export default Footer;