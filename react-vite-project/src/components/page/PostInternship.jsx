import React, {useEffect} from "react";
import { useState } from "react";
import InternshipModal from "../InternshipModal.jsx";
import InternshipCard from "../InternshipCard.jsx";
import fetcher from "../../utils/fetcher.js";

function PostInternship({user}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [internships, setInternships] = useState([]);
    const [error,setError] = useState("")
    const [loading,setLoading] = useState(true)


    useEffect(() => {
        fetcher("internship/made", {})
            .then(async (res) => {
                if (!res.ok) throw new Error(`Error ${res.status}`);
                const data = await res.json();
                const list = Array.isArray(data) ? data : (data.internships ?? []);

                setInternships(list);
            })
            .catch(() => setError('Could not load your internships.'))
            .finally(() => setLoading(false));
    }, []);

    const handleAddInternship = async (newOffer) => {
        try {
            const response = await fetcher("internship/make", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newOffer),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to create internship");
            }

            const savedInternship = await response.json();

            // Prepend the newly created internship (InternshipResponseDto) to the list
            setInternships((prev) => [savedInternship, ...prev]);
            return { success: true };
        } catch (err) {
            console.error(err);
            return { success: false, message: err.message || "Could not save internship offer." };
        }
    };

    const handleDelete = async (id) =>{
        try {
            const response = await fetcher(`internship/delete?id=${id}`, {
                method: "PUT",
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to delete internship");
            }

            const updatedInternship = await response.json();

            setInternships(prevState =>
                prevState.map(internship =>
                    internship.id === id ? { ...updatedInternship, isDeleted: true } : internship
                )
            );
        } catch (err) {
            console.error(err);
            alert(err.message || "Could not delete internship.");
        }
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
                    className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shrink-0"
                >
                    Submit an internship offer
                </button>
            </div>

            {/* Internship List Section (Takes up remaining height) */}
            <div className="max-w-5xl w-full mx-auto flex-1 flex flex-col min-h-0">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 shrink-0">Your Posted Internships</h2>

                {/* 2. Scrollable container for the cards */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 min-h-0">
                    {loading && (
                        <p className="text-gray-500 text-center py-8">Loading your internships...</p>
                    )}

                    {error && (
                        <p className="text-red-500 bg-red-50 p-4 rounded-lg text-center">{error}</p>
                    )}

                    {!loading && !error && internships.filter(i => !i.isDeleted).length === 0 && (
                        <p className="text-gray-500 text-center py-8">You haven't posted any internships yet.</p>
                    )}

                    {!loading && !error && internships.map((internship) => (
                        !internship.isDeleted &&
                        <InternshipCard key={internship.id} internship={internship} OnDelete={handleDelete}/>
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
                user={user}
            />

        </div>
    );
}

export default PostInternship;