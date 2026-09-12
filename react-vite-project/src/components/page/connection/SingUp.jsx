import { useState } from 'react';
import Student from './singup/Student';

const ROLE_COMPONENTS = {
    student: <Student />,
};

const SingUp = ({ onShowLogin }) => {
    const [role, setRole] = useState('student');

    return (
        <div>
            <h2>Sign Up</h2>

            <label htmlFor="role">Role</label>
            <select id="role" name="role" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="manager">Manager</option>
            </select>
            {ROLE_COMPONENTS[role]}

            <p>
                Already have an account?{' '}
                <button onClick={onShowLogin}>Sign in</button>
            </p>
        </div>
    );
};

export default SingUp;