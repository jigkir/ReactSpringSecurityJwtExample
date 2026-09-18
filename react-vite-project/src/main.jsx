import React from "react";
import ReactDOM from "react-dom/client";
import {BrowserRouter} from "react-router-dom";
import App from "./App.jsx";
import {DarkModeProvider} from "./styles/DarkMode.jsx";
import "./index.css";
import "./components/Translations/Translations.jsx"

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <DarkModeProvider>
                <App/>
            </DarkModeProvider>
        </BrowserRouter>
    </React.StrictMode>
);