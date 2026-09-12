import { useState } from 'react';
import LogIn from './LogIn';
import SingUp from './SingUp';

const ConnectionPage = ({ user, setUser, setError }) => {
    const [view, setView] = useState('login');

    return (
        <div>
            {view === 'login' ? (
                <LogIn
                    onShowRegister={() => setView('register')}
                    user={user}
                    setError={setError}
                />
            ) : (
                <SingUp onShowLogin={() => setView('login')} />
            )}
        </div>
    );
};

export default ConnectionPage;