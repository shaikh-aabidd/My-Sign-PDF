// src/components/Header.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LogoutButton from './LogoutButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons';

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const role = user?.role;

  const navItems = [
    { name: 'Home',    to: '/',           auth: 'auth'       },
    { name: 'Profile', to: '/profile',    auth: 'auth'       },
    // Admin-only:
    { name: 'Manage Users',    to: '/AdminUserRolePage', auth: 'auth', adminOnly: true },
    { name: 'Login',   to: '/login',      auth: 'unauth'     },
  ];

  const visibleItems = navItems.filter(item => {
    // must match auth requirement
    const okAuth = item.auth === 'both'
      || (isAuthenticated && item.auth === 'auth')
      || (!isAuthenticated && item.auth === 'unauth');

    // if marked adminOnly, user must be admin
    if (item.adminOnly) {
      return okAuth && role === 'admin';
    }
    return okAuth;
  });

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold">DIGISIGN</Link>
        
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-6">
          {visibleItems.map(item => (
            <Link key={item.name} to={item.to} className="hover:underline">
              {item.name}
            </Link>
          ))}
          {isAuthenticated && <LogoutButton />}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 focus:outline-none"
          onClick={() => setMobileOpen(o => !o)}
        >
          <FontAwesomeIcon icon={mobileOpen ? faXmark : faBars} size="lg" />
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <nav className="md:hidden bg-primary">
          <ul className="flex flex-col space-y-2 px-4 pb-4">
            {visibleItems.map(item => (
              <li key={item.name}>
                <Link
                  to={item.to}
                  className="block py-2 hover:underline"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.name}
                </Link>
              </li>
            ))}
            {isAuthenticated && (
              <li>
                <LogoutButton />
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
};

export default Header;
