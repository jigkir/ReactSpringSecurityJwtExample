import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import fetcher from "../../utils/fetcher.js";
import {useTranslation} from 'react-i18next';


const EmployerHome = ({user}) => {
    const [message, setMessage] = useState("");
    const {dark} = useOutletContext();
    const {t} = useTranslation();
}

export default EmployerHome;