export const INTERNSHIP_ROLES = {
    EMPLOYER: {audience: "employer", canCreate: true, canEdit: true, canDelete: true, canViewApplications: true},
    MANAGER: {audience: "manager", canApprove: true, canReject: true, canEdit: true, canChangeOffers: true},
    STUDENT: {audience: "student", canApply: true, canUpdateCV: true},
};

export const getInternshipRole = (user) => {
    const role = String(user?.role ?? "").replace("ROLE_", "");
    return INTERNSHIP_ROLES[role] ?? INTERNSHIP_ROLES.STUDENT;
};
