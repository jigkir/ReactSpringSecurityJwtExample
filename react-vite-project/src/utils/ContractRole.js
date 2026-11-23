export const CONTRACT_ROLES = {
    MANAGER: {signedAtField: "managerSignedAt", basePath: "/manager/contracts", signsLast: true},
    EMPLOYER: {signedAtField: "employerSignedAt", basePath: "/employer/contracts"},
    STUDENT: {signedAtField: "studentSignedAt", basePath: "/student/contracts"},
};

export const getContractRole = (user) => {
    const role = (user?.role ?? "").toString().replace("ROLE_", "");
    return CONTRACT_ROLES[role] ?? CONTRACT_ROLES.MANAGER;
};

export const canSign = (contract, contractRole) =>
    !contractRole.signsLast || Boolean(contract.studentSignedAt && contract.employerSignedAt);