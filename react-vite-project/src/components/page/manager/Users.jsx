import {useOutletContext} from "react-router-dom";
import UserList from "../../users/UserList.jsx";

export default function Users({user}) {
    const {dark} = useOutletContext();
    return <UserList dark={dark} user={user}/>;
}
