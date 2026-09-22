import StudentHome from "./StudentHome.jsx";
import TeacherHome from "./TeacherHome.jsx";
import EmployerHome from "./EmployerHome.jsx";
import ManagerHome from "./ManagerHome.jsx";

const Home = ({user}) => {
    switch (user?.role) {
        case 'STUDENT':
            return <StudentHome user={user}/>;

        case 'TEACHER':
            return <TeacherHome user={user}/>;

        case 'EMPLOYER':
            return <EmployerHome user={user}/>;

        case 'MANAGER':
            return <ManagerHome user={user}/>;

        default:
            return null;
    }
};

export default Home;