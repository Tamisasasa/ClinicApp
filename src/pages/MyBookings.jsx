import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserBookings, updateBookingStatus } from '../services/api';

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (user) loadBookings();
  }, [user]);

  const loadBookings = async () => {
    const res = await fetchUserBookings(user.id);
    setBookings(res.data);
  };

  const handleCancel = async (id) => {
    await updateBookingStatus(id, 'CANCELLED');
    loadBookings();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">My Appointments</h1>
      <div className="space-y-4">
        {bookings.map((b) => (
          <div key={b.id} className="bg-white p-5 rounded-2xl border shadow-sm flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800">{b.clinics?.name}</h3>
              <p className="text-xs text-slate-500">Pet: {b.pets?.name} | Service: {b.services?.name}</p>
              <p className="text-xs text-blue-600 font-semibold mt-1">{b.booking_date} @ {b.booking_time}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                b.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
              }`}>
                {b.status}
              </span>
              {b.status === 'PENDING' && (
                <button onClick={() => handleCancel(b.id)} className="text-xs text-red-500 hover:underline">
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}