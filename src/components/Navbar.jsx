import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Calendar, Heart, Shield, MapPin, Menu, X, Clock, LayoutDashboard, Users, UserX } from 'lucide-react';
import LoginModal from './LoginModal';

export default function Navbar() {
  const { user, logout } = useAuth();
  const useNavigateInstance = useNavigate();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleOpenLogin = (e) => {
    if (e) e.preventDefault();
    setIsLoginOpen(true);
  };

  const handleLogout = async (e) => {
    if (e) e.preventDefault();
    try {
      if (logout) {
        await logout();
      }
      useNavigateInstance('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF';

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo / Brand Name */}
          <Link to="/" className="flex items-center gap-2 text-blue-600 font-extrabold text-xl tracking-tight">
            <span className="bg-blue-600 text-white p-1.5 rounded-xl">🐾</span>
            <span>PetCare</span>
            {user?.role && (
              <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ml-1">
                {user.role}
              </span>
            )}
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-5">
            {isAdmin ? (
              /* ================= Admin Links ================= */
              <>
                <Link
                  to="/admin/dashboard"
                  className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition flex items-center gap-1.5"
                >
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <Link
                  to="/admin/clinics"
                  className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition flex items-center gap-1.5"
                >
                  <MapPin size={16} /> Manage Clinics
                </Link>
             
              </>
            ) : isStaff ? (
              /* ================= Staff Links ================= */
              <>
                <Link
                  to="/staff/dashboard"
                  className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition flex items-center gap-1.5"
                >
                  <LayoutDashboard size={16} /> Staff Dashboard
                </Link>
                <Link
                  to="/staff/schedule"
                  className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition flex items-center gap-1.5"
                >
                  <Clock size={16} /> Clinic Schedule
                </Link>
                <Link
                  to="/staff/doctors-schedule"
                  className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition flex items-center gap-1.5"
                >
                  <Users size={16} /> ตารางเวรแพทย์
                </Link>
                <Link
                  to="/staff/leaves"
                  className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition flex items-center gap-1.5"
                >
                  <UserX size={16} /> สถิติการลา
                </Link>
                <Link
                  to="/staff/staff-management"
                  className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition flex items-center gap-1.5"
                >
                  <User size={16} /> จัดการบุคลากร
                </Link>
              </>
            ) : (
              /* ================= Customer Links ================= */
              <>
                <Link
                  to="/clinics"
                  className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition flex items-center gap-1.5"
                >
                  <MapPin size={16} /> Find Clinics
                </Link>
                <Link
                  to="/vaccines"
                  className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition flex items-center gap-1.5"
                >
                  <Shield size={16} /> Vaccine Guide
                </Link>
                <Link
                  to="/promotions"
                  className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition"
                >
                  Promotions
                </Link>
                {user && (
                  <>
                    <Link
                      to="/my-pets"
                      className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition flex items-center gap-1.5"
                    >
                      <Heart size={16} /> My Pets
                    </Link>
                    <Link
                      to="/my-bookings"
                      className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition flex items-center gap-1.5"
                    >
                      <Calendar size={16} /> My Bookings
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>

          {/* Auth Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <User size={14} /> {user.email}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 p-2 rounded-xl transition text-xs font-bold flex items-center gap-1 border border-slate-200"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleOpenLogin}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-md shadow-blue-200"
              >
                Sign In / Register
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="md:hidden text-slate-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-3">
            {isAdmin ? (
              <>
                <Link to="/admin/dashboard" className="block text-sm font-semibold text-slate-700 py-1">Dashboard</Link>
                <Link to="/admin/clinics" className="block text-sm font-semibold text-slate-700 py-1">Manage Clinics</Link>
                <Link to="/admin/staff" className="block text-sm font-semibold text-slate-700 py-1">Manage Staff</Link>
              </>
            ) : isStaff ? (
              <>
                <Link to="/staff/dashboard" className="block text-sm font-semibold text-slate-700 py-1">Staff Dashboard</Link>
                <Link to="/staff/schedule" className="block text-sm font-semibold text-slate-700 py-1">Clinic Schedule</Link>
                <Link to="/staff/doctors-schedule" className="block text-sm font-semibold text-slate-700 py-1">ตารางเวรแพทย์</Link>
                <Link to="/staff/leaves" className="block text-sm font-semibold text-slate-700 py-1">สถิติการลา</Link>
              </>
            ) : (
              <>
                <Link to="/clinics" className="block text-sm font-semibold text-slate-700 py-1">Find Clinics</Link>
                <Link to="/vaccines" className="block text-sm font-semibold text-slate-700 py-1">Vaccine Guide</Link>
                <Link to="/promotions" className="block text-sm font-semibold text-slate-700 py-1">Promotions</Link>
                {user && (
                  <>
                    <Link to="/my-pets" className="block text-sm font-semibold text-slate-700 py-1">My Pets</Link>
                    <Link to="/my-bookings" className="block text-sm font-semibold text-slate-700 py-1">My Bookings</Link>
                  </>
                )}
              </>
            )}

            <div className="pt-3 border-t border-slate-100">
              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full bg-red-50 text-red-600 font-bold text-xs py-2.5 rounded-xl"
                >
                  Logout ({user.email})
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    setIsMobileMenuOpen(false);
                    handleOpenLogin(e);
                  }}
                  className="w-full bg-blue-600 text-white font-bold text-xs py-2.5 rounded-xl"
                >
                  Sign In / Register
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  );
}