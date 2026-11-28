import {useOutletContext} from "react-router-dom";
import EvaluationList from "../../features/evaluations/EvaluationList.jsx";

export default function Evaluations() {
    const {dark, user} = useOutletContext();
    return <EvaluationList dark={dark} user={user}/>;
}