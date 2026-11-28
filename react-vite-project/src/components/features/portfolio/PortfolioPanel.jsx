/**
 * PortfolioPanel.jsx — The portfolio view (tabs + document lists + upload panel) without the
 * page title, so it can be embedded (e.g. inside an internship card when applying).
 * Tabs: All | CV | Cover letters | Transcripts, all rendered by <DocumentList />.
 * The upload panel preselects the type of the tab being viewed.
 *
 * Props
 *   dark         boolean
 *   selection    optional {cvId, letterId, onPickCv(id), onPickLetter(id), disabled}
 *                → "pick" mode: checkboxes on CVs (approved only, no status) and cover letters,
 *                  no Change type / Delete buttons
 *   uploadTypes  string[]  optional, document types the upload panel offers (default: all)
 *   onUploaded   function  optional, called after an upload attempt
 */

import PortfolioContent from "./PortfolioContent.jsx";

function PortfolioPanel({dark, selection = null, uploadTypes, onUploaded}) {
    return (
        <PortfolioContent
            dark={dark}
            selection={selection}
            uploadTypes={uploadTypes}
            onUploaded={onUploaded}
        />
    );
}

export default PortfolioPanel;