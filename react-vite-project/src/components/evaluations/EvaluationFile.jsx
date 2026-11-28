import {useOutletContext, useParams} from "react-router-dom";
import {getEvaluationRole} from "../../utils/EvaluationRole.js";
import PdfFilePage from "../documents/PdfFilePage.jsx";

export default function EvaluationFile() {
    const {dark, user} = useOutletContext();
    const {id} = useParams();
    const role = getEvaluationRole(user);
    return (
        <PdfFilePage
            dark={dark} id={Number(id)} backTo={role.basePath}
            titleKey="workplaceEvaluation.title" subtitleKey="workplaceEvaluation.file.subtitle"
            backKey="workplaceEvaluation.file.back" docType="workplace-evaluation"
            fetchFile={(evaluationId, language) => role.fetchFile(evaluationId, language)}
        />
    );
}