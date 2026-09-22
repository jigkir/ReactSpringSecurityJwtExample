import {StrictMode} from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App.jsx';
import {DarkModeProvider} from './styles/DarkMode.jsx';
import './index.css';
import './i18n';

ReactDOM.createRoot(document.getElementById("root")).render(
    <StrictMode>
        <BrowserRouter>
            <DarkModeProvider>
                <App/>
            </DarkModeProvider>
        </BrowserRouter>
    </StrictMode>
);