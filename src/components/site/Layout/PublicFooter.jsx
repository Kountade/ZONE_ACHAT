// src/components/site/Layout/PublicFooter.jsx - Version DaisyUI légère
import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Mail, Phone, MapPin, Clock, ChevronRight } from 'lucide-react';

const PublicFooter = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { to: '/', label: 'Accueil' },
    { to: '/about', label: 'À propos' },
    { to: '/services', label: 'Services' },
    { to: '/blog', label: 'Blog' },
    { to: '/contact', label: 'Contact' }
  ];

  return (
    <footer className="bg-base-300 text-base-content border-t border-base-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-10 grid grid-cols-1 md:grid-cols-4 gap-6 border-b border-base-200">
          
          {/* Logo */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-content" />
              </div>
              <div>
                <h3 className="font-bold text-lg">ERP Scolaire</h3>
                <p className="text-[10px] text-base-content/40 font-medium tracking-[0.2em] uppercase">
                  Établissement d'Excellence
                </p>
              </div>
            </div>
            <p className="text-sm text-base-content/60">Une solution complète pour la gestion scolaire.</p>
          </div>

          {/* Liens */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-base-content/60">Liens</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="group flex items-center gap-2 text-sm text-base-content/50 hover:text-base-content transition-all"
                  >
                    <span className="relative">
                      {link.label}
                      <span className="absolute -bottom-0.5 left-0 w-0 h-[2px] bg-primary group-hover:w-full transition-all duration-300"></span>
                    </span>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-base-content/60">Contact</h4>
            <ul className="space-y-2 text-sm text-base-content/50">
              <li className="flex items-center gap-2 hover:text-base-content transition-all">
                <Phone className="w-4 h-4 text-primary" />
                +221 77 123 45 67
              </li>
              <li className="flex items-center gap-2 hover:text-base-content transition-all">
                <Mail className="w-4 h-4 text-primary" />
                contact@erpscolaire.com
              </li>
              <li className="flex items-center gap-2 hover:text-base-content transition-all">
                <MapPin className="w-4 h-4 text-primary" />
                Dakar, Sénégal
              </li>
            </ul>
          </div>

          {/* Horaires */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-base-content/60">Horaires</h4>
            <ul className="space-y-2 text-sm text-base-content/50">
              <li className="flex items-center gap-2 hover:text-base-content transition-all">
                <Clock className="w-4 h-4 text-primary" />
                Lun - Ven: 8h - 18h
              </li>
              <li className="flex items-center gap-2 hover:text-base-content transition-all">
                <Clock className="w-4 h-4 text-primary" />
                Sam: 8h - 13h
              </li>
              <li className="flex items-center gap-2 text-base-content/30">
                <Clock className="w-4 h-4" />
                Dim: Fermé
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="py-6 text-center text-sm text-base-content/50">
          &copy; {currentYear} ERP Scolaire. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;