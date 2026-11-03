/**
 * SentDocuments.jsx — The documents a student sent with an application (CV, cover letter,
 * transcript), each one previewable inline. Always visible once the student has applied.
 *
 * Props
 *   application  {cv, coverLetter, academicTranscript}  each {id, fileName?}
 *   dark         boolean
 */

import {useTranslation} from 'react-i18next';
import Button from '../../../styles/Button.jsx';
import Icon from '../../../styles/Icon.jsx';
import PdfPreview from '../../documents/PdfPreview.jsx';
import {getDocumentFile} from '../../api/Api.jsx';
import {blobUrlFromFile} from '../../../utils/documents.js';
import {DOC_TYPES} from '../../../utils/DocumentTypes.js';
import {useToggleSet} from '../../../utils/useToggleSet.js';

// One stable function per type, so an open preview is never reloaded by a re-render
const urlGetters = {};
const getUrlFor = (type) =>
    (urlGetters[type] ??= async (id) => blobUrlFromFile(await getDocumentFile(type, id)));

function SentDocuments({application, dark}) {
    const {t} = useTranslation();
    const previews = useToggleSet();

    const docs = [
        {type: "CV", doc: application?.cv},
        {type: "COVER_LETTER", doc: application?.coverLetter},
        {type: "TRANSCRIPT", doc: application?.academicTranscript},
    ].filter(({doc}) => doc?.id != null);

    if (docs.length === 0) return null;

    const muted = dark ? "text-slate-400" : "text-gray-500";

    return (
        <section className="flex w-full flex-col gap-3 text-left" aria-label={t("sentDocuments.title")}>
            <p className={`flex items-center gap-1.5 text-sm font-semibold ${dark ? "text-green-300" : "text-green-700"}`}
               role="status">
                <Icon name="check_circle" size={18}/>
                {t("sentDocuments.title")}
            </p>

            <ul className="flex flex-col gap-3">
                {docs.map(({type, doc}) => {
                    const key = `${type}-${doc.id}`;
                    const isOpen = previews.has(key);
                    const label = t(`portfolio.actions.preview.${type}`);
                    return (
                        <li key={key} className="flex flex-col gap-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <Icon name="picture_as_pdf" size={20}/>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold">{t(DOC_TYPES[type].labelKey)}</p>
                                    {doc.fileName && (
                                        <p className={`truncate text-xs ${muted}`} title={doc.fileName}>
                                            {doc.fileName}
                                        </p>
                                    )}
                                </div>
                                <Button tone="accent" lockTone dark={dark}
                                        icon={isOpen ? "close" : "visibility"}
                                        aria-expanded={isOpen}
                                        aria-label={doc.fileName ? `${label} : ${doc.fileName}` : label}
                                        onClick={() => previews.toggle(key)}>
                                    {isOpen ? t("cvPreview.closeBtn") : label}
                                </Button>
                            </div>
                            {isOpen && <PdfPreview doc={doc} dark={dark} getUrl={getUrlFor(type)}/>}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}

export default SentDocuments;