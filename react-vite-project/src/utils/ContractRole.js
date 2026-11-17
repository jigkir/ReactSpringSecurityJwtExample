export const CONTRACT_ROLES = {
    MANAGER: {signedAtField: "managerSignedAt", basePath: "/manager/contracts"},
    EMPLOYER: {signedAtField: "employerSignedAt", basePath: "/employer/contracts"},
};

export const getContractRole = (user) => {
    const role = (user?.role ?? "").toString().replace("ROLE_", "");
    return CONTRACT_ROLES[role] ?? CONTRACT_ROLES.MANAGER;
};