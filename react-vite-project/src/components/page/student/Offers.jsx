import {useOutletContext} from "react-router-dom";
import OfferList from "../../features/offers/OfferList.jsx";

export default function Offers() {
    const {dark, user} = useOutletContext();
    return <OfferList dark={dark} user={user}/>;
}
