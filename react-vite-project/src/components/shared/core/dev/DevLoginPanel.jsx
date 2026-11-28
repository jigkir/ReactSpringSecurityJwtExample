


import {useCallback, useEffect, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import Button from "../../../../styles/ui/Button.jsx";
import Icon from "../../../../styles/ui/Icon.jsx";
import {getDevClasses} from "../../../../styles/theme/AppStyles.jsx";
import {getDevUsers} from "../api/DevApi.jsx";


const ROLE_ORDER = ["MANAGER", "STUDENT", "TEACHER", "EMPLOYER"];


const HEADER_WIDTH = 36;

const roleRank = (role) => {
    const i = ROLE_ORDER.indexOf(role);
    return i === -1 ? ROLE_ORDER.length : i;
};


export const roleHeader = (role) => {
    const dashes = "-".repeat(Math.max(3, Math.round((HEADER_WIDTH - role.length) / 2)));
    return `${dashes} ${role} ${dashes}`;
};


const compareNames = (a, b) =>
    (a.lastName ?? "").localeCompare(b.lastName ?? "") ||
    (a.firstName ?? "").localeCompare(b.firstName ?? "");

export default function DevLoginPanel({dark, fieldClass, labelClass, errorClass, onSelect}) {
    const {t} = useTranslation();
    const s = getDevClasses(dark);
    const [users, setUsers] = useState(null);
    const [loadFailed, setLoadFailed] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState("");


    const groups = useMemo(() => {
        if (!users) return null;

        const byRole = new Map();
        for (const u of users) {
            if (!byRole.has(u.role)) byRole.set(u.role, []);
            byRole.get(u.role).push({
                ...u,
                disciplineLabel: u.discipline
                    ? t(`disciplines.${u.discipline.toLowerCase()}`, {defaultValue: u.discipline})
                    : "",
            });
        }

        return [...byRole.entries()]
            .sort(([a], [b]) => roleRank(a) - roleRank(b))
            .map(([role, list]) => ({
                role,
                users: list.sort(
                    (a, b) => a.disciplineLabel.localeCompare(b.disciplineLabel) || compareNames(a, b),
                ),
            }));
    }, [users, t]);

    const load = useCallback(() => {
        setLoadFailed(false);
        getDevUsers().then(setUsers).catch(() => setLoadFailed(true));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleChange = (e) => {
        const email = e.target.value;
        setSelectedEmail(email);
        onSelect(users.find((u) => u.email === email) ?? null);
    };

    let body;
    if (loadFailed) {
        body = (
            <div role="alert">
                <p className={errorClass}>{t("dev.loadError")}</p>
                <Button type="button" tone="neutral" dark={dark} onClick={load} className="mt-2">
                    {t("dev.retryBtn")}
                </Button>
            </div>
        );
    } else if (groups === null) {
        body = <div className={`h-9 w-full rounded-lg animate-pulse ${s.skel}`} aria-busy="true"/>;
    } else if (groups.length === 0) {
        body = <p className={s.muted}>{t("dev.empty")}</p>;
    } else {
        body = (
            <div>
                <label htmlFor="devUser" className={labelClass}>{t("dev.selectLabel")}</label>
                <select id="devUser" value={selectedEmail} className={fieldClass} onChange={handleChange}>
                    <option value="">{t("dev.selectPlaceholder")}</option>
                    {groups.map((g) => (
                        <optgroup key={g.role} label={roleHeader(g.role)} className="text-center">
                            {g.users.map((u) => (
                                <option key={u.id ?? u.email} value={u.email} className="text-left">
                                    {u.disciplineLabel
                                        ? `${u.firstName} ${u.lastName} (${u.disciplineLabel})`
                                        : `${u.firstName} ${u.lastName}`}
                                </option>
                            ))}
                        </optgroup>
                    ))}
                </select>
            </div>
        );
    }

    return (
        <section className={s.panel} aria-label={t("dev.panelTitle")}>
            <h3 className={s.panelTitle}><Icon name="admin_panel_settings" size={18}/>{t("dev.panelTitle")}</h3>
            {body}
        </section>
    );
}
