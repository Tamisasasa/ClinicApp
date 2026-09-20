const supabase = require('../config/supabase');

exports.getClinics = async (req, res, next) => {
  try {
    const { area, service } = req.query;
    let query = supabase.from('clinics').select('*, services(*)');

    if (area) query = query.eq('area', area);
    if (service) query = query.eq('services.category', service);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.getClinicById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('clinics')
      .select('*, services(*), operating_hours(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};