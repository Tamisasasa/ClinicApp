import { supabase } from '../supabaseClient'; // ปรับ Path ตามโครงสร้างโฟลเดอร์ของคุณ

// ==========================================
// 1. Clinic APIs (UC49 - UC53)
// ==========================================
export const fetchClinics = async (params = {}) => {
  let query = supabase.from('clinics').select('*');
  
  if (params.status) {
    query = query.eq('status', params.status);
  }
  if (params.search) {
    query = query.ilike('name', `%${params.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return { data };
};

export const fetchClinicById = async (id) => {
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return { data };
};

// ==========================================
// 2. Pet APIs
// ==========================================
export const fetchUserPets = async (userId) => {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return { data };
};

export const addPet = async (petData) => {
  const { data, error } = await supabase
    .from('pets')
    .insert([petData])
    .select();

  if (error) throw error;
  return { data };
};

// ==========================================
// 3. Booking APIs (UC64)
// ==========================================
export const createBooking = async (bookingData) => {
  const { data, error } = await supabase
    .from('bookings')
    .insert([bookingData])
    .select();

  if (error) throw error;
  return { data };
};

export const fetchUserBookings = async (userId) => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, clinics(name), pets(name)')
    .eq('user_id', userId);

  if (error) throw error;
  return { data };
};

export const updateBookingStatus = async (id, status) => {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)
    .select();

  if (error) throw error;
  return { data };
};