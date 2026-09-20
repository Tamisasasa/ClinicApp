import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// ตั้งค่า Supabase Client (ปรับตามการตั้งค่าของคุณ)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wzmzyuttbggvngvmnuvk.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // Custom Login (admins / clinics ตาราง) ที่ LoginModal เซฟไว้ใน localStorage
  // ==========================================
  const getLocalUser = () => {
    try {
      const raw = localStorage.getItem('currentClinic');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // ต้องมี role เป็น ADMIN หรือ STAFF เท่านั้นถึงจะถือว่าเป็น custom login
      if (parsed?.role === 'ADMIN' || parsed?.role === 'STAFF') {
        return parsed;
      }
      return null;
    } catch (err) {
      console.error('Failed to parse currentClinic from localStorage:', err);
      return null;
    }
  };

  // ฟังก์ชันดึงข้อมูล Profile เพิ่มเติม ( Role, Name ฯลฯ ) สำหรับ Supabase Auth ปกติ
  const fetchUserProfile = async (authUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error.message);
      }

      // รวมข้อมูล Auth User + Profiles Role
      const userData = {
        ...authUser,
        role: profile?.role || 'CUSTOMER',
        ...profile,
      };

      setUser(userData);
    } catch (err) {
      console.error('Profile fetch catch error:', err);
      setUser(authUser);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 0. เช็ค Custom Login (admin/staff) จาก localStorage ก่อนเป็นอันดับแรก
    //    เพราะระบบนี้ไม่ได้ผูกกับ Supabase Auth session เลย
    const localUser = getLocalUser();
    if (localUser) {
      setUser(localUser);
      setLoading(false);
      return; // มี custom login แล้ว ไม่ต้องเช็ค Supabase session ต่อ
    }

    // 1. ตรวจสอบ Session ปกติเมื่อโหลดแอปครั้งแรก (ลูกค้าทั่วไปที่ใช้ Supabase Auth)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // 2. ติดตามการเปลี่ยนแปลง Auth State (Login / Logout) ของ Supabase Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // ถ้ามี custom login ค้างอยู่ ไม่ต้อง override ด้วย Supabase session
      if (getLocalUser()) return;

      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ฟังก์ชัน Login ปกติผ่าน Supabase Auth (ลูกค้าทั่วไป)
  const login = async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoading(false);
      throw error;
    }

    if (data?.user) {
      await fetchUserProfile(data.user);
    }
    return data;
  };

  // ฟังก์ชัน Login สำหรับ Custom Login (admin/staff จากตาราง admins/clinics)
  // ให้ LoginModal เรียกใช้แทนการ set localStorage ตรง ๆ แล้ว window.location.href
  const loginWithLocalUser = (sessionData) => {
    localStorage.setItem('currentClinic', JSON.stringify(sessionData));
    localStorage.setItem('user', JSON.stringify(sessionData));
    setUser(sessionData);
  };

  // ฟังก์ชัน Logout รองรับทั้ง 2 ระบบ
  const logout = async () => {
    setLoading(true);

    // เคลียร์ custom login
    localStorage.removeItem('currentClinic');
    localStorage.removeItem('user');

    // เคลียร์ Supabase session (เผื่อเป็นลูกค้าทั่วไป)
    await supabase.auth.signOut();

    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, loginWithLocalUser, supabase }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);