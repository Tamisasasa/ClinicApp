import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function LoginModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();
  const { loginWithLocalUser } = useAuth();

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      let loggedInUser = null;
      let userRole = 'STAFF';

      // 1. ค้นหาจากตาราง admins ก่อน
      const { data: admins, error: adminErr } = await supabase
        .from('admins')
        .select('*');

      if (adminErr) {
        console.error('Admin query error:', adminErr);
      } else if (admins) {
        const foundAdmin = admins.find(
          (row) =>
            row.email &&
            row.email.trim().toLowerCase() === cleanEmail &&
            String(row.password).trim() === cleanPassword
        );
        if (foundAdmin) {
          loggedInUser = foundAdmin;
          userRole = 'ADMIN';
        }
      }

      // 2. ถ้าไม่เจอใน admins ให้ค้นหาต่อในตาราง clinics
      if (!loggedInUser) {
        const { data: clinics, error: clinicErr } = await supabase
          .from('clinics')
          .select('*');

        if (clinicErr) {
          console.error('Clinic query error:', clinicErr);
        } else if (clinics) {
          const foundClinic = clinics.find(
            (row) =>
              row.email &&
              row.email.trim().toLowerCase() === cleanEmail &&
              String(row.password).trim() === cleanPassword
          );
          if (foundClinic) {
            loggedInUser = foundClinic;
            userRole = 'STAFF';
          }
        }
      }

      // ถ้ายังไม่เจอในทั้งสองตาราง
      if (!loggedInUser) {
        setErrorMessage('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        setLoading(false);
        return;
      }

      // บันทึก session ผ่าน AuthContext (จะเซฟลง localStorage ให้เองและอัปเดต state ทันที)
      const sessionData = { ...loggedInUser, role: userRole };
      loginWithLocalUser(sessionData);

      if (onClose) onClose();

      // เปลี่ยนเส้นทางหน้าเว็บ
      if (userRole === 'ADMIN') {
        window.location.href = '/admin/dashboard';
      } else {
        window.location.href = '/staff/dashboard';
      }
    } catch (err) {
      console.error('Unexpected Error:', err);
      setErrorMessage(`เกิดข้อผิดพลาด: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white relative">
          <button
            onClick={onClose}
            type="button"
            className="absolute top-4 right-4 text-white/80 hover:text-white text-xl font-bold"
          >
            ✕
          </button>
          <h2 className="text-2xl font-bold">Welcome Back</h2>
          <p className="text-blue-100 text-sm mt-1">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@petcare.com"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-lg transition-colors shadow-md mt-2"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}