import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function LoginModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STAFF');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("กำลังกดปุ่มเข้าสู่ระบบ...", email, password);
    setLoading(true);
    setErrorMessage('');
  
    try {
      // 1. ค้นหาคลินิกจากตาราง clinics โดยตรง
      const { data: clinicData, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('email', email.trim())
        .eq('password', password.trim())
        .single();

      console.log("ผลลัพธ์จากฐานข้อมูล:", { clinicData, error });

      if (error || !clinicData) {
        setErrorMessage('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        setLoading(false);
        return;
      }

      // 2. บันทึกข้อมูลลง LocalStorage
      localStorage.setItem('currentClinic', JSON.stringify(clinicData));
      localStorage.setItem('user', JSON.stringify({ ...clinicData, role: 'STAFF' }));
      
      console.log("ล็อกอินสำเร็จ บันทึกข้อมูลลง LocalStorage แล้ว กำลังเปลี่ยนหน้าไป /staff/dashboard");

      if (onClose) onClose();
      
      // 3. บังคับเปลี่ยนเส้นทางหน้าเว็บไปที่หน้า Dashboard ของสตาฟทันที
      window.location.href = '/staff/dashboard';

    } catch (err) {
      console.error("เกิดข้อผิดพลาด:", err);
      setErrorMessage('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
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
            Sign in to access your bookings and pet profiles
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Email Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="carcat@petcare.com"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Password Input */}
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

          {/* Role Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Account Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="CUSTOMER">Customer / Pet Owner</option>
              <option value="STAFF">Clinic Staff / Admin</option>
            </select>
          </div>

          {/* Submit Button */}
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