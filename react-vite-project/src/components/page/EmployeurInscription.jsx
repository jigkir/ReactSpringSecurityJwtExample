import React, { useState } from "react";
import {useNavigate} from "react-router-dom";

function EmployeurInscription() {

    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const[formData, setformData] = useState({
        nomEntreprise:"",
        nomContact:"",
        email:"",
        telephone:"",
        motDePasse:"",
        confirmerMotDePasse:""
    })
    
    const handlechange = (e) => {
      const {name,value} = e.target

      setformData((prev) => ({
          ...prev,
          [name]: value,
      }));
    }
    
    const handleSubmit = async (e) => {
      e.preventDefault();
      if(formData.motDePasse !== formData.confirmerMotDePasse){
          setError("Le mot de passe ne correspondent pas");
          return;
      }
      setError("");
      setLoading(true);

      setTimeout(() => {
          console.log(formData);
          setLoading(false);
          navigate("/login");
      },1000)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">
                    Inscription Employeur
                </h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="nomEntreprise" className="block text-sm font-medium text-gray-700 mb-1">
                            Nom de l'entreprise
                        </label>
                        <input
                            type="text"
                            id="nomEntreprise"
                            name="nomEntreprise"
                            value={formData.nomEntreprise}
                            onChange={handlechange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label htmlFor="nomContact" className="block text-sm font-medium text-gray-700 mb-1">
                            Nom du contact
                        </label>
                        <input
                            type="text"
                            id="nomContact"
                            name="nomContact"
                            value={formData.nomContact}
                            onChange={handlechange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Courriel
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handlechange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-1">
                            Téléphone
                        </label>
                        <input
                            type="tel"
                            id="telephone"
                            name="telephone"
                            value={formData.telephone}
                            onChange={handlechange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label htmlFor="motDePasse" className="block text-sm font-medium text-gray-700 mb-1">
                            Mot de passe
                        </label>
                        <input
                            type="password"
                            id="motDePasse"
                            name="motDePasse"
                            value={formData.motDePasse}
                            onChange={handlechange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {error && (
                            <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
                                {error}
                            </div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="confirmerMotDePasse" className="block text-sm font-medium text-gray-700 mb-1">
                            Confirmer le mot de passe
                        </label>
                        <input
                            type="password"
                            id="confirmerMotDePasse"
                            name="confirmerMotDePasse"
                            value={formData.confirmerMotDePasse}
                            onChange={handlechange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {error && (
                            <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
                                {error}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors duration-200"
                    >
                        {loading ? "Inscription en cours..." : "S'inscrire"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default EmployeurInscription;
