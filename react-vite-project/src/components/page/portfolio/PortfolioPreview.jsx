/**
 * PortfolioPreview.jsx — Student block of the Home page: the latest CVs with their inline PDF preview.
 * No upload panel, no tabs.
 */

import {useOutletContext} from 'react-router-dom';
import DocumentList from './DocumentList.jsx';

export default function PortfolioPreview() {
    const {dark} = useOutletContext();
    return <DocumentList type="CV" dark={dark} preview/>;
}
