import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../context/AuthContext';
import { Calendar, Users, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function StaffDashboard() {
  const { user } = useAuth();
  const clinicId = user?.clinic_id;

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    checkedIn: 0,
    completed: 0,
  });
  const [todayBookings, setTodayBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clinicId) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [clinicId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const todayStr = new Date().toISOString().split('T')[0];

      // ดึงข้อมูลการจองของวันนี้สำหรับคลินิกนี้
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          pets (name, species),
          profiles (full_name, email, phone)
        `)
        .eq('clinic_id', clinicId)
        .eq('appointment_date', todayStr);

      if (error) throw error;

      if (data) {
        setTodayBookings(data);
        
        // คำนวณสถิติ
        const total = data.length;
        const pending = data.filter(b => b.status === 'pending' || b.status === 'รอการยืนยัน').length;
        const checkedIn = data.filter(b => b.status === 'checked_in' || b.status === 'เช็คอินแล้ว').length;
        const completed = data.filter(b => b.status === 'completed' || b.status === 'เสร็จสิ้น').length;

        setStats({ total, pending, checkedIn, completed });
      }
    } catch (err) {
      console.error('Error fetching staff dashboard data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* ส่วนหัวแสดงข้อมูล Staff */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">ภาพรวมการให้บริการ (Staff Dashboard)</h1>
          <p className="text-xs text-slate-500">สรุปข้อมูลคิวลูกค้าและการนัดหมายประจำวันนี้ของคลินิกคุณ</p>
        </div>
        <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center gap-3">
          <div>
            <p className="font-bold text-slate-900">{user?.email}</p>
            <span className="text-[10px] text-blue-600 font-bold uppercase bg-blue-50 px-2 py-0.5 rounded-full">
              {user?.role || 'STAFF'}
            </span>
          </div>
        </div>
      </div>

      {/* ตรวจสอบว่าพนักงานถูกผูกกับคลินิกหรือยัง */}
      {clinicId ? (
        <div className="space-y-6">
          {/* การ์ดสถิติต่างๆ ประจำวัน */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="bg-blue-50 text-blue-600 p-3.5 rounded-xl">
                <Calendar size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">คิวทั้งหมดวันนี้</p>
                <h3 className="text-xl font-extrabold text-slate-800">{stats.total} คน</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="bg-amber-50 text-amber-600 p-3.5 rounded-xl">
                <Clock size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">รอดำเนินการ</p>
                <h3 className="text-xl font-extrabold text-slate-800">{stats.pending} คน</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="bg-indigo-50 text-indigo-600 p-3.5 rounded-xl">
                <Users size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">เช็คอินแล้ว</p>
                <h3 className="text-xl font-extrabold text-slate-800">{stats.checkedIn} คน</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-xl">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">ฉีดวัคซีนเสร็จสิ้น</p>
                <h3 className="text-xl font-extrabold text-slate-800">{stats.completed} คน</h3>
              </div>
            </div>
          </div>

          {/* ตารางแสดงรายชื่อคิววันนี้ */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-800">รายชื่อการนัดหมายประจำวันนี้</h2>
              <button 
                type="button"
                onClick={fetchDashboardData}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
              >
                รีเฟรชข้อมูล
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">กำลังโหลดข้อมูลคิว...</div>
            ) : todayBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                      <th className="p-4">เวลา</th>
                      <th className="p-4">ชื่อสัตว์เลี้ยง</th>
                      <th className="p-4">เจ้าของ / เบอร์โทร</th>
                      <th className="p-4">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {todayBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-semibold text-slate-900">{booking.appointment_time || 'ไม่ระบุเวลา'}</td>
                        <td className="p-4">
                          <p className="font-bold text-slate-800">{booking.pets?.name || 'ไม่ระบุ'}</p>
                          <span className="text-[10px] text-slate-500">{booking.pets?.species}</span>
                        </td>
                        <td className="p-4">
                          <p className="font-medium">{booking.profiles?.full_name || 'ลูกค้าทั่วไป'}</p>
                          <span className="text-[10px] text-slate-500">{booking.profiles?.phone || '-'}</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            booking.status === 'completed' || booking.status === 'เสร็จสิ้น'
                              ? 'bg-emerald-50 text-emerald-600'
                              : booking.status === 'checked_in' || booking.status === 'เช็คอินแล้ว'
                              ? 'bg-indigo-50 text-indigo-600'
                              : 'bg-amber-50 text-amber-600'
                          }`}>
                            {booking.status || 'รอดำเนินการ'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center space-y-2">
                <div className="text-slate-300 flex justify-center"><AlertCircle size={36} /></div>
                <p className="text-xs font-bold text-slate-700">ยังไม่มีคิวจองในวันนี้</p>
                <p className="text-[11px] text-slate-400">เมื่อลูกค้าทำการจองคิวฉีดวัคซีนเข้ามา รายชื่อจะแสดงขึ้นที่นี่อัตโนมัติ</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-amber-800 text-xs space-y-2">
          <p className="font-bold text-sm">⚠️ ยังไม่ได้ระบุคลินิกประจำตัว</p>
          <p>บัญชี Staff ของคุณยังไม่ได้เชื่อมโยงกับ `clinic_id` ในระบบฐานข้อมูล โปรดติดต่อผู้ดูแลระบบ (Admin) เพื่อทำการผูกคลินิกให้เรียบร้อยก่อนใช้งานส่วนนี้</p>
        </div>
      )}
    </div>
  );
}