import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Clock, Calendar } from 'lucide-react';

export default function DoctorSchedule() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.clinic_id) {
      fetchSchedules(user.clinic_id);
    }
  }, [user]);

  const fetchSchedules = async (clinicId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clinic_staff')
      .select('*')
      .eq('clinic_id', clinicId);

    if (data) {
      // กรองเฉพาะคนที่ยังไม่ลาออก (status !== 'resigned') หรือจะแสดงทั้งหมดก็ได้
      const activeStaff = data.filter(item => item.status !== 'resigned');

      const formatted = activeStaff.map(item => {
        const isWorkingToday = item.is_working_today ?? true;
        return {
          id: item.id,
          name: item.name,
          role: item.role === 'veterinarian' ? 'สัตวแพทย์' : 'พนักงานทั่วไป',
          status: isWorkingToday ? 'ปฏิบัติงานปกติ' : 'หยุดวันนี้',
          isWorkingToday: isWorkingToday,
          shift: 'กะปกติ / ตามรอบเวร',
          days: getWorkDaysText(item.work_days)
        };
      });
      setSchedules(formatted);
    }
    setLoading(false);
  };

  const getWorkDaysText = (workDays) => {
    let days = workDays;
    if (typeof workDays === 'string') {
      try { days = JSON.parse(workDays); } catch (e) { days = []; }
    }
    if (!Array.isArray(days) || days.length === 0) return '-';
    
    const dayMapObj = { mon: 'จันทร์', tue: 'อังคาร', wed: 'พุธ', thu: 'พฤหัสบดี', fri: 'ศุกร์', sat: 'เสาร์', sun: 'อาทิตย์' };
    return days.map(d => dayMapObj[d] || d).join(', ');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">ตารางเวรแพทย์และพนักงาน</h1>
          <p className="text-xs text-slate-500">ตรวจสอบวันเข้าเวรและกะการทำงานของทีมงานในคลินิก (อัปเดตตามรอบเวร)</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400 text-xs">กำลังโหลดข้อมูลตารางเวร...</div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 text-slate-400 text-xs">
          ไม่พบข้อมูลตารางเวรในสาขานี้
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {schedules.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                  {item.role}
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  item.isWorkingToday ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {item.status}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800">{item.name}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <Clock size={14} /> {item.shift}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
                <p className="font-semibold text-slate-900 mb-1 flex items-center gap-1">
                  <Calendar size={14} /> วันที่เข้าเวรประจำสัปดาห์:
                </p>
                <p className="text-slate-600 font-medium">{item.days}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}