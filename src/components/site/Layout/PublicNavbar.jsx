// src/components/site/Layout/PublicNavbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Home,
  Info,
  Briefcase,
  Mail,
  LogIn,
  Phone,
  MapPin,
  Clock,
  Package
} from 'lucide-react';

import axiosInstance from '../../AxiosInstance'; // ⚠️ Ajuste le chemin

const PublicNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const [etablissement, setEtablissement] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const getLogoUrl = (logoPath) => {
    if (!logoPath) return null;
    try {
      if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) return logoPath;
      const baseURL = axiosInstance?.defaults?.baseURL || '';
      return `${baseURL}${logoPath.startsWith('/') ? '' : '/'}${logoPath}`;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let cancelled = false;
    const fetchEtablissement = async () => {
      try {
        const response = await axiosInstance.get('/etablissements/unique/');
        if (!cancelled && response?.data) {
          setEtablissement(response.data);
          if (response.data.logo) {
            setLogoUrl(getLogoUrl(response.data.logo));
            setLogoError(false);
          }
        }
      } catch (e) {
        console.warn('Établissement non chargé, fallback StockAcha utilisé.');
      }
    };
    fetchEtablissement();
    return () => { cancelled = true; };
  }, []);

  const nomEtablissement = etablissement?.nom || 'StockAcha';
  const sigleEtablissement = etablissement?.sigle || 'Votre stock, notre logistique';
  const showLogoImage = Boolean(logoUrl) && !logoError;

  const navLinks = [
    { to: '/', label: 'Accueil', icon: Home },
    { to: '/about', label: 'À propos', icon: Info },
    { to: '/services', label: 'Services', icon: Briefcase },
    { to: '/contact', label: 'Contact', icon: Mail }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-100/50'
          : 'bg-white/90 backdrop-blur-sm shadow-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ✅ GRILLE 3 COLONNES : Logo | Menu centré | Connexion */}
        <div className="grid grid-cols-3 items-center h-14 md:h-16">

          {/* ===== COLONNE 1 — LOGO (à gauche) ===== */}
          <div className="flex items-center justify-start">
            <Link to="/" className="flex items-center gap-2 group relative">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

                <div className="relative w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-md border-2 border-accent/30 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                  {showLogoImage ? (
                    <img
                      src={logoUrl}
                      alt={nomEtablissement}
                      className="w-full h-full object-cover rounded-lg"
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <Package className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  )}
                </div>
              </div>

              <div className="hidden sm:block">
                <h1 className="text-sm md:text-base font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent leading-tight truncate max-w-[180px]">
                  {nomEtablissement}
                </h1>
                <p className="text-[8px] md:text-[9px] text-gray-400 font-medium tracking-[0.2em] uppercase leading-none truncate max-w-[180px]">
                  {sigleEtablissement}
                </p>
              </div>
            </Link>
          </div>

          {/* ===== COLONNE 2 — MENU CENTRÉ ===== */}
          <div className="hidden lg:flex items-center justify-center gap-0.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`
                    relative px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all duration-300
                    group overflow-hidden
                    ${active ? 'text-primary' : 'text-gray-600 hover:text-primary'}
                  `}
                >
                  <span className={`
                    absolute inset-0 rounded-lg transition-all duration-300
                    ${active ? 'bg-primary/10' : 'bg-primary/0 group-hover:bg-primary/5'}
                  `}></span>

                  <span className={`
                    absolute bottom-0 left-1/2 h-[2px] bg-gradient-to-r from-primary to-secondary
                    transition-all duration-300 ease-out
                    ${active ? 'w-full -translate-x-1/2' : 'w-0 group-hover:w-full -translate-x-1/2'}
                  `}></span>

                  <span className="relative flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110 ${active ? 'text-primary' : ''}`} />
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* ===== COLONNE 3 — CONNEXION (à droite) + MOBILE BUTTON ===== */}
          <div className="flex items-center justify-end gap-2">

            {/* ✅ Bouton Connexion — desktop → /login */}
            <Link
              to="/login"
              className="hidden lg:inline-flex relative px-4 py-1.5 rounded-lg font-medium text-xs md:text-sm text-white bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 items-center gap-1.5 group"
            >
              <LogIn className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
              Connexion
              <span className="absolute inset-0 rounded-lg bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></span>
            </Link>

            {/* Bouton mobile */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden relative w-8 h-8 rounded-lg hover:bg-gray-100 transition-all duration-300 flex items-center justify-center group"
              aria-label="Menu"
            >
              <span className="absolute inset-0 rounded-lg bg-primary/0 group-hover:bg-primary/5 transition-colors"></span>
              {isOpen ? (
                <X className="w-5 h-5 text-gray-700 relative z-10 transition-transform duration-300 rotate-90" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700 relative z-10 transition-transform duration-300" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ===== MOBILE MENU ===== */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-500 ease-in-out ${
          isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-white border-t border-gray-100/50 shadow-inner">
          <div className="h-0.5 bg-gradient-to-r from-primary via-secondary to-primary/50"></div>

          <div className="px-4 py-3 space-y-0.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300
                    ${active ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-primary/5 hover:text-primary'}
                  `}
                  onClick={() => setIsOpen(false)}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    active ? 'bg-primary/20' : 'bg-gray-100 group-hover:bg-primary/10'
                  }`}>
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-primary' : ''}`} />
                  </div>
                  {link.label}
                  {active && <span className="ml-auto w-1 h-6 rounded-full bg-primary"></span>}
                </Link>
              );
            })}

            <div className="border-t border-gray-100 my-2"></div>

            {/* ✅ Bouton Connexion mobile → /login */}
            <div className="px-3 pt-2">
              <Link
                to="/login"
                className="btn btn-primary w-full gap-2 text-sm"
                onClick={() => setIsOpen(false)}
              >
                <LogIn className="w-4 h-4" />
                Connexion
              </Link>
            </div>

            <div className="px-3 pt-3 pb-1 flex flex-wrap gap-3 text-[10px] text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Lun-Ven: 8h-18h</span>
              </div>
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>+225 XX XX XX XX XX</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>Abidjan</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PublicNavbar;