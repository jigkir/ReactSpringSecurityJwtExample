import {useOutletContext} from "react-router-dom";

const Home = ({user}) => {
    const {dark} = useOutletContext();

    return (
        <div className={`flex-1 p-6 ${dark ? 'text-white' : 'text-gray-900'}`}>
            <h1 className="text-2xl font-bold mb-4">
                Welcome {user?.firstName || ''}
            </h1>

            {user?.role === 'STUDENT' && (
                <div>
                    <h2 className="text-xl font-semibold mb-2">
                        Student dashboard
                    </h2>

                    <p>
                        Student options will go here.
                    </p>
                </div>
            )}

            {user?.role === 'TEACHER' && (
                <div>
                    <h2 className="text-xl font-semibold mb-2">
                        Teacher dashboard
                    </h2>

                    <p>
                        Teacher options will go here.
                    </p>
                </div>
            )}

            {user?.role === 'EMPLOYER' && (
                <div>
                    <h2 className="text-xl font-semibold mb-2">
                        Employer dashboard
                    </h2>

                    <p>
                        Employer options will go here.
                    </p>
                </div>
            )}

            {user?.role === 'MANAGER' && (
                <div>
                    <h2 className="text-xl font-semibold mb-2">
                        Gestionnaire dashboard
                    </h2>

                    <p>
                        Gestionnaire options will go here.
                    </p>
                </div>
            )}
        </div>
    );
};

export default Home;