import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

export default function ClinicMap({ clinics, onSelectClinic }) {
  const defaultCenter = [13.7563, 100.5018]; // Bangkok

  return (
    <div className="h-[320px] w-full rounded-2xl overflow-hidden shadow-2xl relative z-0">
      <MapContainer center={defaultCenter} zoom={12} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {clinics.map((clinic) => (
          <Marker 
            key={clinic.id} 
            position={[clinic.lat, clinic.lng]}
          >
            <Popup>
              <div className="p-1">
                <h3 className="font-bold text-base">{clinic.name}</h3>
                <p className="text-xs text-gray-600 mb-2">{clinic.address}</p>
                <button
                  onClick={() => onSelectClinic(clinic.id)}
                  className="bg-blue-600 text-white text-xs px-3 py-1 rounded-md hover:bg-blue-700 w-full"
                >
                  View Details & Book
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}