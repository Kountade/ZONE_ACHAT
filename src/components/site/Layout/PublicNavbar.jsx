// src/components/site/Layout/PublicNavbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Building2, 
  Menu, 
  X, 
  ChevronDown,
  Home,
  Info,
  Briefcase,
  Mail,
  BookOpen,
  LogIn,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  Store,
  CalendarDays,
  Image,
  UserCog
} from 'lucide-react';

import axiosInstance from '../../AxiosInstance'; // ⚠️ Ajuste le chemin selon ton arborescence

const PublicNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null);

  // ✅ État établissement (comme dans Navbar.jsx)
  const [etablissement, setEtablissement] = useState(null);
  const [loadingEtab, setLoadingEtab] = useState(true);
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setDropdownOpen(false);
  }, [location]);

  // ============================================================
  // ✅ Fonction utilitaire pour construire l'URL du logo
  // ============================================================
  const getLogoUrl = (logoPath) => {
    if (!logoPath) return null;
    if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) return logoPath;
    const baseURL = axiosInstance.defaults.baseURL || '';
    return `${baseURL}${logoPath.startsWith('/') ? '' : '/'}${logoPath}`;
  };

  // ============================================================
  // ✅ Chargement de l'établissement (nom + sigle + logo)
  // ============================================================
  useEffect(() => {
    const fetchEtablissement = async () => {
      try {
        const response = await axiosInstance.get('/etablissements/unique/');
        if (response.data) {
          setEtablissement(response.data);
          if (response.data.logo) setLogoUrl(getLogoUrl(response.data.logo));
        }
      } catch (e) {
        console.error('Erreur établissement:', e);
      } finally {
        setLoadingEtab(false);
      }
    };
    fetchEtablissement();
  }, []);

  // ============================================================
  // ✅ Valeurs dynamiques avec fallback
  // ============================================================
  const nomEtablissement = !loadingEtab && etablissement?.nom
    ? etablissement.nom
    : 'ZonACha';
  const sigleEtablissement = !loadingEtab && etablissement?.sigle
    ? etablissement.sigle
    : 'Zone Achat ERP';

  // Gestion du hover avec délai
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 150);
  };

  const navLinks = [
    { to: '/', label: 'Accueil', icon: Home },
    { to: '/about', label: 'À propos', icon: Info },
    { to: '/services', label: 'Services', icon: Briefcase },
    { to: '/blog', label: 'Blog', icon: BookOpen },
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
        <div className="flex justify-between items-center h-14 md:h-16">
          
          {/* ===== LOGO ===== */}
          <Link 
            to="/" 
            className="flex items-center gap-2 group relative"
          >
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              
              {/* ✅ LOGO DYNAMIQUE DE L'ENTREPRISE */}
              <div className="relative w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-md border-2 border-accent/30 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                {!loadingEtab && logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={nomEtablissement || 'Logo entreprise'}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <Building2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
                )}
              </div>
            </div>
            <div className="hidden sm:block">
              {/* ✅ NOM DYNAMIQUE DE L'ENTREPRISE */}
              <h1 className="text-sm md:text-base font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent leading-tight truncate max-w-[180px]">
                {loadingEtab ? 'Chargement...' : nomEtablissement}
              </h1>
              {/* ✅ SIGLE DYNAMIQUE */}
              <p className="text-[8px] md:text-[9px] text-gray-400 font-medium tracking-[0.2em] uppercase leading-none truncate max-w-[180px]">
                {loadingEtab ? '' : sigleEtablissement}
              </p>
            </div>
          </Link>

          {/* ===== DESKTOP MENU ===== */}
          <div className="hidden lg:flex items-center gap-0.5">
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
                    ${active 
                      ? 'text-primary' 
                      : 'text-gray-600 hover:text-primary'
                    }
                  `}
                >
                  <span className={`
                    absolute inset-0 rounded-lg transition-all duration-300
                    ${active 
                      ? 'bg-primary/10' 
                      : 'bg-primary/0 group-hover:bg-primary/5'
                    }
                  `}></span>
                  
                  <span className={`
                    absolute bottom-0 left-1/2 h-[2px] bg-gradient-to-r from-primary to-secondary 
                    transition-all duration-300 ease-out
                    ${active 
                      ? 'w-full -translate-x-1/2' 
                      : 'w-0 group-hover:w-full -translate-x-1/2'
                    }
                  `}></span>

                  <span className="relative flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110 ${active ? 'text-primary' : ''}`} />
                    {link.label}
                  </span>
                </Link>
              );
            })}

            {/* ===== DROPDOWN ENTREPRISE ===== */}
            <div 
              ref={dropdownRef}
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={`
                  relative px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all duration-300
                  group overflow-hidden
                  ${dropdownOpen 
                    ? 'text-primary bg-primary/5' 
                    : 'text-gray-600 hover:text-primary'
                  }
                `}
              >
                <span className={`
                  absolute inset-0 rounded-lg transition-all duration-300
                  ${dropdownOpen ? 'bg-primary/5' : 'bg-primary/0 group-hover:bg-primary/5'}
                `}></span>
                
                <span className={`
                  absolute bottom-0 left-1/2 h-[2px] bg-gradient-to-r from-primary to-secondary 
                  transition-all duration-300 ease-out
                  ${dropdownOpen 
                    ? 'w-full -translate-x-1/2' 
                    : 'w-0 group-hover:w-full -translate-x-1/2'
                  }
                `}></span>

                <span className="relative flex items-center gap-1.5">
                  <Sparkles className={`w-3.5 h-3.5 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  Entreprise
                  <ChevronDown className={`w-3.5 h-3.5 transition-all duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </span>
              </button>

              {dropdownOpen && (
                <div 
                  className="absolute top-10 left-0 w-56 bg-white rounded-xl shadow-2xl border border-gray-100/50 py-1.5 z-50 overflow-hidden"
                  onMouseEnter={() => {
                    if (timeoutRef.current) {
                      clearTimeout(timeoutRef.current);
                      timeoutRef.current = null;
                    }
                    setDropdownOpen(true);
                  }}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="h-0.5 bg-gradient-to-r from-primary via-secondary to-primary/50"></div>
                  
                  <Link 
                    to="/about" 
                    className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5 transition-all duration-200 group"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Store className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800">À propos</p>
                      <p className="text-[10px] text-gray-400">Découvrez notre agence</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 ml-auto group-hover:translate-x-1 transition-transform" />
                  </Link>
                  
                  <Link 
                    to="/services" 
                    className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5 transition-all duration-200 group"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Briefcase className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800">Services</p>
                      <p className="text-[10px] text-gray-400">Nos prestations</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 ml-auto group-hover:translate-x-1 transition-transform" />
                  </Link>
                  
                  <Link 
                    to="/events" 
                    className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5 transition-all duration-200 group"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <CalendarDays className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800">Événements</p>
                      <p className="text-[10px] text-gray-400">Nos actualités</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 ml-auto group-hover:translate-x-1 transition-transform" />
                  </Link>
                  
                  <Link 
                    to="/gallery" 
                    className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5 transition-all duration-200 group"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Image className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800">Galerie</p>
                      <p className="text-[10px] text-gray-400">Nos réalisations</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 ml-auto group-hover:translate-x-1 transition-transform" />
                  </Link>
                  
                  <Link 
                    to="/team" 
                    className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5 transition-all duration-200 group"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UserCog className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800">Notre Équipe</p>
                      <p className="text-[10px] text-gray-400">Professionnels dévoués</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 ml-auto group-hover:translate-x-1 transition-transform" />
                  </Link>
                  
                  <div className="border-t border-gray-100 my-1"></div>
                  
                  <Link 
                    to="/contact" 
                    className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5 transition-all duration-200 group"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800">Nous contacter</p>
                      <p className="text-[10px] text-gray-400">+221 77 123 45 67</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 ml-auto group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              )}
            </div>

            {/* ===== BOUTON CONNEXION ===== */}
            <div className="flex items-center gap-2 ml-3 pl-3 border-l border-gray-200/50">
              <Link 
                to="/login" 
                className="relative px-4 py-1.5 rounded-lg font-medium text-xs md:text-sm text-white bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 flex items-center gap-1.5 group"
              >
                <LogIn className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                Connexion
                <span className="absolute inset-0 rounded-lg bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></span>
              </Link>
            </div>
          </div>

          {/* ===== MOBILE BUTTON ===== */}
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
                    ${active 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-gray-600 hover:bg-primary/5 hover:text-primary'
                    }
                  `}
                  onClick={() => setIsOpen(false)}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    active ? 'bg-primary/20' : 'bg-gray-100 group-hover:bg-primary/10'
                  }`}>
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-primary' : ''}`} />
                  </div>
                  {link.label}
                  {active && (
                    <span className="ml-auto w-1 h-6 rounded-full bg-primary"></span>
                  )}
                </Link>
              );
            })}

            <div className="border-t border-gray-100 my-2"></div>

            {/* Menu Entreprise mobile */}
            <div className="pl-2 space-y-0.5">
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-1.5">
                Entreprise
              </p>
              <Link 
                to="/about" 
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-primary/5 hover:text-primary transition-all duration-300"
                onClick={() => setIsOpen(false)}
              >
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Store className="w-3.5 h-3.5 text-primary" />
                </div>
                À propos
              </Link>
              <Link 
                to="/services" 
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-primary/5 hover:text-primary transition-all duration-300"
                onClick={() => setIsOpen(false)}
              >
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Briefcase className="w-3.5 h-3.5 text-primary" />
                </div>
                Services
              </Link>
              <Link 
                to="/events" 
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-primary/5 hover:text-primary transition-all duration-300"
                onClick={() => setIsOpen(false)}
              >
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CalendarDays className="w-3.5 h-3.5 text-primary" />
                </div>
                Événements
              </Link>
              <Link 
                to="/gallery" 
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-primary/5 hover:text-primary transition-all duration-300"
                onClick={() => setIsOpen(false)}
              >
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Image className="w-3.5 h-3.5 text-primary" />
                </div>
                Galerie
              </Link>
              <Link 
                to="/team" 
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-primary/5 hover:text-primary transition-all duration-300"
                onClick={() => setIsOpen(false)}
              >
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <UserCog className="w-3.5 h-3.5 text-primary" />
                </div>
                Notre Équipe
              </Link>
            </div>

            <div className="border-t border-gray-100 my-2"></div>

            {/* Bouton connexion mobile */}
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

            {/* Contact info */}
            <div className="px-3 pt-3 pb-1 flex flex-wrap gap-3 text-[10px] text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Lun-Ven: 8h-18h</span>
              </div>
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>+221 77 123 45 67</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>Dakar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PublicNavbar;