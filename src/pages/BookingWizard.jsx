import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchClinicById, fetchUserPets, createBooking } from '../services/api';

export default function BookingWizard() {
  const { clinicId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [clinic, setClinic] = useState(null);
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState('');
  const [selectedService, setSelectedService] = useState(searchParams.get('serviceId') || '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');

  useEffect(() => {
    fetchClinicById(clinicId).then(res => setClinic(res.data));
    if (user) fetchUserPets(user.id).then(res => setPets(res.data));
  }, [clinicId, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createBooking({
        user_id: user.id,
        clinic_id: clinicId,
        pet_id: selectedPet,
        service_id: selectedService,
        booking_date: date,
        booking_time: time,
      });
      navigate('/my-bookings');
    } catch (err) {
      alert('Booking failed. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-6">
        <h1 className="text-xl font-bold">Book Appointment - {clinic?.name}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600">Select Pet</label>
            <select required className="w-full mt-1 border p-2 rounded-lg text-sm" value={selectedPet} onChange={e => setSelectedPet(e.target.value)}>
              <option value="">-- Choose Pet --</option>
              {pets.map(p => <option key={p.id} value={p.id}>{p.name} ({p.species})</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600">Select Service</label>
            <select required className="w-full mt-1 border p-2 rounded-lg text-sm" value={selectedService} onChange={e => setSelectedService(e.target.value)}>
              <option value="">-- Choose Service --</option>
              {clinic?.services?.map(s => <option key={s.id} value={s.id}>{s.name} - ฿{s.price}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600">Date</label>
              <input required type="date" className="w-full mt-1 border p-2 rounded-lg text-sm" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Time</label>
              <input required type="time" className="w-full mt-1 border p-2 rounded-lg text-sm" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg text-sm hover:bg-blue-700">
            Confirm Booking
          </button>
        </form>
      </div>
    </div>
  );
}