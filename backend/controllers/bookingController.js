const supabase = require('../config/supabase');

exports.createBooking = async (req, res, next) => {
  try {
    const { user_id, clinic_id, pet_id, service_id, booking_date, booking_time, notes } = req.body;
    
    const { data, error } = await supabase.from('bookings').insert([{
      user_id, clinic_id, pet_id, service_id, booking_date, booking_time, notes, status: 'PENDING'
    }]).select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    next(err);
  }
};

exports.getUserBookings = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabase
      .from('bookings')
      .select('*, clinics(name, address), pets(name), services(name, price)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    next(err);
  }
};