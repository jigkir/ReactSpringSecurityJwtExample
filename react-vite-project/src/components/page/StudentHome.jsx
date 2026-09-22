import {useState} from "react";
import {useOutletContext} from "react-router-dom";
import fetcher from "../../utils/fetcher.js";
import {useTranslation} from 'react-i18next';

const StudentHome = ({user}) => {
    const [message, setMessage] = useState("");
    const {dark} = useOutletContext();
    const {t} = useTranslation();

    return (
        <div className={`flex-1 p-6 ${dark ? "text-white" : "text-gray-900"}`}>
            <h1 className="text-2xl font-bold">
                Student Home
            </h1>

            <p>Welcome {user?.firstName || ''}</p>
        </div>
    );
}

export default StudentHome;