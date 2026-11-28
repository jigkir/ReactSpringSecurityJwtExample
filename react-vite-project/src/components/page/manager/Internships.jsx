import {useOutletContext} from "react-router-dom";
import ManagerInternshipList from "../../internships/ManagerInternshipList.jsx";

export default function Internships() {
    const {dark} = useOutletContext();
    return <ManagerInternshipList dark={dark}/>;
}
