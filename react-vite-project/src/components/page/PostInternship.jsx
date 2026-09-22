import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import InternshipModal from "../InternshipModal.jsx";
import InternshipCard from "../InternshipCard.jsx";
import fetcher from "../../utils/fetcher.js";
import { getPostInternshipClasses } from "../../styles/appStyles.jsx";

function PostInternship({ user }) {
    const { dark } = useOutletContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [internships, setInternships] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const s = getPostInternshipClasses(dark);

    useEffect(() => {
        fetcher("internship/made", {})
            .then(async (res) => {
                if (!res.ok) throw new Error(`Error ${res.status}`);
                const data = await res.json();
                const list = Array.isArray(data) ? data : (data.internships ?? []);
                setInternships(list);
            })
            .catch(() => setError("Could not load your internships."))
            .finally(() => setLoading(false));
    }, []);

    const handleAddInternship = async (newOffer) => {
        try {
            const response = await fetcher("internship/make", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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

    const handleDelete = async (id) => {
        try {
            const response = await fetcher(`internship/delete?id=${id}`, { method: "PUT" });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to delete internship");
            }
            const updatedInternship = await response.json();
            setInternships((prev) =>
                prev.map((i) => (i.id === id ? { ...updatedInternship, isDeleted: true } : i))
            );
        } catch (err) {
            console.error(err);
            alert(err.message || "Could not delete internship.");
        }
    };

    return (
        // 1. Outer page locks to the screen height with no page scrolling
        <div className={s.page}>
            {/* Top Header & Button Section */}
            <div className={s.headerSection}>
                <div>
                    <h1 className={s.title}>Manage Postings</h1>
                    <p className={s.subtitle}>Manage and post your internship offers for students.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className={s.addBtn}>
                    Submit an internship offer
                </button>
            </div>

            {/* Internship List Section (Takes up remaining height) */}
            <div className={s.listSection}>
                <h2 className={s.listHeading}>Your Posted Internships</h2>

                {/* 2. Scrollable container for the cards */}
                <div className={s.scrollArea}>
                    {loading && (
                        <p className={s.loadingText}>Loading your internships...</p>
                    )}
                    {error && (
                        <p className={s.errorText}>{error}</p>
                    )}
                    {!loading && !error && internships.filter((i) => !i.isDeleted).length === 0 && (
                        <p className={s.emptyText}>
                            You haven't posted any internships yet.
                        </p>
                    )}
                    {!loading &&
                        !error &&
                        internships.map(
                            (internship) =>
                                !internship.isDeleted && (
                                    <InternshipCard
                                        key={internship.id}
                                        internship={internship}
                                        OnDelete={handleDelete}
                                        dark={dark}
                                    />
                                )
                        )}
                </div>
            </div>

            {/* Modal Component */}
            <InternshipModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAddInternship={handleAddInternship}
                user={user}
                dark={dark}
            />
        </div>
    );
}

export default PostInternship;