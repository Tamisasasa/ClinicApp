import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient'; // 👈 นำเข้า Supabase Client
import { X, Mail, Lock, User, ShieldCheck, AlertCircle } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'USER',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      if (isRegister) {
        // ==========================================
        // 1. กรณีสมัครสมาชิกใหม่ (Sign Up)
        // ==========================================
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (authError) throw authError;

        if (authData.user) {
          // เพิ่มข้อมูลลงในตาราง profiles
          const { error: profileError } = await supabase.from('profiles').insert([
            {
              id: authData.user.id,
              name: formData.fullName || formData.email.split('@')[0],
              email: formData.email,
              role: formData.role,
              status: 'ACTIVE',
            },
          ]);

          if (profileError) throw profileError;

          login({
            id: authData.user.id,
            email: formData.email,
            full_name: formData.fullName,
            role: formData.role,
          });
          onClose();
        }
      } else {
        // ==========================================
        // 2. กรณีเข้าสู่ระบบ (Sign In / UC44)
        // ==========================================
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (authError) throw authError;

        // ดึงข้อมูล Role และ Status จากตาราง profiles ใน Supabase
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (profileError || !profile) {
          throw new Error('ไม่พบข้อมูลโปรไฟล์ผู้ใช้งานในระบบ');
        }

        // ตรวจสอบว่าบัญชีถูกระงับหรือไม่ (UC47/UC48)
        if (profile.status === 'SUSPENDED') {
          await supabase.auth.signOut();
          setErrorMessage('บัญชีผู้ใช้นี้ถูกระงับการใช้งาน');
          setLoading(false);
          return;
        }

        // ตรวจสอบ Role กรณีเลือกประเภทการเข้าสู่ระบบเป็น STAFF/ADMIN
        if (formData.role === 'STAFF' && profile.role !== 'STAFF' && profile.role !== 'ADMIN') {
          await supabase.auth.signOut();
          setErrorMessage('บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานในฐานะผู้ดูแลระบบ');
          setLoading(false);
          return;
        }

        // เข้าสู่ระบบสำเร็จ
        login({
          id: profile.id,
          email: profile.email,
          full_name: profile.name,
          role: profile.role,
        });
        onClose();
      }
    } catch (error) {
      setErrorMessage(error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1 transition"
          >
            <X size={20} />
          </button>
          <h2 className="text-2xl font-extrabold">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-blue-100 text-xs mt-1">
            {isRegister
              ? 'Join us to manage your pet vaccination records'
              : 'Sign in to access your bookings and pet profiles'}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isRegister && (
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          {/* Select Role */}
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Account Role</label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <select
                className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={formData.role}
                onChange={(e) => {
                  setFormData({ ...formData, role: e.target.value });
                  setErrorMessage('');
                }}
              >
                <option value="USER">Pet Owner (User)</option>
                <option value="STAFF">Clinic Staff / Admin</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-md shadow-blue-200 mt-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : isRegister ? 'Sign Up' : 'Sign In'}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMessage('');
              }}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              {isRegister
                ? 'Already have an account? Sign In'
                : "Don't have an account? Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}