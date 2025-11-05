import { useState, useEffect } from 'react'
import { Container, Button } from 'react-bootstrap'

function ThemeToggle() {
    // tracks whether the theme is light or dark - default setting is auto
    const [theme, setTheme] = useState(
        localStorage.getItem('theme') || 'auto'
    );

    useEffect(() => {
        const root = document.documentElement;
        if (theme === "auto") {
            // Detect system preference
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            root.setAttribute("data-bs-theme", prefersDark ? "dark" : "light");
        } else {
            root.setAttribute("data-bs-theme", theme);
        }
        localStorage.setItem("theme", theme);
        }, 
        [theme]
    );

    return (
        <>
           <Container className='text-end'>
                <Button
                    variant="secondary"
                    className={(theme === "light") ? "bg-dark text-white" : "bg-white text-black"
                    }
                    onClick={() =>
                        setTheme(prev =>
                        prev === "light" ? "dark" : "light"
                        )
                    }
                    >
                    {theme == "light" ? "Light Mode" : "Dark Mode"}
                </Button>
           </Container>
        </>
    );
}

export default ThemeToggle;