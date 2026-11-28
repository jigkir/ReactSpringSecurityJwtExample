import {useOutletContext} from "react-router-dom";
import PortfolioPanel from "../../portfolio/Portfolio.jsx";

export default function Portfolio() {
    const {dark} = useOutletContext();
    return <PortfolioPanel dark={dark}/>;
}
