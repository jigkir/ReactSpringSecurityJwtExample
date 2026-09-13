import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Student from './singup/Student';

const ROLE_COMPONENTS = {
    student: <Student />,
};

const SingUp = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState('student');

    const fieldClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">Sign Up</h1>

                <div className="mb-4">
                    <label htmlFor="role" className={labelClass}>Role</label>
                    <select
                        id="role"
                        name="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className={fieldClass}
                    >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="manager">Manager</option>
                    </select>
                </div>

                {ROLE_COMPONENTS[role]}

                <p className="mt-4 text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <button
                        onClick={() => navigate('/login')}
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Sign in
                    </button>
                </p>
            </div>
        </div>
    );
};

export default SingUp;