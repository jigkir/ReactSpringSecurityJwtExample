import {useState} from 'react';
import {useNavigate, useOutletContext} from 'react-router-dom';
import Student from './singup/Student.jsx';

const ROLE_COMPONENTS = (classes) => ({
    student: <Student   {...classes} />,
});

const SingUp = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState('student');
    const {dark} = useOutletContext();

    const base = dark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900';
    const fieldClass = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${base}`;
    const labelClass = `block text-sm font-medium mb-1 ${dark ? 'text-slate-300' : 'text-gray-700'}`;
    const errorClass = `mt-1 text-xs ${dark ? 'text-red-400' : 'text-red-600'}`;
    const eyeClass = `shrink-0 p-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        dark ? 'border-slate-600 text-slate-300 hover:bg-slate-600' : 'border-gray-300 text-gray-500 hover:bg-gray-50'
    }`;
    const serverErrorClass = `px-4 py-3 rounded-lg text-sm border ${
        dark ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-300 text-red-700'
    }`;
    const passwordHintClass = `mt-1 text-xs ${dark ? 'text-slate-400' : 'text-gray-500'}`;
    const submitClass = 'w-full mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2';

    const classes = {fieldClass, labelClass, errorClass, eyeClass, serverErrorClass, passwordHintClass, submitClass};

    return (
        <div className={`flex-1 flex items-center justify-center p-4 ${dark ? 'bg-gray-900' : 'bg-gray-100'}`}>
            <div className={`w-full max-w-md p-8 rounded-2xl shadow-lg border ${
                dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
            }`}>
                <h1 className={`text-2xl font-bold text-center mb-6 ${dark ? 'text-white' : 'text-gray-800'}`}>Sign
                    Up</h1>

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
                    </select>
                </div>

                {ROLE_COMPONENTS(classes)[role]}

                <p className={`mt-4 text-center text-sm ${dark ? 'text-slate-400' : 'text-gray-600'}`}>
                    Already have an account?{' '}
                    <button onClick={() => navigate('/login')} className="text-blue-500 hover:underline font-medium">
                        Sign in
                    </button>
                </p>
            </div>
        </div>
    );
};

export default SingUp;