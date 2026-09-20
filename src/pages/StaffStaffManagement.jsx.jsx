import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, Edit3, Stethoscope, Building2, Search, Calendar, CheckCircle2, XCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';

export default function StaffStaffManagement() {
  const { user } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [clinicInfo, setClinicInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');

  const [isOpenModal, setIsOpenModal] = useState(false);
  const [currentStaff, setCurrentStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    role: 'veterinarian',
    clinic_id: '',
    phone: '',
    work_days: [],
    status: 'active'
  });

  // State สำหรับ Popup ระบุเหตุผลการหยุด / แนบรูป
  const [isOpenReasonModal, setIsOpenReasonModal] = useState(false);
  const [targetStaffForReason, setTargetStaffForReason] = useState(null);
  const [absenceReason, setAbsenceReason] = useState('leave'); // 'leave' = ลา, 'absent' = ขาด
  const [absenceNote, setAbsenceNote] = useState('');
  const [absenceProof, setAbsenceProof] = useState('');

  // State สำหรับ Popup ยืนยันเปลี่ยนกลับมาทำงาน (กรณีเผลอกดผิด)
  const [isOpenConfirmWorkModal, setIsOpenConfirmWorkModal] = useState(false);
  const [targetStaffForWork, setTargetStaffForWork] = useState(null);

  useEffect(() => {
    // ตรวจสอบว่ามี clinic_id หรือไม่ หากไม่มีใน user object ให้ลองดึงจากตาราง clinics ตามอีเมลหรือเงื่อนไขที่เกี่ยวข้อง
    if (user?.clinic_id) {
      fetchData(user.clinic_id);
    } else if (user?.email) {
      fetchClinicAndStaffByEmail(user.email);
    }
  }, [user]);

  // ฟังก์ชันสำรองกรณีที่ user object ไม่มี clinic_id แต่มี email (สำหรับเชื่อมโยงกับตาราง admins/clinics)
  const fetchClinicAndStaffByEmail = async (email) => {
    setLoading(true);
    try {
      // ตัวอย่าง: ค้นหาจากตาราง admins หรือใช้ clinic_id แรกที่มี (หรือปรับตามโครงสร้างฐานข้อมูลของคุณ)
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('clinic_id')
        .eq('email', email)
        .single();

      if (adminData && adminData.clinic_id) {
        fetchData(adminData.clinic_id);
      } else {
        // หากไม่พบใน admins ให้ลองดึงคลินิกแรกเริ่มมาแสดงแทนเพื่อไม่ให้ค้าง (หรือปรับเปลี่ยนตามความเหมาะสม)
        const { data: defaultClinic } = await supabase
          .from('clinics')
          .select('id')
          .limit(1)
          .single();
        
        if (defaultClinic) {
          fetchData(defaultClinic.id);
        }
      }
    } catch (err) {
      console.error('Error fetching clinic by email:', err);
    }
    setLoading(false);
  };

  const fetchData = async (clinicId) => {
    setLoading(true);
    const { data: cData } = await supabase.from('clinics').select('*').eq('id', clinicId).single();
    if (cData) setClinicInfo(cData);

    const { data: staffData } = await supabase
      .from('clinic_staff')
      .select('*, clinics(name, area)')
      .eq('clinic_id', clinicId);

    if (staffData) setStaffList(staffData);
    setLoading(false);
  };

  const handleOpenModal = (staff = null) => {
    const activeClinicId = clinicInfo?.id || user?.clinic_id;
    if (staff) {
      setCurrentStaff(staff);
      setFormData({
        name: staff.name || '',
        role: staff.role || 'veterinarian',
        clinic_id: activeClinicId,
        phone: staff.phone || '',
        work_days: Array.isArray(staff.work_days) ? staff.work_days : (staff.work_days ? JSON.parse(staff.work_days) : []),
        status: staff.status || 'active'
      });
    } else {
      setCurrentStaff(null);
      setFormData({
        name: '',
        role: 'veterinarian',
        clinic_id: activeClinicId,
        phone: '',
        work_days: [],
        status: 'active'
      });
    }
    setIsOpenModal(true);
  };

  const handleDayToggle = (dayId) => {
    const currentDays = [...formData.work_days];
    if (currentDays.includes(dayId)) {
      setFormData({ ...formData, work_days: currentDays.filter(d => d !== dayId) });
    } else {
      setFormData({ ...formData, work_days: [...currentDays, dayId] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const activeClinicId = clinicInfo?.id || user?.clinic_id;
    const dataToSubmit = { ...formData, clinic_id: activeClinicId };

    if (currentStaff) {
      const { error } = await supabase.from('clinic_staff').update(dataToSubmit).eq('id', currentStaff.id);
      if (!error) { setIsOpenModal(false); fetchData(activeClinicId); }
      else { alert('เกิดข้อผิดพลาด: ' + error.message); }
    } else {
      const { error } = await supabase.from('clinic_staff').insert([dataToSubmit]);
      if (!error) { setIsOpenModal(false); fetchData(activeClinicId); }
      else { alert('เกิดข้อผิดพลาด: ' + error.message); }
    }
  };

  const handleToggleTodayWorkClick = (staff) => {
    const currentStatus = staff.is_working_today ?? true;
    if (currentStatus === true) {
      setTargetStaffForReason(staff);
      setAbsenceReason('leave');
      setAbsenceNote('');
      setAbsenceProof('');
      setIsOpenReasonModal(true);
    } else {
      setTargetStaffForWork(staff);
      setIsOpenConfirmWorkModal(true);
    }
  };

  const handleSaveAbsence = async () => {
    if (!targetStaffForReason) return;
    const updateData = {
      is_working_today: false,
      absence_reason: absenceReason,
      absence_note: absenceNote,
      absence_proof_url: absenceProof
    };

    const { error } = await supabase
      .from('clinic_staff')
      .update(updateData)
      .eq('id', targetStaffForReason.id);

    if (!error) {
      setStaffList(staffList.map(s => s.id === targetStaffForReason.id ? { ...s, ...updateData } : s));
      setIsOpenReasonModal(false);
      setTargetStaffForReason(null);
    } else {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const handleConfirmBackToWork = async () => {
    if (!targetStaffForWork) return;
    const updateData = {
      is_working_today: true,
      absence_reason: null,
      absence_note: null,
      absence_proof_url: null
    };

    const { error } = await supabase
      .from('clinic_staff')
      .update(updateData)
      .eq('id', targetStaffForWork.id);

    if (!error) {
      setStaffList(staffList.map(s => s.id === targetStaffForWork.id ? { ...s, ...updateData } : s));
      setIsOpenConfirmWorkModal(false);
      setTargetStaffForWork(null);
    } else {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const filteredStaff = staffList.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRoleFilter === 'all' || item.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const totalStaff = staffList.filter(s => s.status === 'active').length;
  const totalVets = staffList.filter(s => s.role === 'veterinarian' && s.status === 'active').length;
  const totalGeneralStaff = staffList.filter(s => s.role === 'staff' && s.status === 'active').length;

  const daysMapping = [
    { id: 'mon', label: 'จันทร์' },
    { id: 'tue', label: 'อังคาร' },
    { id: 'wed', label: 'พุธ' },
    { id: 'thu', label: 'พฤหัสบดี' },
    { id: 'fri', label: 'ศุกร์' },
    { id: 'sat', label: 'เสาร์' },
    { id: 'sun', label: 'อาทิตย์' }
  ];

  const getWorkDaysLabel = (workDays) => {
    let days = workDays;
    if (typeof workDays === 'string') {
      try { days = JSON.parse(workDays); } catch (e) { days = []; }
    }
    if (!Array.isArray(days) || days.length === 0) return '-';
    
    const dayMapObj = { mon: 'จ.', tue: 'อ.', wed: 'พ.', thu: 'พฤ.', fri: 'ศ.', sat: 'ส.', sun: 'อา.' };
    return days.map(d => dayMapObj[d] || d).join(', ');
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Users className="text-blue-600" /> จัดการบุคลากรประจำคลินิก
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            สาขา: <span className="font-bold text-slate-700">{clinicInfo?.name || 'กำลังโหลด...'}</span> ({clinicInfo?.area || '-'})
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md transition"
        >
          <Plus size={16} /> เพิ่มบุคลากรในสังกัด
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">บุคลากรที่ยังปฏิบัติงาน</p>
            <h3 className="text-xl font-extrabold text-slate-800">{totalStaff} คน</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Stethoscope size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">สัตวแพทย์</p>
            <h3 className="text-xl font-extrabold text-slate-800">{totalVets} ท่าน</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Building2 size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">พนักงานทั่วไป</p>
            <h3 className="text-xl font-extrabold text-slate-800">{totalGeneralStaff} คน</h3>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อบุคลากร..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={selectedRoleFilter}
          onChange={(e) => setSelectedRoleFilter(e.target.value)}
          className="px-4 py-2 border rounded-xl text-xs bg-white font-semibold text-slate-700 w-full md:w-48 focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">ทุกตำแหน่ง</option>
          <option value="veterinarian">สัตวแพทย์</option>
          <option value="staff">พนักงานทั่วไป</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500">
              <th className="p-4">ชื่อ - นามสกุล / ตำแหน่ง</th>
              <th className="p-4">วันที่เข้าทำงาน</th>
              <th className="p-4">เบอร์โทรติดต่อ</th>
              <th className="p-4 text-center">มาทำงานวันนี้?</th>
              <th className="p-4 text-center">สถานะ</th>
              <th className="p-4 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-10 text-slate-400">ไม่พบข้อมูลบุคลากรในสาขานี้</td>
              </tr>
            ) : (
              filteredStaff.map((item) => {
                const isVet = item.role === 'veterinarian';
                const isResigned = item.status === 'resigned';
                const isWorkingToday = item.is_working_today ?? true;
                const absenceReason = item.absence_reason; 

                return (
                  <tr key={item.id} className={`border-b border-slate-100 hover:bg-slate-50/50 ${isResigned ? 'opacity-60 bg-slate-50/80' : ''}`}>
                    <td className="p-4">
                      <span className="font-bold text-slate-800 block text-sm">{item.name}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md inline-flex items-center gap-1 mt-1 ${isVet ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
                        <Stethoscope size={12} /> {isVet ? 'สัตวแพทย์' : 'พนักงานทั่วไป'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-slate-700 font-medium bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Calendar size={12} className="text-slate-500" /> {getWorkDaysLabel(item.work_days)}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{item.phone || '-'}</td>
                    
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleTodayWorkClick(item)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] inline-flex items-center gap-1 transition ${
                            isWorkingToday 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                              : 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {isWorkingToday ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                          {isWorkingToday ? 'มาทำงานวันนี้' : 'หยุดวันนี้'}
                        </button>
                        {!isWorkingToday && absenceReason && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            absenceReason === 'leave' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
                          }`}>
                            {absenceReason === 'leave' ? '📝 ลางาน' : '❌ ขาดงาน'}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        isResigned ? 'bg-slate-200 text-slate-600' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {isResigned ? 'ลาออกแล้ว' : 'ยังทำงานอยู่'}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleOpenModal(item)} 
                        className="bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg font-bold inline-flex items-center gap-1 transition"
                      >
                        <Edit3 size={14} /> แก้ไขสถานะ/ข้อมูล
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isOpenReasonModal && targetStaffForReason && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">ระบุรายละเอียดการหยุดงาน</h3>
                <p className="text-xs text-slate-500">พนักงาน: {targetStaffForReason.name}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">ประเภทการไม่มาทำงาน</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`flex items-center gap-2 p-2.5 border rounded-xl text-xs cursor-pointer ${absenceReason === 'leave' ? 'border-orange-500 bg-orange-50/50 font-bold text-orange-900' : 'border-slate-200'}`}>
                    <input type="radio" name="reason" value="leave" checked={absenceReason === 'leave'} onChange={() => setAbsenceReason('leave')} />
                    <span>ลางาน (ป่วย/กิจ)</span>
                  </label>
                  <label className={`flex items-center gap-2 p-2.5 border rounded-xl text-xs cursor-pointer ${absenceReason === 'absent' ? 'border-red-500 bg-red-50/50 font-bold text-red-900' : 'border-slate-200'}`}>
                    <input type="radio" name="reason" value="absent" checked={absenceReason === 'absent'} onChange={() => setAbsenceReason('absent')} />
                    <span>ขาดงาน</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">เหตุผลเพิ่มเติม</label>
                <textarea
                  rows="2"
                  value={absenceNote}
                  onChange={(e) => setAbsenceNote(e.target.value)}
                  placeholder="ระบุรายละเอียด เช่น ป่วยเป็นไข้หวัดใหญ่, มีธุระด่วน..."
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">แนบลิงก์รูปภาพหลักฐาน (เช่น ใบรับรองแพทย์)</label>
                <div className="flex items-center gap-2">
                  <ImageIcon size={16} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={absenceProof}
                    onChange={(e) => setAbsenceProof(e.target.value)}
                    placeholder="วาง URL รูปภาพหลักฐานที่นี่..."
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsOpenReasonModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveAbsence}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md"
              >
                บันทึกการหยุดงาน
              </button>
            </div>
          </div>
        </div>
      )}

      {isOpenConfirmWorkModal && targetStaffForWork && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">ยืนยันเปลี่ยนเป็นมาทำงาน?</h3>
                <p className="text-xs text-slate-500">พนักงาน: {targetStaffForWork.name}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              คุณต้องการเปลี่ยนสถานะพนักงานท่านนี้กลับเป็น <strong className="text-emerald-700">"มาทำงานวันนี้"</strong> ใช่หรือไม่?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsOpenConfirmWorkModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmBackToWork}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md"
              >
                ยืนยัน กลับมาทำงาน
              </button>
            </div>
          </div>
        </div>
      )}

      {isOpenModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-800">
              {currentStaff ? 'แก้ไขข้อมูลบุคลากร' : 'เพิ่มบุคลากรใหม่ประจำสาขา'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">ชื่อ - นามสกุล (พร้อมคำนำหน้า)</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น นพ.สมชาย รักสัตว์"
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">ตำแหน่ง</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="veterinarian">สัตวแพทย์</option>
                  <option value="staff">พนักงานทั่วไป</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">สถานะการทำงาน</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 font-semibold"
                >
                  <option value="active">ยังทำงานอยู่ (Active)</option>
                  <option value="resigned">ลาออกแล้ว (Resigned)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">วันที่เข้าทำงานประจำสัปดาห์ (เลือกได้หลายวัน)</label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {daysMapping.map((day) => {
                    const isChecked = formData.work_days.includes(day.id);
                    return (
                      <label
                        key={day.id}
                        className={`flex items-center gap-2 p-2.5 border rounded-xl text-xs cursor-pointer transition ${
                          isChecked
                            ? 'border-blue-600 bg-blue-50/50 font-bold text-blue-900'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleDayToggle(day.id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        {day.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">เบอร์โทร</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsOpenModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}