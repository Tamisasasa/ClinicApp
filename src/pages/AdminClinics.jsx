import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Building2, Plus, Edit3, Trash2, FileText, User, ShieldAlert, ShieldCheck, ArrowLeft, Tag, Layers, Check, Search, DollarSign, Stethoscope, Key } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15);
  }, [center, map]);
  return null;
}

export default function AdminClinicsManager() {
  const [clinics, setClinics] = useState([]);
  const [masterServices, setMasterServices] = useState([]);
  const [clinicServices, setClinicServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State ควบคุมการเปลี่ยนหน้า: null = อยู่หน้าตารางรวม, object = หน้าดูรายละเอียดคลินิกนั้นๆ
  const [selectedClinic, setSelectedClinic] = useState(null);

  // State Modal คลินิก
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [currentClinic, setCurrentClinic] = useState(null);
  const [mapPosition, setMapPosition] = useState([18.7961, 98.9692]);
  const [isSearchingMap, setIsSearchingMap] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    area: '',
    owner_name: '',
    email: '',
    password: '', // เพิ่มฟิลด์รหัสผ่านสำหรับสร้างบัญชี Auth
    license_document: '',
    status: 'active',
    lat: 18.7961,
    lng: 98.9692
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: clinicData } = await supabase.from('clinics').select('*');
    const { data: masterData } = await supabase.from('master_services').select('*');
    const { data: serviceData } = await supabase.from('clinic_services').select('*');
    if (clinicData) setClinics(clinicData);
    if (masterData) setMasterServices(masterData);
    if (serviceData) setClinicServices(serviceData);
    setLoading(false);
  };

  const handleOpenModal = (clinic = null) => {
    if (clinic) {
      setCurrentClinic(clinic);
      const lat = clinic.lat || 18.7961;
      const lng = clinic.lng || 98.9692;
      setFormData({
        name: clinic.name || '',
        address: clinic.address || '',
        phone: clinic.phone || '',
        area: clinic.area || '',
        owner_name: clinic.owner_name || '',
        email: clinic.email || '',
        password: '', // ไม่ดึงรหัสผ่านเดิมมาแสดงเพื่อความปลอดภัย
        license_document: clinic.license_document || '',
        status: clinic.status || 'active',
        lat: lat,
        lng: lng
      });
      setMapPosition([lat, lng]);
    } else {
      setCurrentClinic(null);
      setFormData({ name: '', address: '', phone: '', area: '', owner_name: '', email: '', password: '', license_document: '', status: 'active', lat: 18.7961, lng: 98.9692 });
      setMapPosition([18.7961, 98.9692]);
    }
    setIsOpenModal(true);
  };

  const handleAddressBlur = async () => {
    if (!formData.address) return;
    setIsSearchingMap(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setMapPosition([lat, lng]);
        setFormData(prev => ({ ...prev, lat, lng }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearchingMap(false);
    }
  };

  const handleToggleStatus = async (clinic) => {
    const newStatus = clinic.status === 'suspended' ? 'active' : 'suspended';
    const { error } = await supabase.from('clinics').update({ status: newStatus }).eq('id', clinic.id);
    if (!error) fetchData();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentClinic) {
        // อัปเดตข้อมูลคลินิก (ไม่บังคับเปลี่ยนรหัสผ่าน)
        const updatePayload = {
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          area: formData.area,
          owner_name: formData.owner_name,
          email: formData.email,
          license_document: formData.license_document,
          status: formData.status,
          lat: formData.lat,
          lng: formData.lng
        };

        const { error } = await supabase.from('clinics').update(updatePayload).eq('id', currentClinic.id);
        if (error) throw error;

        // หากมีการกรอกรหัสผ่านใหม่ สามารถเพิ่มฟังก์ชันอัปเดต Auth ตรงนี้ได้ถ้าต้องการ
        setIsOpenModal(false);
        fetchData();
      } else {
        // เพิ่มคลินิกใหม่ พร้อมสร้างบัญชีผู้ใช้ใน Supabase Auth
        if (!formData.email || !formData.password) {
          alert('กรุณากรอกอีเมลและรหัสผ่านสำหรับเข้าสู่ระบบของคลินิก');
          return;
        }

        // 1. สมัครสมาชิกผ่าน Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              role: 'clinic_staff', // กำหนดสิทธิ์ว่าเป็นพนักงาน/คลินิก
              clinic_name: formData.name
            }
          }
        });

        if (authError) throw authError;

        // 2. บันทึกข้อมูลลงตาราง clinics
        const insertPayload = {
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          area: formData.area,
          owner_name: formData.owner_name,
          email: formData.email,
          license_document: formData.license_document,
          status: formData.status,
          lat: formData.lat,
          lng: formData.lng
        };

        const { error: dbError } = await supabase.from('clinics').insert([insertPayload]);
        if (dbError) throw dbError;

        alert('สร้างบัญชีและเพิ่มคลินิกสำเร็จ!');
        setIsOpenModal(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error saving clinic:", error.message);
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
  };

  // ================= จัดการเปิด-ปิด บริการและราคาจาก Master Services =================
  const handleToggleService = async (service, currentClinicId) => {
    const isSelected = clinicServices.some(s => s.clinic_id === currentClinicId && s.master_service_id === service.id);

    if (isSelected) {
      const { error } = await supabase
        .from('clinic_services')
        .delete()
        .eq('clinic_id', currentClinicId)
        .eq('master_service_id', service.id);

      if (!error) {
        setClinicServices(clinicServices.filter(s => !(s.clinic_id === currentClinicId && s.master_service_id === service.id)));
      }
    } else {
      const newService = {
        clinic_id: currentClinicId,
        master_service_id: service.id,
        name: service.name,
        category: service.category,
        price: service.default_price || 0
      };

      const { data, error } = await supabase.from('clinic_services').insert([newService]).select();
      if (!error && data) {
        setClinicServices([...clinicServices, data[0]]);
      }
    }
  };

  const handlePriceChange = (masterServiceId, newPrice, currentClinicId) => {
    setClinicServices(clinicServices.map(s => 
      (s.clinic_id === currentClinicId && s.master_service_id === masterServiceId) ? { ...s, price: newPrice } : s
    ));
  };

  const handleSavePrice = async (masterServiceId, price, currentClinicId) => {
    await supabase
      .from('clinic_services')
      .update({ price: parseFloat(price) || 0 })
      .eq('clinic_id', currentClinicId)
      .eq('master_service_id', masterServiceId);
  };

  // ================= 1. หน้าดูรายละเอียดคลินิกเฉพาะกิจ =================
  if (selectedClinic) {
    const currentClinicServices = clinicServices.filter(s => s.clinic_id === selectedClinic.id);
    const filteredMaster = masterServices.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <button 
          onClick={() => setSelectedClinic(null)}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 hover:bg-slate-50 transition"
        >
          <ArrowLeft size={16} /> กลับสู่หน้ารายชื่อคลินิก
        </button>

        {/* ข้อมูลสรุปคลินิก พร้อมแสดงอีเมลและรหัสคลินิก */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-blue-600 font-bold text-xs bg-blue-50 px-3 py-1 rounded-full">โซน: {selectedClinic.area || 'ไม่ระบุ'}</span>
              {selectedClinic.status === 'suspended' ? (
                <span className="bg-rose-100 text-rose-700 px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1">
                  <ShieldAlert size={14} /> ปิดให้บริการ / ระงับ
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1">
                  <ShieldCheck size={14} /> เปิดให้บริการ
                </span>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">อีเมลเข้าสู่ระบบสาขา</span>
                <span className="font-bold text-slate-800">{selectedClinic.email || 'N/A'}</span>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">รหัสคลินิก (Clinic ID)</span>
                <span className="font-mono font-bold text-blue-600">{selectedClinic.id}</span>
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">{selectedClinic.name}</h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>เจ้าของ: <strong className="text-slate-700">{selectedClinic.owner_name || 'ไม่ระบุ'}</strong></span>
              <span>•</span>
              <span>เบอร์โทร: <strong className="text-slate-700">{selectedClinic.phone || 'ไม่ระบุ'}</strong></span>
            </p>
            <p className="text-xs text-slate-600 mt-1">ที่อยู่: {selectedClinic.address}</p>
          </div>
        </div>

        {/* ส่วนจัดการบริการ (เลือกจาก Master Services) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <Stethoscope className="text-blue-600" /> จัดการประเภทบริการของคลินิกนี้
              </h2>
              <p className="text-xs text-slate-500">ติ๊กเลือกบริการมาตรฐานจากส่วนกลางเพื่อเปิดใช้งาน และกำหนดราคาขายเฉพาะสาขานี้</p>
            </div>
            
            <div className="relative w-full md:w-64">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาบริการกลาง..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <th className="p-4 text-center w-16">เปิดใช้</th>
                  <th className="p-4">ชื่อบริการ</th>
                  <th className="p-4">หมวดหมู่</th>
                  <th className="p-4">ราคามาตรฐานกลาง</th>
                  <th className="p-4">ราคาขายจริงของสาขานี้ (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredMaster.map((item) => {
                  const activeClinicService = currentClinicServices.find(s => s.master_service_id === item.id);
                  const isSelected = !!activeClinicService;

                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/50 ${isSelected ? 'bg-blue-50/30' : ''}`}>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleService(item, selectedClinic.id)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center mx-auto transition ${
                            isSelected 
                              ? 'bg-blue-600 text-white shadow-sm' 
                              : 'border-2 border-slate-300 bg-white hover:border-blue-400'
                          }`}
                        >
                          {isSelected && <Check size={14} />}
                        </button>
                      </td>
                      <td className="p-4 font-bold text-slate-900">{item.name}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md font-semibold text-[10px]">
                          {item.category || 'ทั่วไป'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">{item.default_price || 0} บาท</td>
                      <td className="p-4">
                        {isSelected ? (
                          <div className="flex items-center gap-2">
                            <DollarSign size={14} className="text-emerald-600" />
                            <input
                              type="number"
                              value={activeClinicService.price}
                              onChange={(e) => handlePriceChange(item.id, e.target.value, selectedClinic.id)}
                              onBlur={(e) => handleSavePrice(item.id, e.target.value, selectedClinic.id)}
                              className="w-32 px-3 py-1.5 border rounded-xl text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">- ยังไม่ได้เปิดใช้งาน -</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ================= 2. หน้าหลัก: ตารางรายชื่อคลินิก =================
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Building2 className="text-blue-600" /> Clinic Management (UC49-51)
          </h1>
          <p className="text-xs text-slate-500 mt-1">คลิกที่ชื่อคลินิกเพื่อดูรายละเอียดและจัดการบริการ</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md transition"
        >
          <Plus size={16} /> เพิ่มคลินิกใหม่ (UC49)
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500">
              <th className="p-4">ชื่อคลินิก / อีเมลล็อกอิน</th>
              <th className="p-4">ที่อยู่ / พื้นที่</th>
              <th className="p-4">เบอร์โทร</th>
              <th className="p-4">สถานะ</th>
              <th className="p-4 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {clinics.map((c) => {
              const isSuspended = c.status === 'suspended';
              return (
                <tr key={c.id} className={`border-b border-slate-100 hover:bg-slate-50/50 ${isSuspended ? 'bg-rose-50/30 text-slate-400' : ''}`}>
                  <td className="p-4">
                    <button 
                      onClick={() => setSelectedClinic(c)}
                      className={`font-bold text-left hover:underline block ${isSuspended ? 'line-through text-slate-400' : 'text-blue-600'}`}
                    >
                      {c.name}
                    </button>
                    <span className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                      <User size={12} /> อีเมล: {c.email || 'ไม่ระบุ'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600"><span className="text-blue-600 font-semibold">[{c.area}]</span> {c.address}</td>
                  <td className="p-4 text-slate-600">{c.phone}</td>
                  <td className="p-4">
                    {isSuspended ? (
                      <span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                        <ShieldAlert size={12} /> ระงับ
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                        <ShieldCheck size={12} /> เปิดใช้งาน
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => handleToggleStatus(c)} className={`px-3 py-1.5 rounded-lg font-bold ${isSuspended ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {isSuspended ? 'เปิดใช้งาน' : 'ระงับ'}
                    </button>
                    <button onClick={() => handleOpenModal(c)} className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg font-bold">แก้ไข</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal เพิ่ม/แก้ไข คลินิก */}
      {isOpenModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-800">
              {currentClinic ? 'แก้ไขข้อมูลคลินิก (UC50)' : 'เพิ่มคลินิกใหม่และสร้างบัญชี (UC49)'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">ชื่อคลินิก</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">ชื่อเจ้าของคลินิก</label>
                  <input type="text" required value={formData.owner_name} onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs" />
                </div>
              </div>

              {/* ฟิลด์สร้างอีเมลและรหัสผ่านเข้าสู่ระบบ */}
              <div className="grid grid-cols-2 gap-3 bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
                <div>
                  <label className="block text-[11px] font-bold text-blue-700 uppercase mb-1 flex items-center gap-1">
                    <User size={12} /> อีเมลเข้าสู่ระบบสาขา
                  </label>
                  <input 
                    type="email" 
                    required 
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    placeholder="clinic@petcare.com" 
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-blue-700 uppercase mb-1 flex items-center gap-1">
                    <Key size={12} /> รหัสผ่านเริ่มต้น {currentClinic && '(เว้นว่างไว้หากไม่เปลี่ยน)'}
                  </label>
                  <input 
                    type="password" 
                    required={!currentClinic}
                    value={formData.password} 
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                    placeholder="••••••••" 
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">ที่อยู่ (พิมพ์เสร็จคลิกออกเพื่อปักหมุดออโต้)</label>
                <input type="text" required value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} onBlur={handleAddressBlur} className="w-full px-3 py-2 border rounded-xl text-xs" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">เบอร์โทร</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">โซน/พื้นที่ (Area)</label>
                  <input type="text" value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">สถานะ</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs bg-white">
                    <option value="active">เปิดให้บริการ</option>
                    <option value="suspended">ระงับ</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">ตำแหน่งปักหมุดบนแผนที่</label>
                <div className="h-40 w-full rounded-2xl overflow-hidden border">
                  <MapContainer center={mapPosition} zoom={15} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={mapPosition}></Marker>
                    <MapUpdater center={mapPosition} />
                  </MapContainer>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsOpenModal(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-md">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}