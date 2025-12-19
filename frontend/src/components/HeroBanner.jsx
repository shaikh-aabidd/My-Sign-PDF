import React from 'react';
import { Link } from 'react-router-dom';

const HeroBanner = () => (
  <section className="relative bg-cover bg-center h-96" style={{ backgroundImage: "url('images/heroBanner.png')" }}>
    <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-4xl md:text-6xl font-display text-white mb-4">Find Your Perfect Fit</h1>
      <p className="text-lg md:text-2xl text-gray-200 mb-6">Ready-made or fully bespoke—tailored just for you.</p>
      <div className="flex space-x-4">
        <Link to="/products" className="px-6 py-3 bg-transparentBtn2 text-white  font-semibold hover:bg-primary transition">
          Shop Ready-Made
        </Link>
        <Link to="/customize" className="px-6 py-3 bg-transparentBtn1 text-white font-semibold hover:bg-green-800 transition">
          Customize Yours
        </Link>
      </div>
    </div>
  </section>
);

export default HeroBanner;