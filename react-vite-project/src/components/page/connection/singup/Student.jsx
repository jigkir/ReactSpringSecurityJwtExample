import { useState } from 'react';

const SCHOOL_DOMAIN = 'claurendeau.qc.ca';

const DEFAULT_FORM = {
    firstName: '',
    lastName: '',
    mat: '',
    personalEmail: '',
    schoolEmail: '',
    dept: '',
};

const Student = () => {
    const [form, setForm] = useState(DEFAULT_FORM);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm(prev => {
            const updated = { ...prev, [name]: value };

            if (name === 'mat') {
                updated.schoolEmail = value ? `${value}@${SCHOOL_DOMAIN}` : '';
            }

            return updated;
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Register student:', form);
    };

    return (
        <form onSubmit={handleSubmit}>
            <label htmlFor="firstName">First Name</label>
            <input id="firstName" name="firstName" type="text" value={form.firstName} onChange={handleChange} required />

            <label htmlFor="lastName">Last Name</label>
            <input id="lastName" name="lastName" type="text" value={form.lastName} onChange={handleChange} required />

            <label htmlFor="mat">Student ID (Mat)</label>
            <input id="mat" name="mat" type="text" value={form.mat} onChange={handleChange} required />

            <label htmlFor="personalEmail">Personal Email</label>
            <input id="personalEmail" name="personalEmail" type="email" value={form.personalEmail} onChange={handleChange} required />

            <label htmlFor="schoolEmail">School Email</label>
            <input id="schoolEmail" name="schoolEmail" type="email" value={form.schoolEmail} readOnly />

            <label htmlFor="dept">Department</label>
            <input id="dept" name="dept" type="text" value={form.dept} onChange={handleChange} required />

            <button type="submit">Create account</button>
        </form>
    );
};

export default Student;
