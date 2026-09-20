import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, ShieldCheck, Calendar, Heart, Search, Phone, ArrowRight, Star } from 'lucide-react';
import ClinicMap from '../components/ClinicMap';
import { fetchClinics } from '../services/api';

export default function Home() {
  const navigate = useNavigate();
  const [clinics, setClinics] = useState([]);

  useEffect(() => {
    // ดึงข้อมูลคลินิกมาแสดงบนแผนที่และการ์ดคลินิกแนะนำ
    fetchClinics()
      .then((res) => setClinics(res.data))
      .catch((err) => console.error("Failed to load clinics", err));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-12">
      {/* Hero Section รวมกับ Map ในแถบสีฟ้า */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* ข้อความฝั่งซ้าย */}
        <div className="lg:col-span-5 space-y-5">
          <span className="bg-blue-500/30 border border-white/20 text-xs font-semibold px-3 py-1 rounded-full text-blue-100">
            📍 Interactive Clinic Finder
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
            Find Trusted Pet Clinics & Manage Vaccination
          </h1>
          <p className="text-blue-100 text-sm leading-relaxed">
            Search nearby clinics, check vaccine availability, and book appointments seamlessly for your pets.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/clinics"
              className="bg-white text-blue-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition shadow-md flex items-center gap-2"
            >
              <Search size={16} /> Explore All Clinics
            </Link>
            <Link
              to="/my-pets"
              className="bg-blue-500/30 border border-white/30 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-500/50 transition"
            >
              Manage Pets
            </Link>
          </div>
        </div>

        {/* แผนที่ฝั่งขวาบนแถบสีฟ้า */}
        <div className="lg:col-span-7 h-[320px] rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl relative bg-slate-100 text-slate-800 z-0">
          <ClinicMap
            clinics={clinics}
            onSelectClinic={(id) => navigate(`/clinic/${id}`)}
          />
        </div>

      </div>

      {/* Quick Access Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { title: "Clinic Finder", desc: "Locate verified clinics near you", icon: MapPin, link: "/clinics" },
          { title: "Vaccine Guide", desc: "Check core vaccine schedules", icon: ShieldCheck, link: "/vaccines" },
          { title: "Easy Booking", desc: "Schedule appointments instantly", icon: Calendar, link: "/clinics" },
          { title: "Pet Profiles", desc: "Track health & vaccine records", icon: Heart, link: "/my-pets" },
        ].map((item, idx) => (
          <Link
            key={idx}
            to={item.link}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition group"
          >
            <item.icon className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-slate-800 text-lg">{item.title}</h3>
            <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>

      {/* 🏥 Nearby Featured Clinics (ส่วนที่เพิ่มเข้ามา) */}
      <div className="space-y-6 pt-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800">Nearby Featured Clinics</h2>
            <p className="text-xs text-slate-500 mt-1">Top-rated veterinary clinics available for instant booking</p>
          </div>
          <Link to="/clinics" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View All Clinics <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {clinics.slice(0, 3).map((clinic) => (
            <div
              key={clinic.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition duration-200 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {clinic.area}
                  </span>
                  <div className="flex items-center text-amber-500 text-xs font-bold gap-1">
                    <Star size={14} className="fill-amber-400" /> 4.9
                  </div>
                </div>

                <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition">
                  {clinic.name}
                </h3>

                <p className="text-xs text-slate-500 flex items-start gap-1.5 line-clamp-2">
                  <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                  {clinic.address}
                </p>

                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Phone size={14} className="text-slate-400 shrink-0" />
                  {clinic.phone}
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => navigate(`/clinic/${clinic.id}`)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition"
                >
                  Details
                </button>
                <button
                  onClick={() => navigate(`/book/${clinic.id}`)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-sm shadow-blue-200"
                >
                  Book Vaccine
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}