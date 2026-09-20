import React, { useState, useEffect } from 'react';
import { useAuth, supabase } from '../context/AuthContext';
import { Calendar, UserX, Clock, CheckCircle, XCircle, Filter, FileText, Image as ImageIcon } from 'lucide-react';

export default function StaffLeaveStats() {
  const { user } = useAuth();
  const clinicId = user?.clinic_id;
  
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'leave', 'absent'

  useEffect(() => {
    if (clinicId) fetchLeaveData();
  }, [clinicId]);

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      // ดึงข้อมูลจากตาราง clinic_staff เฉพาะคนที่ไม่ได้มาทำงานวันนี้ (is_working_today = false)
      const { data, error } = await supabase
        .from('clinic_staff')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_working_today', false);

      if (error) {
        console.error('Error fetching data:', error);
        setLeaves([]);
      } else {
        setLeaves(data || []);
      }
    } catch (err) {
      console.error('Error fetching leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  // กรองข้อมูลตามประเภท (ทั้งหมด / ลางาน / ขาดงาน)
  const filteredLeaves = leaves.filter(item => {
    if (statusFilter === 'all') return true;
    return item.absence_reason === statusFilter;
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">สถิติการลาและขาดงานของบุคลากร</h1>
          <p className="text-xs text-slate-500">ตรวจสอบรายชื่อบุคลากรที่ลางานหรือขาดงานประจำวัน</p>
        </div>

        {/* ตัวกรอง (Filter) */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={16} className="text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-xl text-xs bg-white font-semibold text-slate-700 w-full md:w-48 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">ทั้งหมด (ลาและขาดงาน)</option>
            <option value="leave">📝 ลางาน</option>
            <option value="absent">❌ ขาดงาน</option>
          </select>
        </div>
      </div>

      {/* ตารางแสดงข้อมูล */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 font-bold text-sm text-slate-800 flex justify-between items-center">
          <span>รายการบุคลากรที่หยุดวันนี้</span>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
            พบทั้งหมด {filteredLeaves.length} รายการ
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">กำลังโหลดข้อมูล...</div>
        ) : filteredLeaves.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            ไม่พบข้อมูลการลาหรือขาดงานในเงื่อนไขนี้ 🎉
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <th className="p-4">บุคลากร / ตำแหน่ง</th>
                <th className="p-4">ประเภท</th>
                <th className="p-4">เหตุผลรายละเอียด</th>
                <th className="p-4 text-center">หลักฐานแนบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLeaves.map((item) => {
                const isLeave = item.absence_reason === 'leave';
                const isVet = item.role === 'veterinarian';

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="p-4">
                      <span className="font-bold text-slate-900 block text-sm">{item.name}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded inline-block mt-1 ${isVet ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
                        {isVet ? 'สัตวแพทย์' : 'พนักงานทั่วไป'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 ${
                        isLeave ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-red-50 text-red-600 border border-red-200'
                      }`}>
                        {isLeave ? '📝 ลางาน' : '❌ ขาดงาน'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 max-w-xs">
                      {item.absence_note ? (
                        <p className="line-clamp-2">{item.absence_note}</p>
                      ) : (
                        <span className="text-slate-400 italic">- ไม่ได้ระบุเหตุผล -</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {item.absence_proof_url ? (
                        <a
                          href={item.absence_proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg font-bold transition"
                        >
                          <ImageIcon size={14} /> ดูรูปหลักฐาน
                        </a>
                      ) : (
                        <span className="text-slate-400">- ไม่มีรูปแนบ -</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}