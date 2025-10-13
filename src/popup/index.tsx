import React from 'react';
import '../styles/global.css';

function IndexPopup() {
  return (
    <div className="w-96 p-6 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-linkedin-blue">Colder</h1>
        <p className="text-sm text-gray-500">v0.0.1</p>
      </div>

      <div className="space-y-4">
        <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-600">
            Navigate to a LinkedIn profile to get started
          </p>
        </div>

        <button className="btn-primary w-full">
          Analyze Profile
        </button>
      </div>
    </div>
  );
}

export default IndexPopup;
