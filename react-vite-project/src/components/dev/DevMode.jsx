/**
 * DevMode.jsx — Dev Mode flag (persisted in localStorage) + the bottom-left toggle.
 * Location: src/components/dev/DevMode.jsx
 *
 * useDevMode() -> {devAvailable, devMode, toggleDevMode}
 * Dev Mode is available only when DEV_MODE_ENABLED (Config.jsx) is true.
 * Otherwise nothing renders and devMode is always false.
 * Without the provider (e.g. in tests) the default context is "off".
 */

import {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import Icon from '../../styles/Icon.jsx';
import {getDevClasses} from '../../styles/AppStyles.jsx';
import {DEV_MODE_ENABLED} from '../config/Config.jsx';

const DEV_AVAILABLE = DEV_MODE_ENABLED;
const STORAGE_KEY = "devMode";

const DevModeContext = createContext({devAvailable: false, devMode: false, toggleDevMode: () => {}});

export const useDevMode = () => useContext(DevModeContext);

export function DevModeProvider({children}) {
    const [devMode, setDevMode] = useState(() => DEV_AVAILABLE && localStorage.getItem(STORAGE_KEY) === "true");

    useEffect(() => {
        if (DEV_AVAILABLE) localStorage.setItem(STORAGE_KEY, devMode);
    }, [devMode]);

    const toggleDevMode = useCallback(() => setDevMode((on) => !on), []);
    const value = useMemo(() => ({devAvailable: DEV_AVAILABLE, devMode, toggleDevMode}), [devMode, toggleDevMode]);

    return <DevModeContext.Provider value={value}>{children}</DevModeContext.Provider>;
}

export function DevModeToggle({dark}) {
    const {t} = useTranslation();
    const {devAvailable, devMode, toggleDevMode} = useDevMode();
    if (!devAvailable) return null;

    return (
        <button type="button" onClick={toggleDevMode} aria-pressed={devMode}
                title={devMode ? t("dev.toggleOff") : t("dev.toggleOn")}
                className={getDevClasses(dark).toggle(devMode)}>
            <Icon name="admin_panel_settings" size={16}/>
            {t("dev.label")}
        </button>
    );
}