import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import fetcher from '../../../utils/fetcher';

const LogIn = ({ user, setError }) => {
    const navigate = useNavigate();
    const [role, setRole] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [warnings, setWarnings] = useState({
        email: '',
        password: ''
    });

    const validateEmail = () => {
        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
        return emailRegex.test(email);
    };

    const validatePassword = () => true;

    const validateUser = () => {
        let isValid = true;
        const updatedWarnings = { ...warnings };

        if (!validateEmail()) {
            updatedWarnings.email = 'courriel invalide';
            isValid = false;
        } else {
            updatedWarnings.email = '';
        }

        if (!validatePassword()) {
            updatedWarnings.password = 'mot de passe invalide';
            isValid = false;
        } else {
            updatedWarnings.password = '';
        }

        setWarnings(updatedWarnings);
        return isValid;
    };

    const fetchFunc = async () => {
        try {
            const response = await fetcher('/user/login', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json;charset=UTF-8',
                },
                body: JSON.stringify({
                    email: email.toLowerCase(),
                    password
                }),
            });
            if (!response.ok) {
                switch (response.status) {
                    case 401:
                        throw new Error('Not authorized');
                    case 404:
                        throw new Error('No server available');
                    default:
                        throw new Error('Not ok');
                }
            }
            const data = await response.json();
            localStorage.setItem('token', data.accessToken);

            const userResponse = await fetcher('user/me', {});
            if (!userResponse.ok) {
                throw new Error('Failed to fetch user info');
            }
            const userData = await userResponse.json();

            const userRole = userData.role;
            if (userRole === 'ROLE_EMPRUNTEUR') {
                navigate('/emprunteur');
            } else if (userRole === 'ROLE_PREPOSE') {
                navigate('/prepose');
            } else if (userRole === 'ROLE_GESTIONNAIRE') {
                navigate('/gestionnaire');
            } else {
                navigate('/');
            }
        } catch (error) {
            setError(error);
            navigate('/error');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateUser()) {
            fetchFunc();
        }
    };

    if (user?.isLoggedIn) {
        if (user.role === 'ROLE_EMPRUNTEUR') navigate('/emprunteur');
        else if (user.role === 'ROLE_PREPOSE') navigate('/prepose');
        else if (user.role === 'ROLE_GESTIONNAIRE') navigate('/gestionnaire');
        else navigate('/');
    }

    return (
        <div>
            <h2>Sign In</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="role">Role</label>
                    <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
                        <option value="">-- Select a role --</option>
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="manager">Manager</option>
                    </select>
                    {/*<label htmlFor="email">Select your account</label>*/}
                    {/*<select id="email" value={email} onChange={(e) => setEmail(e.target.value)} required>*/}
                    {/*    <option value="">-- Choose a user --</option>*/}
                    {/*</select>*/}
                </div>

                <div>
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setWarnings({ ...warnings, email: '' });
                            setEmail(e.target.value.trim());
                        }}
                        required
                    />
                    <div className="text-danger">{warnings.email}</div>
                </div>

                <div>
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => {
                            setWarnings({ ...warnings, password: '' });
                            setPassword(e.target.value.trim());
                        }}
                        required
                    />
                    <div className="text-danger">{warnings.password}</div>
                </div>

                <button type="submit" disabled={!email || !password}>Sign in</button>
            </form>
            <p>
                No account yet?{' '}
                <button onClick={() => navigate('/signup')}>Sign up</button>
            </p>
        </div>
    );
};

export default LogIn;