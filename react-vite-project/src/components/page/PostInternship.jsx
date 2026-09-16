import React from "react";
import { useState } from "react";
import InternshipModal from "../InternshipModal.jsx";
import InternshipCard from "../InternshipCard.jsx";

const mockInternships = [
    {
        title: "Frontend Developer Intern",
        description: "Help build and optimize our core student-facing React web applications.",
        requiredSkills: "React, JavaScript, Tailwind CSS",
        duration: "4 months",
        location: "Montreal (Hybrid)",
        startDate: "2027-05-01",
        deadline: "2027-04-01",
        compensation: "$22/hour",
        status: "Pending Validation"
    },
    {
        title: "Backend Java Intern",
        description: "Develop REST APIs and secure endpoints using Spring Boot and Java.",
        requiredSkills: "Java, Spring Boot, SQL",
        duration: "3 months",
        location: "Remote",
        startDate: "2027-06-01",
        deadline: "2027-05-15",
        compensation: "$25/hour",
        status: "Approved"
    },
    {
        title: "AI Chatbot Developer Intern",
        description: "Build conversational agents using Python, LangChain, and local LLMs.",
        requiredSkills: "Python, LangChain, Ollama",
        duration: "2 months",
        location: "Montreal (On-site)",
        startDate: "2027-05-15",
        deadline: "2027-04-30",
        compensation: "$20/hour",
        status: "Pending Validation"
    },
    {
        title: "Full Stack Software Intern",
        description: "Work across the entire stack building robust database solutions and user interfaces.",
        requiredSkills: "Python, React, PostgreSQL",
        duration: "4 months",
        location: "Montreal (Hybrid)",
        startDate: "2027-09-01",
        deadline: "2027-07-30",
        compensation: "$24/hour",
        status: "Approved"
    },
    {
        title: "Database Administration Intern",
        description: "Manage database schemas, query optimization, and data security in MariaDB and Oracle.",
        requiredSkills: "SQL, MariaDB, Oracle",
        duration: "3 months",
        location: "Remote",
        startDate: "2027-06-01",
        deadline: "2027-05-01",
        compensation: "$21/hour",
        status: "Pending Validation"
    },
    {
        title: "Database Administration Intern",
        description: "Manage database schemas, query optimization, and data security in MariaDB and Oracle.",
        requiredSkills: "SQL, MariaDB, Oracle",
        duration: "3 months",
        location: "Remote",
        startDate: "2027-06-01",
        deadline: "2027-05-01",
        compensation: "$21/hour",
        status: "Approved"
    },
    {
        title: "Database Administration Intern",
        description: "Manage database schemas, query optimization, and data security in MariaDB and Oracle.",
        requiredSkills: "SQL, MariaDB, Oracle",
        duration: "3 months",
        location: "Remote",
        startDate: "2027-06-01",
        deadline: "2027-05-01",
        compensation: "$21/hour",
        status: "Pending Validation"
    },
    {
        title: "Database Administration Intern",
        description: "Manage database schemas, query optimization, and data security in MariaDB and Oracle.",
        requiredSkills: "SQL, MariaDB, Oracle",
        duration: "3 months",
        location: "Remote",
        startDate: "2027-06-01",
        deadline: "2027-05-01",
        compensation: "$21/hour",
        status: "Approved"
    },
    {
        title: "Database Administration Intern",
        description: "Manage database schemas, query optimization, and data security in MariaDB and Oracle.",
        requiredSkills: "SQL, MariaDB, Oracle",
        duration: "3 months",
        location: "Remote",
        startDate: "2027-06-01",
        deadline: "2027-05-01",
        compensation: "$21/hour",
        status: "Pending Validation"
    },
    {
        title: "Database Administration Intern",
        description: "Manage database schemas, query optimization, and data security in MariaDB and Oracle.",
        requiredSkills: "SQL, MariaDB, Oracle",
        duration: "3 months",
        location: "Remote",
        startDate: "2027-06-01",
        deadline: "2027-05-01",
        compensation: "$21/hour",
        status: "Denied"
    }
];

function PostInternship() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [internships, setInternships] = useState(mockInternships);

    const handleAddInternship = (newOffer) => {
        setInternships((prev) => [newOffer, ...prev]);
    };

    return (
        // 1. Outer page locks to the screen height with no page scrolling
        <div className="h-screen bg-gray-50 p-6 md:p-10 flex flex-col overflow-hidden">

            {/* Top Header & Button Section */}
            <div className="max-w-5xl w-full mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-200 pb-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Manage Postings</h1>
                    <p className="text-gray-600 mt-1">Manage and post your internship offers for students.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0"
                >
                    Submit an internship offer
                </button>
            </div>

            {/* Internship List Section (Takes up remaining height) */}
            <div className="max-w-5xl w-full mx-auto flex-1 flex flex-col min-h-0">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 shrink-0">Your Posted Internships</h2>

                {/* 2. Scrollable container for the cards */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 min-h-0">
                    {mockInternships.map((internship) => (
                        <InternshipCard key={internship.id} internship={internship}/>
                    ))}
                </div>
            </div>

            {/* Modal Component */}
            <InternshipModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    console.log("hi");
                }}
                onAddInternship={handleAddInternship}
            />

        </div>
    );
}

export default PostInternship;