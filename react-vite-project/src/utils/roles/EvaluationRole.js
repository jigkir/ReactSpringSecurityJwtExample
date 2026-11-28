import {COLOR, ALL} from "../status/StatusColor.js";
import {PATHS} from "../../routes/AppRoutes.jsx";
import {
    fetchWorkplaceEvaluations,
    fetchWorkplaceEvaluationsManager,
    getWorkplaceEvaluationFile,
    getWorkplaceEvaluationFileManager,
    saveWorkplaceEvaluations,
    signWorkplaceEvaluation,
} from "../../components/shared/core/api/Api.jsx";
import {devSignWorkplaceEvaluation} from "../../components/shared/core/api/DevApi.jsx";
import {createInitialEvaluation, validateEvaluation} from "../evaluations/WorkplaceEvaluation.js";

export const EVALUATION_ROLES = {
    TEACHER: {
        can: {fill: true, sign: true, openFile: true},
        fetchList: (...args) => fetchWorkplaceEvaluations(...args),
        fetchFile: (...args) => getWorkplaceEvaluationFile(...args),
        save: (...args) => saveWorkplaceEvaluations(...args),
        sign: (...args) => signWorkplaceEvaluation(...args),
        devSign: (...args) => devSignWorkplaceEvaluation(...args),
        i18nPrefix: "workplaceEvaluation",
        subtitleKey: "workplaceEvaluation.subtitle",
        statusPage: "teacherEvaluations",
        actionsKey: "teacher",
        get basePath() { return PATHS.TEACHER_EVALUATIONS; },
        get filePath() { return PATHS.TEACHER_EVALUATION; },
    },
    MANAGER: {
        can: {fill: false, sign: false, openFile: true},
        fetchList: (...args) => fetchWorkplaceEvaluationsManager(...args),
        fetchFile: (...args) => getWorkplaceEvaluationFileManager(...args),
        save: null,
        sign: null,
        devSign: null,
        i18nPrefix: "workplaceEvaluation",
        subtitleKey: "workplaceEvaluation.subtitlemanager",
        statusPage: "managerEvaluations",
        actionsKey: null,
        get basePath() { return PATHS.MANAGER_EVALUATIONS; },
        get filePath() { return PATHS.MANAGER_EVALUATION; },
    },
};

export const getEvaluationRole = (user) => {
    const role = String(user?.role ?? "").replace("ROLE_", "");
    return EVALUATION_ROLES[role] ?? EVALUATION_ROLES.MANAGER;
};

export const EVALUATION_COLORS = [ALL, COLOR.YELLOW, COLOR.GREEN];

export const evaluationColor = (item) => item?.signedAt ? COLOR.GREEN : COLOR.YELLOW;

export const isEvaluationComplete = (form) =>
    Object.keys(validateEvaluation(createInitialEvaluation(form), {requireComplete: true})).length === 0;

const byNewest = (a, b) =>
    new Date(b?.updatedAt ?? b?.createdAt ?? 0) - new Date(a?.updatedAt ?? a?.createdAt ?? 0);

export const sortEvaluations = (list) =>
    [...(list ?? [])].sort((a, b) =>
        Number(Boolean(a.signedAt)) - Number(Boolean(b.signedAt)) || byNewest(a, b));
