import {useOutletContext} from "react-router-dom";
import ApplicationList from "../../features/applications/ApplicationList.jsx";

export default function Applications({user}) {
    const {dark} = useOutletContext();
    return <ApplicationList dark={dark} user={user}/>;
}
