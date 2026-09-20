import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Users, Building2, Syringe, Calendar, Eye, Trash2, Plus } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  // โหลดข้อมูลตาม Tab ที่เลือก
  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'clinics') fetchClinics();
    if (activeTab === 'vaccines') fetchVaccines();
    if (activeTab === 'bookings') fetchBookings();
  }, [activeTab]);

  // ==========================================
  // UC45: ดึงรายชื่อ User จาก Supabase
  // ==========================================
  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*');
    if (!error) setUsers(data);
    setLoading(false);
  };


  // ==========================================
  // UC59 & UC61: เพิ่ม / ลบ วัคซีน
  // ==========================================
  const fetchVaccines = async () => {
    const { data } = await supabase.from('vaccines').select('*');
    if (data) setVaccines(data);
  };

  const deleteVaccine = async (id) => {
    const { error } = await supabase.from('vaccines').delete().eq('id', id);
    if (!error) setVaccines(vaccines.filter(v => v.id !== id));
  };

  // ==========================================
  // UC64: ดึงรายการการจองทั้งหมด (JOIN Table)
  // ==========================================
  const fetchBookings = async () => {
    const { data } = await supabase
      .from('bookings')
      .select('id, booking_date, status, profiles(name), clinics(name)');
    if (data) setBookings(data);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b pb-2">
        <button onClick={() => setActiveTab('vaccines')} className={`px-4 py-2 rounded-xl font-bold text-xs ${activeTab === 'vaccines' ? 'bg-blue-600 text-white' : 'bg-white'}`}>จัดการวัคซีน (UC54-61)</button>
        <button onClick={() => setActiveTab('bookings')} className={`px-4 py-2 rounded-xl font-bold text-xs ${activeTab === 'bookings' ? 'bg-blue-600 text-white' : 'bg-white'}`}>ดูรายการจอง (UC64)</button>
      </div>

      {/* TAB 1: USERS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl p-4 border">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b font-bold text-slate-500">
                <th className="p-3">ชื่อ-อีเมล</th>
                <th className="p-3">บทบาท</th>
                <th className="p-3">สถานะ</th>
                <th className="p-3 text-right">จัดการ (UC47-48)</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b">
                  <td className="p-3 font-bold">{u.name}<br/><span className="text-slate-400 font-normal">{u.email}</span></td>
                  <td className="p-3">{u.role}</td>
                  <td className="p-3 font-bold">{u.status}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => toggleUserStatus(u.id, u.status)}
                      className={`px-3 py-1 rounded-lg font-bold ${u.status === 'ACTIVE' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}
                    >
                      {u.status === 'ACTIVE' ? 'ระงับ (UC47)' : 'ปลดระงับ (UC48)'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: CLINICS */}
      {activeTab === 'clinics' && (
        <div className="bg-white rounded-2xl p-4 border">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b font-bold text-slate-500">
                <th className="p-3">ชื่อคลินิก</th>
                <th className="p-3">สถานะ</th>
                <th className="p-3 text-right">การอนุมัติ (UC52-53)</th>
              </tr>
            </thead>
            <tbody>
              {clinics.map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="p-3 font-bold">{c.name}</td>
                  <td className="p-3 font-bold">{c.status}</td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => updateClinicStatus(c.id, 'APPROVED')} className="bg-emerald-600 text-white px-2 py-1 rounded">อนุมัติ (UC52)</button>
                    <button onClick={() => updateClinicStatus(c.id, 'SUSPENDED')} className="bg-rose-600 text-white px-2 py-1 rounded">ระงับ (UC53)</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}