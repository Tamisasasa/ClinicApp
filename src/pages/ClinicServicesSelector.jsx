import React, { useState, useEffect } from 'react';
import { useAuth, supabase } from '../context/AuthContext';
import { Plus, Check, Search, Stethoscope, DollarSign, Building2 } from 'lucide-react';

export default function ClinicServicesSelector() {
  const { user } = useAuth();
  
  const [clinics, setClinics] = useState([]); // สำหรับให้ Admin เลือกสาขา
  const [selectedClinicId, setSelectedClinicId] = useState(user?.clinic_id || '');
  
  const [masterServices, setMasterServices] = useState([]);
  const [clinicServices, setClinicServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // เช็คว่า User เป็น Admin หรือไม่ (สมมติ role เก็บใน user.role หรือเช็คจากเงื่อนไขอีเมล)
  const isAdmin = user?.role === 'admin' || user?.email?.includes('admin@petcare.com');

  useEffect(() => {
    if (isAdmin) {
      fetchClinicsList(); // ถ้าเป็น Admin ให้ดึงรายชื่อทุกคลินิกมาให้เลือก
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedClinicId) {
      fetchData(selectedClinicId);
    }
  }, [selectedClinicId]);

  // ดึงรายชื่อคลินิกทั้งหมด (สำหรับ Admin)
  const fetchClinicsList = async () => {
    const { data } = await supabase.from('clinics').select('id, name, area');
    if (data && data.length > 0) {
      setClinics(data);
      if (!selectedClinicId) setSelectedClinicId(data[0].id); // ค่าเริ่มต้นเลือกสาขาแรก
    }
  };

  const fetchData = async (clinicId) => {
    setLoading(true);
    // 1. ดึงรายการบริการกลางทั้งหมด (Master Services)
    const { data: masterData } = await supabase.from('master_services').select('*');
    if (masterData) setMasterServices(masterData);

    // 2. ดึงบริการที่คลินิกนี้เปิดใช้งานอยู่
    const { data: clinicData } = await supabase
      .from('clinic_services')
      .select('*')
      .eq('clinic_id', clinicId);
    if (clinicData) setClinicServices(clinicData);

    setLoading(false);
  };

  // ฟังก์ชันเปิด/ปิด การใช้งานบริการในคลินิก
  const handleToggleService = async (service) => {
    const isSelected = clinicServices.some(s => s.master_service_id === service.id);

    if (isSelected) {
      const { error } = await supabase
        .from('clinic_services')
        .delete()
        .eq('clinic_id', selectedClinicId)
        .eq('master_service_id', service.id);

      if (!error) {
        setClinicServices(clinicServices.filter(s => s.master_service_id !== service.id));
      }
    } else {
      const newService = {
        clinic_id: selectedClinicId,
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

  const handlePriceChange = (masterServiceId, newPrice) => {
    setClinicServices(clinicServices.map(s => 
      s.master_service_id === masterServiceId ? { ...s, price: newPrice } : s
    ));
  };

  const handleSavePrice = async (masterServiceId, price) => {
    await supabase
      .from('clinic_services')
      .update({ price: parseFloat(price) || 0 })
      .eq('clinic_id', selectedClinicId)
      .eq('master_service_id', masterServiceId);
  };

  const filteredMaster = masterServices.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Stethoscope className="text-blue-600" /> จัดการบริการคลินิก (เปิด-ปิด / กำหนดราคา)
          </h1>
          <p className="text-xs text-slate-500">
            {isAdmin ? 'โหมดผู้ดูแลระบบกลาง: สามารถเลือกสลับสาขาเพื่อตรวจสอบและแก้ไขได้' : 'เลือกบริการมาตรฐานเข้าคลินิกของคุณ'}
          </p>
        </div>

        {/* ถ้าเป็น Admin ให้มี Dropdown เลือกสาขาคลินิก */}
        {isAdmin && (
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <Building2 size={16} className="text-blue-600 ml-1" />
            <select
              value={selectedClinicId}
              onChange={(e) => setSelectedClinicId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none pr-2"
            >
              {clinics.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.area})
                </option>
              ))}
            </select>
          </div>
        )}

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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">กำลังโหลดรายการบริการ...</div>
        ) : (
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
                const activeClinicService = clinicServices.find(s => s.master_service_id === item.id);
                const isSelected = !!activeClinicService;

                return (
                  <tr key={item.id} className={`hover:bg-slate-50/50 ${isSelected ? 'bg-blue-50/30' : ''}`}>
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleService(item)}
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
                            onChange={(e) => handlePriceChange(item.id, e.target.value)}
                            onBlur={(e) => handleSavePrice(item.id, e.target.value)}
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
        )}
      </div>
    </div>
  );
}