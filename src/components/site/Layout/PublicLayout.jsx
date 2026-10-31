// src/components/site/Layout/PublicLayout.jsx
import React from 'react';
import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';

const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ✅ Navbar fixed — toujours rendu, connecté ou non */}
      <PublicNavbar />

      {/* ✅ pt-14 md:pt-16 compense la hauteur de la navbar fixed (h-14 / h-16) */}
      <main className="flex-1 pt-14 md:pt-16">
        {children}
      </main>

      <PublicFooter />
    </div>
  );
};

export default PublicLayout;