/**
 * PreviewState.jsx — Same loading / error / empty states for every Home preview.
 * Location: src/components/home/PreviewState.jsx
 *
 * Priority: error > loading > empty > children.
 * Children are wrapped in a vertical stack so every preview spaces its items the same way.
 *
 * Props
 *   dark       boolean
 *   loading    boolean   data not loaded yet
 *   error      boolean   loading failed
 *   empty      boolean   nothing to show
 *   className  string    optional override of the stack spacing
 */

import {useTranslation} from 'react-i18next';
import {getPostInternshipClasses} from '../../styles/AppStyles.jsx';

const PreviewState = ({dark, loading = false, error = false, empty = false, className = "space-y-4", children}) => {
    const {t} = useTranslation();
    const s = getPostInternshipClasses(dark);

    if (error) return <p className={s.errorText} role="alert">{t("home.preview.loadError")}</p>;
    if (loading) return <p className={s.loadingText} aria-busy="true">{t("home.preview.loading")}</p>;
    if (empty) return <p className={s.emptyText}>{t("home.preview.empty")}</p>;

    return <div className={className}>{children}</div>;
};

export default PreviewState;