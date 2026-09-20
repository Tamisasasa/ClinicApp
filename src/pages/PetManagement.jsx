import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserPets, addPet } from '../services/api';
import { Plus, Heart, Calendar } from 'lucide-react';

export default function PetManagement() {
  const { user } = useAuth();
  const [pets, setPets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', species: 'Dog', breed: '', age_months: '' });

  useEffect(() => {
    if (user) loadPets();
  }, [user]);

  const loadPets = async () => {
    const res = await fetchUserPets(user.id);
    setPets(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addPet({ ...form, owner_id: user.id });
    setShowModal(false);
    loadPets();
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">My Pets Record</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={16}/> Add New Pet
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pets.map((p) => (
          <div key={p.id} className="bg-white p-5 rounded-2xl border shadow-sm space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg text-blue-900">{p.name}</h3>
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">{p.species}</span>
            </div>
            <p className="text-sm text-gray-600">Breed: {p.breed || 'N/A'}</p>
            <p className="text-sm text-gray-600">Age: {p.age_months} Months</p>
          </div>
        ))}
      </div>

      {/* Add Pet Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl max-w-md w-full space-y-4">
            <h2 className="text-lg font-bold">Add New Pet Profile</h2>
            <input 
              required placeholder="Pet Name" 
              className="w-full border p-2 rounded-lg text-sm"
              value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} 
            />
            <select 
              className="w-full border p-2 rounded-lg text-sm"
              value={form.species} onChange={(e) => setForm({...form, species: e.target.value})}
            >
              <option value="Dog">Dog</option>
              <option value="Cat">Cat</option>
            </select>
            <input 
              placeholder="Breed" 
              className="w-full border p-2 rounded-lg text-sm"
              value={form.breed} onChange={(e) => setForm({...form, breed: e.target.value})} 
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Save Pet</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}