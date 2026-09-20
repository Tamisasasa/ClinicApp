import React from 'react';

export default function Promotions() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Latest Offers & Deals</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-orange-400 to-pink-500 text-white p-6 rounded-2xl shadow-md space-y-2">
          <span className="bg-white/20 px-2 py-1 rounded text-xs">20% OFF</span>
          <h2 className="text-xl font-bold">Annual Vaccination Package</h2>
          <p className="text-xs opacity-90">Valid for dogs and cats at participating clinics.</p>
        </div>
      </div>
    </div>
  );
}