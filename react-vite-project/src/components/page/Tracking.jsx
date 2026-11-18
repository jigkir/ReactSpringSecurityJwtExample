import {useCallback, useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {getInternshipTrackings, getAssignableTeachers, assignTeacher} from "../api/Api.jsx";
import {usePolling} from "../../utils/usePolling.js";
import {useOutletContext} from "react-router-dom";
import {getPostInternshipClasses} from "../../styles/AppStyles.jsx";
import UserCard from "./UserCard.jsx";
import Button from "../../styles/Button.jsx";

const sortOffers = (list) => [...list].sort((a, b) => b.id - a.id);

function Tracking() {
    const {t} = useTranslation();
    const {dark} = useOutletContext();
    const s = getPostInternshipClasses(dark);
    const [internships, setInternships] = useState([]);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);

    // Store teachers per trackingId: { [trackingId]: TeacherAssignmentDto[] }
    const [teachersByTracking, setTeachersByTracking] = useState({});
    // Store selected teacherId per trackingId: { [trackingId]: string }
    const [selectedTeachers, setSelectedTeachers] = useState({});
    // Track which trackingId is currently loading teachers
    const [loadingTeachersFor, setLoadingTeachersFor] = useState(null);
    // Track which trackingId is currently submitting an assignment
    const [assigningTrackingId, setAssigningTrackingId] = useState(null);

    const loadInternships = useCallback(async () => {
        try {
            const data = await getInternshipTrackings();
            if (!Array.isArray(data)) throw new Error("Invalid internship response");
            setInternships(data);
            setError(false);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadInternships();
    }, [loadInternships]);

    usePolling(loadInternships);

    const fetchTeachersForTracking = async (trackingId) => {
        if (teachersByTracking[trackingId]) return;

        try {
            setLoadingTeachersFor(trackingId);
            const teachers = await getAssignableTeachers(trackingId);
            setTeachersByTracking((prev) => ({
                ...prev,
                [trackingId]: Array.isArray(teachers) ? teachers : [],
            }));
        } catch (err) {
            console.error(`Failed to load teachers for tracking ${trackingId}:`, err);
        } finally {
            setLoadingTeachersFor(null);
        }
    };

    const handleTeacherChange = (trackingId, teacherId) => {
        setSelectedTeachers((prev) => ({
            ...prev,
            [trackingId]: teacherId,
        }));
    };

    const handleAssign = async (trackingId) => {
        const teacherId = selectedTeachers[trackingId];
        if (!teacherId) return;

        try {
            setAssigningTrackingId(trackingId);
            await assignTeacher(trackingId, teacherId);
            await loadInternships();
        } catch (err) {
            console.error(`Failed to assign teacher ${teacherId} to tracking ${trackingId}:`, err);
        } finally {
            setAssigningTrackingId(null);
        }
    };

    const renderCard = (internship) => {
        const student = internship.student;
        const availableTeachers = teachersByTracking[internship.id];
        const selectedTeacherId = selectedTeachers[internship.id] || "";
        const isLoadingTeachers = loadingTeachersFor === internship.id;
        const isAssigning = assigningTrackingId === internship.id;
        const hasNoTeachers = Array.isArray(availableTeachers) && availableTeachers.length === 0;

        let defaultOptionText = t("tracking.selectDefault");
        if (isLoadingTeachers) {
            defaultOptionText = t("tracking.selectLoading");
        } else if (hasNoTeachers) {
            defaultOptionText = t("tracking.selectNull");
        }

        return (
            <UserCard
                key={internship.id}
                dark={dark}
                studentid={student.studentId}
                firstname={student.firstName}
                lastname={student.lastName}
                status={internship.teacher ? "approved" : "pending"}
                footer={
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        {internship.teacher ? (
                            <span className={`text-sm ${dark ? "text-slate-300" : "text-gray-600"}`}>
                                {internship.teacher.firstName} {internship.teacher.lastName}
                            </span>
                        ) : (
                            <>
                                <select
                                    value={selectedTeacherId}
                                    onFocus={() => fetchTeachersForTracking(internship.id)}
                                    onChange={(e) => handleTeacherChange(internship.id, e.target.value)}
                                    disabled={isAssigning}
                                    className={`px-3 py-1.5 text-sm rounded-lg border ${
                                        dark
                                            ? "bg-slate-700 border-slate-600 text-slate-200"
                                            : "bg-white border-gray-300 text-gray-800"
                                    }`}
                                >
                                    <option value="">{defaultOptionText}</option>
                                    {availableTeachers?.map((teacher) => (
                                        <option key={teacher.id} value={teacher.id}>
                                            {teacher.firstName} {teacher.lastName} ({teacher.numberOfStudentsAssigned})
                                        </option>
                                    ))}
                                </select>

                                <Button
                                    dark={dark}
                                    tone="primary"
                                    disabled={!selectedTeacherId || hasNoTeachers || isAssigning}
                                    onClick={() => handleAssign(internship.id)}
                                >
                                    {isAssigning ? t("tracking.assigneLoading") : t("tracking.assigneDefault")}
                                </Button>
                            </>
                        )}
                    </div>
                }
            />
        );
    };

    let body;
    if (loading) {
        body = <p className={s.loadingText}>{t("tracking.loading")}</p>;
    } else if (error) {
        body = <p className={s.errorText}>{t("tracking.error")}</p>;
    } else if (internships.length === 0) {
        body = <p className={s.errorText}>{t("tracking.empty")}</p>;
    } else {
        body = sortOffers(internships).map(renderCard);
    }

    return (
        <div className={s.page}>
            <div className={s.listSection}>
                <div className={s.scrollArea}>{body}</div>
            </div>
        </div>
    );
}

export default Tracking;