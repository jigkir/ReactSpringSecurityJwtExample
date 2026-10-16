/**
 * DevLoginPanel.jsx — Dev Mode block on the login page: pick a mock user to log in instantly.
 * Location: src/components/dev/DevLoginPanel.jsx
 *
 * Calls onSelect(user), or onSelect(null) when the selection is cleared.
 * Mounted by Login.jsx only while Dev Mode is on.
 */

import {useCallback, useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import Button from '../../styles/Button.jsx';
import Icon from '../../styles/Icon.jsx';
import {getDevClasses} from '../../styles/AppStyles.jsx';
import {getDevUsers} from '../api/DevApi.jsx';

// "firstName lastName (ROLE)"
const userLabel = (u) => `${u.firstName} ${u.lastName} (${u.role})`;

export default function DevLoginPanel({dark, fieldClass, labelClass, errorClass, onSelect}) {
    const {t} = useTranslation();
    const s = getDevClasses(dark);
    const [users, setUsers] = useState(null); // null = loading
    const [loadFailed, setLoadFailed] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState("");

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
    } else if (users === null) {
        body = <div className={`h-9 w-full rounded-lg animate-pulse ${s.skel}`} aria-busy="true"/>;
    } else if (users.length === 0) {
        body = <p className={s.muted}>{t("dev.empty")}</p>;
    } else {
        body = (
            <div>
                <label htmlFor="devUser" className={labelClass}>{t("dev.selectLabel")}</label>
                <select id="devUser" value={selectedEmail} className={fieldClass} onChange={handleChange}>
                    <option value="">{t("dev.selectPlaceholder")}</option>
                    {users.map((u) => <option key={u.id ?? u.email} value={u.email}>{userLabel(u)}</option>)}
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