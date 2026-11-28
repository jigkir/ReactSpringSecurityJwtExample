import {useOutletContext} from "react-router-dom";
import UserList from "../../features/users/UserList.jsx";

export default function Users({user}) {
    const {dark} = useOutletContext();
    return <UserList dark={dark} user={user}/>;
}
