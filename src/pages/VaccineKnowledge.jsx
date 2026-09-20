import React from 'react';

export default function VaccineKnowledge() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Pet Vaccination Guidelines</h1>
      <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
        <h2 className="font-bold text-lg text-blue-900">Dog Vaccination Schedule</h2>
        <ul className="list-disc pl-5 text-sm space-y-2 text-slate-600">
          <li><strong>6-8 Weeks:</strong> DHPP (Distemper, Hepatitis, Parvovirus, Parainfluenza)</li>
          <li><strong>10-12 Weeks:</strong> DHPP Booster + Leptospirosis</li>
          <li><strong>14-16 Weeks:</strong> Rabies + DHPP Booster</li>
          <li><strong>Annually:</strong> Rabies & DHPP Boosters</li>
        </ul>
      </div>
    </div>
  );
}