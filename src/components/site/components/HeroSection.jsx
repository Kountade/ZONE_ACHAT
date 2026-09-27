// src/components/site/HeroSection.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Rocket,
  ShoppingBag,
  Truck,
  Megaphone,
  Briefcase,
  Handshake,
  ArrowRight,
  Phone,
  Target,
  Sparkles,
  Star
} from 'lucide-react';

const SHARED_VIDEO = '/video.mp4';

const slides = [
  {
    id: 1,
    title: 'Distribution & Négoce',
    accent: 'Négoce',
    subtitle: 'Achat • Vente • Revente',
    description:
      "Approvisionnement, distribution et revente de produits en gros et demi-gros. Nous connectons producteurs, fournisseurs et revendeurs pour dynamiser votre chiffre d'affaires.",
    buttonLabel: 'Découvrir nos offres',
    buttonLink: '/services/distribution',
    icon: ShoppingBag
  },
  {
    id: 2,
    title: 'Commerce Général',
    accent: 'Général',
    subtitle: 'Large Gamme de Produits',
    description:
      "Une gamme complète de produits de consommation courante, d'équipements et de fournitures professionnelles pour particuliers et entreprises, livrés rapidement.",
    buttonLabel: 'Voir le catalogue',
    buttonLink: '/produits',
    icon: Briefcase
  },
  {
    id: 3,
    title: 'Import & Export',
    accent: 'Export',
    subtitle: 'Sourcing International',
    description:
      "Sourcing, importation et exportation de marchandises depuis l'Asie, l'Europe et le Moyen-Orient. Nous gérons la logistique, les douanes et la livraison.",
    buttonLabel: 'Nos partenaires',
    buttonLink: '/services/import-export',
    icon: Truck
  },
  {
    id: 4,
    title: 'Marketing & Communication',
    accent: 'Communication',
    subtitle: 'Visibilité & Croissance',
    description:
      "Stratégie marketing, communication digitale, branding et campagnes publicitaires pour booster la visibilité de votre marque et conquérir de nouveaux marchés.",
    buttonLabel: 'Nos services marketing',
    buttonLink: '/services/marketing',
    icon: Megaphone
  },
  {
    id: 5,
    title: 'Conseil & Accompagnement',
    accent: 'Accompagnement',
    subtitle: 'Stratégie Commerciale',
    description:
      "Nous accompagnons les entreprises dans leur développement commercial : étude de marché, plan d'affaires, prospection et optimisation des ventes.",
    buttonLabel: 'Prendre rendez-vous',
    buttonLink: '/services/conseil',
    icon: Target
  },
  {
    id: 6,
    title: 'Partenariats & Réseau',
    accent: 'Réseau',
    subtitle: 'Business Development',
    description:
      "Un réseau solide de partenaires, fournisseurs et distributeurs. Nous créons des opportunités d'affaires et facilitons les mises en relation B2B.",
    buttonLabel: 'Rejoindre le réseau',
    buttonLink: '/partenaires',
    icon: Handshake
  },
  {
    id: 7,
    title: 'Logistique & Livraison',
    accent: 'Livraison',
    subtitle: 'Rapidité & Fiabilité',
    description:
      "Livraison rapide partout au Sénégal et en Afrique de l'Ouest. Gestion complète de la chaîne logistique pour un service fiable et ponctuel.",
    buttonLabel: 'Demander un devis',
    buttonLink: '/services/logistique',
    icon: Rocket
  }
];

