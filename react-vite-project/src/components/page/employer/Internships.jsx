import {useOutletContext} from "react-router-dom";
import EmployerInternshipList from "../../features/internships/EmployerInternshipList.jsx";

export default function Internships({user}) {
    const {dark} = useOutletContext();
    return <EmployerInternshipList dark={dark} user={user}/>;
}
