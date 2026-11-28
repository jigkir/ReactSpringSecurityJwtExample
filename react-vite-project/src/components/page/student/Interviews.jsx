import {useOutletContext} from "react-router-dom";
import InterviewList from "../../features/interviews/InterviewList.jsx";

export default function Interviews() {
    const {dark, user} = useOutletContext();
    return <InterviewList dark={dark} user={user} audience="STUDENT"/>;
}
