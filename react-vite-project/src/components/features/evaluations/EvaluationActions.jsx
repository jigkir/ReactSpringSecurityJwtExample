import {useTranslation} from "react-i18next";
import Button from "../../../styles/Button.jsx";

export default function EvaluationActions({dark, role, isSigned, isCompleted, onEdit, onSign}) {
    const {t} = useTranslation();
    if (role.actionsKey !== "teacher") return null;
    return (
        <div className="flex flex-wrap justify-end gap-2">
            {!isSigned && role.can.fill && (
                <Button tone="warning" icon="edit" dark={dark} onClick={onEdit}>
                    {isCompleted ? t("workplaceEvaluation.card.reviewOrEdit") : t("workplaceEvaluation.card.fillEvaluation")}
                </Button>
            )}
            {isCompleted && !isSigned && role.can.sign && onSign && (
                <Button dark={dark} lockTone icon="edit" tone="success" onClick={onSign}>
                    {t("workplaceEvaluation.card.sign")}
                </Button>
            )}
        </div>
    );
}
