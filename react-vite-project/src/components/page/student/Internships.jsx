import {useOutletContext} from "react-router-dom";
import StudentInternshipList from "../../internships/StudentInternshipList.jsx";

export default function Internships() {
    const {dark} = useOutletContext();
    return <StudentInternshipList dark={dark}/>;
}
