import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        isHome
          ? 'bg-[#FAFAFC] text-[#17152B] selection:bg-purple-600 selection:text-white'
          : 'bg-slate-950 text-slate-100 selection:bg-brand-500 selection:text-white'
      }`}
    >
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
