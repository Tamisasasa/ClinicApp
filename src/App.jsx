import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import ClinicSearch from './pages/ClinicSearch';
import ClinicDetail from './pages/ClinicDetail';
import BookingWizard from './pages/BookingWizard';
import MyBookings from './pages/MyBookings';
import PetManagement from './pages/PetManagement';
import StaffDashboard from './pages/StaffDashboard';
import ClinicSchedule from './pages/ClinicSchedule';
import VaccineKnowledge from './pages/VaccineKnowledge';
import Promotions from './pages/Promotions';
import AdminDashboard from './pages/AdminDashboard';
import AdminClinics from './pages/AdminClinics';
import StaffStaffManagement from './pages/StaffStaffManagement.jsx';
import StaffLeaveStats from './pages/StaffLeaveStats';
import DoctorSchedule from './pages/DoctorSchedule';

// Component สำหรับป้องกันเฉพาะ Staff / Admin (รองรับระบบ Custom Clinic Login แล้ว)
const StaffRoute = ({ children }) => {
  // 1. เช็คดึงข้อมูลจาก localStorage ที่เราเซฟไว้ตอนล็อกอิน (เพื่อให้ผ่านแดชบอร์ดได้ทันที)
  const localClinic = localStorage.getItem('currentClinic');
  if (localClinic) {
    return children;
  }

  // 2. ถ้าไม่มีข้อมูล Custom Login ให้เช็คระบบ Auth ปกติของโปรเจกต์
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p className="text-slate-500 font-medium">Loading session...</p>
      </div>
    );
  }

  if (!user || (user.role !== 'STAFF' && user.role !== 'ADMIN')) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// SafeRoute สำหรับหน้าทั่วไปชั่วคราว
const SafeRoute = ({ children }) => {
  return children;
};

function AppRoutes() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/clinics" element={<ClinicSearch />} />
          <Route path="/clinic/:id" element={<ClinicDetail />} />
          <Route path="/vaccines" element={<VaccineKnowledge />} />
          <Route path="/promotions" element={<Promotions />} />

          <Route path="/book/:clinicId" element={<SafeRoute><BookingWizard /></SafeRoute>} />
          <Route path="/my-bookings" element={<SafeRoute><MyBookings /></SafeRoute>} />
          <Route path="/my-pets" element={<SafeRoute><PetManagement /></SafeRoute>} />

          {/* Staff Dashboard (หน้าภาพรวมแดชบอร์ด) */}
          <Route
            path="/staff/dashboard"
            element={
              <StaffRoute>
                <StaffDashboard />
              </StaffRoute>
            }
          />

          {/* Clinic Schedule (หน้าตั้งค่าวันเวลาเปิด-ปิด แยกต่างหาก) */}
          <Route
            path="/staff/schedule"
            element={
              <StaffRoute>
                <ClinicSchedule />
              </StaffRoute>
            }
          />
          <Route
            path="/staff/leaves"
            element={
              <StaffRoute>
                <StaffLeaveStats />
              </StaffRoute>
            }
          />
          <Route
            path="/staff/doctors-schedule"
            element={
              <StaffRoute>
                <DoctorSchedule />
              </StaffRoute>
            }
          />
          <Route
            path="/staff/staff-management"
            element={
              <StaffRoute>
                <StaffStaffManagement />
              </StaffRoute>
            }
          />

          <Route path="/admin/dashboard" element={<SafeRoute><AdminDashboard /></SafeRoute>} />
          <Route path="/admin/clinics" element={<SafeRoute><AdminClinics /></SafeRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}