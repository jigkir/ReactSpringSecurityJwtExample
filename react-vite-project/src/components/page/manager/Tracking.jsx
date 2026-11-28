import {useOutletContext} from "react-router-dom";
import TrackingList from "../../tracking/TrackingList.jsx";

export default function Tracking() {
    const {dark} = useOutletContext();
    return <TrackingList dark={dark}/>;
}