const renderTitle = (title, accent) => {
  if (!accent || !title.includes(accent)) return title;
  const [before, after] = title.split(accent);
  return (
    <>
      {before}
      <span className="relative inline-block">
        <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
          {accent}
        </span>
        <span className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-primary/60 to-transparent rounded-full"></span>
      </span>
      {after}
    </>
  );
};

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setFadeIn(true);
      }, 350);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const current = slides[currentSlide];
  const Icon = current.icon;

  return (
    <section className="relative min-h-screen lg:h-screen lg:min-h-[780px] overflow-hidden bg-gradient-to-br from-base-100 via-base-100 to-base-200">

      {/* ==================== FONDS DÉCORATIFS ==================== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-secondary/20 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-[150px]" />

        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />

        <div className="absolute top-32 left-[15%] w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDuration: '3s' }} />
        <div className="absolute top-48 right-[20%] w-3 h-3 rounded-full bg-primary/30 animate-bounce" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-40 left-[25%] w-2 h-2 rounded-full bg-secondary/30 animate-bounce" style={{ animationDuration: '5s' }} />
      </div>

      {/* ==================== CONTENU ==================== */}
      <div
        className={`relative z-10 min-h-screen lg:h-full flex items-center transition-all duration-700 ${
          fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="container mx-auto px-4 pt-28 pb-24 lg:py-24 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">

            {/* ============ COLONNE GAUCHE (7/12) ============ */}
            <div className="lg:col-span-7 text-center lg:text-left">

              {/* ✅ Badge animé */}
              <div className="inline-flex items-center gap-2 px-1 py-1 rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30 shadow-lg shadow-primary/10 mb-6">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-primary-content text-xs sm:text-sm font-bold uppercase tracking-wider">
                  <Icon className="w-4 h-4" />
                  {current.subtitle}
                </span>
                <span className="pr-3 flex items-center gap-1 text-xs font-semibold text-primary">
                  <Star className="w-3.5 h-3.5 fill-primary" />
                  Nouveau
                </span>
              </div>

              {/* ✅ Titre GÉANT */}
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-7xl xl:text-8xl font-black mt-2 mb-6 text-secondary leading-[0.95] tracking-tighter">
                {renderTitle(current.title, current.accent)}
              </h1>

              {/* ✅ Description */}
              <p className="text-base-content/75 text-lg md:text-xl lg:text-2xl leading-relaxed mb-10 max-w-2xl mx-auto lg:mx-0 font-medium">
                {current.description}
              </p>

              {/* ✅ CTA XL */}
              <div className="flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start gap-4">
                <Link to={current.buttonLink} className="group relative">
                  <span className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/60 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></span>
                  <button className="relative w-full sm:w-auto px-10 py-5 rounded-2xl font-black text-lg transition-all duration-300 hover:-translate-y-1 shadow-2xl flex items-center justify-center gap-3 bg-primary text-primary-content">
                    {current.buttonLabel}
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                  </button>
                </Link>

                <Link to="/contact">
                  <button className="w-full sm:w-auto px-10 py-5 rounded-2xl font-black text-lg transition-all duration-300 hover:-translate-y-1 border-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-content flex items-center justify-center gap-3 backdrop-blur-sm bg-base-100/50">
                    <Phone className="w-6 h-6" />
                    Demander un devis
                  </button>
                </Link>
              </div>

            </div>

            {/* ============ COLONNE DROITE — VIDÉO (5/12) ============ */}
            <div className="lg:col-span-5 relative">

              <div className="absolute -inset-6 bg-gradient-to-br from-primary/30 via-transparent to-secondary/30 rounded-[3rem] blur-3xl" />

              <div className="relative animate-[float_6s_ease-in-out_infinite]">
                <div className="relative rounded-[2rem] overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] border-2 border-base-100 bg-base-100">

                  <div className="flex items-center gap-2 px-4 py-3 bg-secondary">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-300/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                    </div>

                    <div className="ml-3 flex items-center gap-2 min-w-0">
                      <span className="relative flex h-2 w-2 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                      </span>
                      <span className="text-xs font-medium text-secondary-content/90 tracking-wide truncate">
                        {current.subtitle}
                      </span>
                    </div>
                  </div>

                  <div className="aspect-video bg-gray-900">
                    <video
                      src={SHARED_VIDEO}
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="auto"
                    />
                  </div>

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 px-5 py-4 flex items-end justify-between gap-2">
                    <span className="text-white text-sm font-bold tracking-wide drop-shadow-md truncate">
                      {current.title}
                    </span>
                    <span className="text-white/80 text-xs font-mono flex-shrink-0 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
                      {String(currentSlide + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
                    </span>
                  </div>

                </div>

                {/* ✅ Badge flottant "Excellence" */}
                <div className="absolute -top-4 -right-4 bg-primary text-primary-content rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-2 animate-bounce" style={{ animationDuration: '3s' }}>
                  <Sparkles className="w-5 h-5" />
                  <span className="text-xs font-black uppercase tracking-wider">Excellence</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* ==================== POINTS INDICATEURS ==================== */}
      <div className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setFadeIn(false);
              setTimeout(() => {
                setCurrentSlide(index);
                setFadeIn(true);
              }, 350);
            }}
            aria-label={`Aller au slide ${index + 1}`}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              index === currentSlide
                ? 'bg-primary w-12 shadow-lg shadow-primary/50'
                : 'bg-base-300 w-4 hover:bg-primary/40'
            }`}
          />
        ))}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>

    </section>
  );
};

export default HeroSection;