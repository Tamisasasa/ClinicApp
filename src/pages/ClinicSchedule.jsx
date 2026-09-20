import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Clock, Calendar, Save } from 'lucide-react';

export default function ClinicSchedule({ clinicId }) {
  const [schedules, setSchedules] = useState([
    { day_of_week: 'Monday', open_time: '09:00', close_time: '17:00', slot_duration_minutes: 60, is_open: true },
    { day_of_week: 'Tuesday', open_time: '09:00', close_time: '17:00', slot_duration_minutes: 60, is_open: true },
    { day_of_week: 'Wednesday', open_time: '09:00', close_time: '17:00', slot_duration_minutes: 60, is_open: true },
    { day_of_week: 'Thursday', open_time: '09:00', close_time: '17:00', slot_duration_minutes: 60, is_open: true },
    { day_of_week: 'Friday', open_time: '09:00', close_time: '17:00', slot_duration_minutes: 60, is_open: true },
    { day_of_week: 'Saturday', open_time: '09:00', close_time: '13:00', slot_duration_minutes: 60, is_open: false },
    { day_of_week: 'Sunday', open_time: '09:00', close_time: '13:00', slot_duration_minutes: 60, is_open: false },
  ]);
  const [loading, setLoading] = useState(false);

  // ฟังก์ชันบันทึกข้อมูล (UC36 & UC37)
  const handleSave = async () => {
    setLoading(true);
    try {
      // ลบข้อมูลเดิมของคลินิกนี้ก่อน หรือจะใช้วิธี Upsert ก็ได้
      await supabase.from('clinic_schedules').delete().eq('clinic_id', clinicId);

      const payload = schedules.map(item => ({
        ...item,
        clinic_id: clinicId
      }));

      const { error } = await supabase.from('clinic_schedules').insert(payload);
      if (error) throw error;

      alert("บันทึกวันเวลาเปิดให้บริการและช่วงเวลารับจองสำเร็จ!");
    } catch (err) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index, field, value) => {
    const updated = [...schedules];
    updated[index][field] = value;
    setSchedules(updated);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-md space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="text-blue-600" size={20} /> กำหนดวันเวลาเปิดให้บริการ & ช่วงเวลารับจอง (UC36-UC37)
          </h2>
          <p className="text-xs text-slate-500">ตั้งค่าเวลาทำการและระยะเวลารับจองต่อรอบของคลินิก</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md"
        >
          <Save size={16} /> {loading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
      </div>

      <div className="space-y-3">
        {schedules.map((item, index) => (
          <div key={item.day_of_week} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-32 font-semibold text-xs text-slate-700 flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.is_open}
                onChange={(e) => handleChange(index, 'is_open', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              {item.day_of_week}
            </div>

            {item.is_open ? (
              <div className="flex items-center gap-4 flex-1 justify-end text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">เปิด:</span>
                  <input
                    type="time"
                    value={item.open_time}
                    onChange={(e) => handleChange(index, 'open_time', e.target.value)}
                    className="p-1.5 border rounded-lg bg-white"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">ปิด:</span>
                  <input
                    type="time"
                    value={item.close_time}
                    onChange={(e) => handleChange(index, 'close_time', e.target.value)}
                    className="p-1.5 border rounded-lg bg-white"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">รอบละ (นาที) [UC37]:</span>
                  <select
                    value={item.slot_duration_minutes}
                    onChange={(e) => handleChange(index, 'slot_duration_minutes', Number(e.target.value))}
                    className="p-1.5 border rounded-lg bg-white"
                  >
                    <option value={30}>30 นาที</option>
                    <option value={60}>60 นาที</option>
                    <option value={120}>120 นาที</option>
                  </select>
                </div>
              </div>
            ) : (
              <span className="text-xs text-red-500 font-medium italic flex-1 text-right pr-4">ปิดทำการ (Day Off)</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}