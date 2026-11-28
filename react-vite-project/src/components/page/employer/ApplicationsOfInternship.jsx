import {useOutletContext} from "react-router-dom";
import InternshipApplicationList from "../../applications/InternshipApplicationList.jsx";

export default function ApplicationsOfInternship({user}) {
    const {dark} = useOutletContext();
    return <InternshipApplicationList dark={dark} user={user}/>;
}
