import {PATHS} from "../routes/AppRoutes.jsx";

export const CONTRACT_ROLES = {
    MANAGER: {
        signedAtField: "managerSignedAt",
        get basePath() {
            return PATHS.MANAGER_CONTRACTS;
        },
        get filePath() {
            return PATHS.MANAGER_CONTRACT;
        },
        signsLast: true,
    },
    EMPLOYER: {
        signedAtField: "employerSignedAt",
        get basePath() {
            return PATHS.EMPLOYER_CONTRACTS;
        },
        get filePath() {
            return PATHS.EMPLOYER_CONTRACT;
        },
    },
    STUDENT: {
        signedAtField: "studentSignedAt",
        get basePath() {
            return PATHS.STUDENT_CONTRACTS;
        },
        get filePath() {
            return PATHS.STUDENT_CONTRACT;
        },
    },
};

export const getContractRole = (user) => {
    const role = (user?.role ?? "").toString().replace("ROLE_", "");
    return CONTRACT_ROLES[role] ?? CONTRACT_ROLES.MANAGER;
};

export const canSign = (contract, contractRole) =>
    !contractRole.signsLast || Boolean(contract.studentSignedAt && contract.employerSignedAt);