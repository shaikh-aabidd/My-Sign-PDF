import React from 'react';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';

const Footer = () => (
  <footer className="bg-primary text-white">
    <div className="container mx-auto px-6 py-10">
      {/* Social Connect Section */}
      <div className="flex flex-col md:flex-row items-center justify-center mb-8">
        <span className="text-lg font-semibold mr-4 mb-4 md:mb-0">Get connected with us:</span>
        <div className="flex space-x-6">
          <a href="#" className="hover:text-gray-400"><FaFacebookF /></a>
          <a href="#" className="hover:text-gray-400"><FaTwitter /></a>
          <a href="#" className="hover:text-gray-400"><FaInstagram /></a>
          <a href="#" className="hover:text-gray-400"><FaLinkedinIn /></a>
        </div>
      </div>

      {/* Link Sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-center md:text-left">
        {/* About Us */}
        <div>
          <h6 className="uppercase font-semibold mb-4">About Us</h6>
          <ul className="space-y-2">
            <li><a href="#" className="hover:underline">Company</a></li>
            <li><a href="#" className="hover:underline">Team</a></li>
            <li><a href="#" className="hover:underline">Careers</a></li>
          </ul>
        </div>

        {/* Useful Links */}
        <div>
          <h6 className="uppercase font-semibold mb-4">Useful Links</h6>
          <ul className="space-y-2">
            <li><a href="#" className="hover:underline">FAQ</a></li>
            <li><a href="#" className="hover:underline">Help Center</a></li>
            <li><a href="#" className="hover:underline">Privacy Policy</a></li>
          </ul>
        </div>

      </div>

      {/* Copyright */}
      <div className="mt-10 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} FitTailor. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
