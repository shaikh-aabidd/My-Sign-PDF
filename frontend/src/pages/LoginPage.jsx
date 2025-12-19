// src/pages/AuthPage.jsx
import React, { useState } from 'react';
import Login from '../components/Login';
import Signup from '../components/Signup';
// import { ReactComponent as ShieldIcon } from '../assets/lrKl8d01.svg?component';
// import { ReactComponent as AuditIcon } from '../assets/lrKl8d01.svg?component';
// import { ReactComponent as CloudIcon } from '../assets/lrKl8d01.svg?component';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'

  return (
    <div className="min-h-screen flex">
      {/* Left Banner */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-50 to-white p-12 flex-col justify-center">
        <h1 className="text-5xl font-semibold mb-6">Sign PDFs Anywhere</h1>
        <p className="mb-10 text-lg text-gray-600">
          Fast, secure, and audit‑tracked e‑signatures in your browser.
        </p>
        <ul className="space-y-6">
          <li className="flex items-center space-x-3">
            {/* <ShieldIcon className="w-8 h-8 text-blue-500" /> */}
            <span className="text-lg font-medium">Secure & Encrypted</span>
          </li>
          <li className="flex items-center space-x-3">
            {/* <AuditIcon className="w-8 h-8 text-blue-500" /> */}
            <span className="text-lg font-medium">Audit‑Ready</span>
          </li>
          <li className="flex items-center space-x-3">
            {/* <CloudIcon className="w-8 h-8 text-blue-500" /> */}
            <span className="text-lg font-medium">Cloud‑Hosted</span>
          </li>
        </ul>
      </div>

      {/* Auth Form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-24">
        {/* Mode Toggle */}
        <div className="flex mb-8 w-full max-w-md mx-auto border-b-2 border-gray-200">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-center font-medium ${
              mode === 'login' ? 'border-b-4 border-blue-500 text-blue-600' : 'text-gray-500'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 text-center font-medium ${
              mode === 'signup' ? 'border-b-4 border-blue-500 text-blue-600' : 'text-gray-500'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form Component */}
        <div className="w-full max-w-md mx-auto">
          {mode === 'login' ? <Login /> : <Signup />}
        </div>
      </div>
    </div>
  );
}
