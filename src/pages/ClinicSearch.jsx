import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClinicMap from '../components/ClinicMap';
import { fetchClinics } from '../services/api';
import { Search, Filter, Phone } from 'lucide-react';

export default function ClinicSearch() {
  const [clinics, setClinics] = useState([]);
  const [area, setArea] = useState('');
  const [service, setService] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadClinics();
  }, [area, service]);

  const loadClinics = async () => {
    try {
      const res = await fetchClinics({ area, service });
      setClinics(res.data);
    } catch (err) {
      console.error("Failed to load clinics", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar Filter & List */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border space-y-3">
          <h2 className="font-bold text-lg flex items-center gap-2"><Filter size={18}/> Filters</h2>
          <div>
            <label className="text-sm text-gray-600">Area / Location</label>
            <select 
              className="w-full mt-1 border p-2 rounded-lg text-sm"
              value={area} 
              onChange={(e) => setArea(e.target.value)}
            >
              <option value="">All Areas</option>
              <option value="Sukhumvit">Sukhumvit</option>
              <option value="Ari">Ari</option>
              <option value="Ladprao">Ladprao</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Service Category</label>
            <select 
              className="w-full mt-1 border p-2 rounded-lg text-sm"
              value={service} 
              onChange={(e) => setService(e.target.value)}
            >
              <option value="">All Services</option>
              <option value="Vaccination">Vaccination</option>
              <option value="Surgery">Surgery</option>
            </select>
          </div>
        </div>

        {/* Clinic List Cards */}
        <div className="space-y-3 overflow-y-auto max-h-[500px]">
          {clinics.map((c) => (
            <div key={c.id} className="bg-white p-4 rounded-xl border hover:shadow-md transition">
              <h3 className="font-bold text-blue-900">{c.name}</h3>
              <p className="text-xs text-gray-500">{c.address}</p>
              <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                <Phone size={12}/> {c.phone}
              </div>
              <button
                onClick={() => navigate(`/clinic/${c.id}`)}
                className="mt-3 w-full bg-blue-50 text-blue-600 font-semibold text-xs py-2 rounded-lg hover:bg-blue-100"
              >
                View Clinic & Book
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Map Display */}
      <div className="lg:col-span-2">
        <ClinicMap clinics={clinics} onSelectClinic={(id) => navigate(`/clinic/${id}`)} />
      </div>
    </div>
  );
}