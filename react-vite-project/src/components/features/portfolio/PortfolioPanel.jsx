


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
