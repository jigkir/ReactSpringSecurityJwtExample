import {useEffect, useState} from "react";
import {useOutletContext} from "react-router-dom";
import fetcher from "../../utils/fetcher.js";
import {getHomeClasses} from "../../styles/appStyles.jsx";

const Home = () => {
    const {dark} = useOutletContext();
    const classes = getHomeClasses(dark);

    const [user, setUser] = useState(null);

    useEffect(() => {
        fetcher('users/current', {})
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(`Erreur API (${response.status})`);
                }

                const data = await response.json();
                setUser(data);
            })
            .catch((error) => {
                console.error(error);
            });
    }, []);

    const homeByRole = () => {
        switch (user?.role) {
            case 'STUDENT':
                return (
                    <div>
                        <h2 className={classes.subhead}>Student</h2>
                    </div>
                );

            case 'TEACHER':
                return (
                    <div>
                        <h2 className={classes.subhead}>Teacher</h2>
                    </div>
                );

            case 'EMPLOYER':
                return (
                    <div>
                        <h2 className={classes.subhead}>Employer</h2>
                    </div>
                );

            case 'MANAGER':
                return (
                    <div>
                        <h2 className={classes.subhead}>Manager</h2>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className={classes.page}>
            <h1 className={classes.heading}>
                Welcome {user?.firstName || ''}
            </h1>

            {homeByRole()}
        </div>
    );
};

export default Home;