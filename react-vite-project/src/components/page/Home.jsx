import StudentHome from "./StudentHome.jsx";
import TeacherHome from "./TeacherHome.jsx";
import EmployerHome from "./EmployerHome.jsx";
import ManagerHome from "./ManagerHome.jsx";

const Home = ({user}) => {
    const homeByRole = () => {
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
                return <p>Role not recognized: {user?.role}</p>;
        }
    }

    return (
        <div className="flex-1 p-6">
            <h1 className="text-2xl font-bold mb-4">
                Welcome {user?.firstName || ''}
            </h1>
            {homeByRole()}
        </div>
    );
};

export default Home;