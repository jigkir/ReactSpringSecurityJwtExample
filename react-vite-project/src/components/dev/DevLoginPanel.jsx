/**
 * DevLoginPanel.jsx — Dev Mode block on the login page: pick a mock user to log in instantly.
 * Location: src/components/dev/DevLoginPanel.jsx
 *
 * Users are grouped (<optgroup>) by role + discipline, e.g. "STUDENT · Marketing".
 * Groups follow the backend Role order, then discipline name; users inside a group
 * are sorted by last name, then first name. Managers have no discipline: their group is just "MANAGER".
 * Calls onSelect(user), or onSelect(null) when the selection is cleared.
 * Mounted by Login.jsx only while Dev Mode is on.
 */

import {useCallback, useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import Button from '../../styles/Button.jsx';
import Icon from '../../styles/Icon.jsx';
import {getDevClasses} from '../../styles/AppStyles.jsx';
import {getDevUsers} from '../api/DevApi.jsx';

// Same order as the Role enum on the backend
const ROLE_ORDER = ["MANAGER", "STUDENT", "TEACHER", "EMPLOYER"];

const roleRank = (role) => {
    const i = ROLE_ORDER.indexOf(role);
    return i === -1 ? ROLE_ORDER.length : i;
};

// Sort by last name, then first name
const compareNames = (a, b) =>
    (a.lastName ?? "").localeCompare(b.lastName ?? "") ||
    (a.firstName ?? "").localeCompare(b.firstName ?? "");

export default function DevLoginPanel({dark, fieldClass, labelClass, errorClass, onSelect}) {
    const {t} = useTranslation();
    const s = getDevClasses(dark);
    const [users, setUsers] = useState(null); // null = loading
    const [loadFailed, setLoadFailed] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState("");

    // [{key, label, users}] — one group per role + discipline
    const groups = useMemo(() => {
        if (!users) return null;

        const byKey = new Map();
        for (const u of users) {
            const key = `${u.role}|${u.discipline ?? ""}`;
            if (!byKey.has(key)) {
                const discipline = u.discipline
                    ? t(`disciplines.${u.discipline.toLowerCase()}`, {defaultValue: u.discipline})
                    : null;
                byKey.set(key, {
                    key,
                    role: u.role,
                    discipline: discipline ?? "",
                    label: [u.role, discipline].filter(Boolean).join(" · "),
                    users: [],
                });
            }
            byKey.get(key).users.push(u);
        }

        return [...byKey.values()]
            .sort((a, b) => roleRank(a.role) - roleRank(b.role) || a.discipline.localeCompare(b.discipline))
            .map((g) => ({...g, users: [...g.users].sort(compareNames)}));
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
                        <optgroup key={g.key} label={g.label}>
                            {g.users.map((u) => (
                                <option key={u.id ?? u.email} value={u.email}>
                                    {u.firstName} {u.lastName}
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