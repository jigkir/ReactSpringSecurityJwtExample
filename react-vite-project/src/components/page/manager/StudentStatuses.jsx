import {useOutletContext} from "react-router-dom";
import StudentStatusesList from "../../student-statuses/StudentStatuses.jsx";

export default function StudentStatuses() {
    const {dark} = useOutletContext();
    return <StudentStatusesList dark={dark}/>;
}
