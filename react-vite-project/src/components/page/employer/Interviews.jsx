import {useOutletContext} from "react-router-dom";
import InterviewList from "../../features/interviews/InterviewList.jsx";

export default function EmployerInterviews({user}) {
    const {dark} = useOutletContext();
    return <InterviewList dark={dark} user={user} audience="EMPLOYER"/>;
}
