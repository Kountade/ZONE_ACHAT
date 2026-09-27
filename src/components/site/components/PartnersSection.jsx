// src/components/site/components/PartnersSection.jsx
import React, { useEffect, useRef } from 'react';
import { Handshake, ExternalLink, Sparkles, Building2, TrendingUp } from 'lucide-react';

// ============================================================
// ✅ PARTENAIRES FICTIFS (statiques - pas d'API)
// ============================================================
const partenairesFictifs = [
  {
    id: 1,
    nom: 'Sahel Distribution',
    description: "Leader de la distribution alimentaire en Afrique de l'Ouest.",
    url: '#',
    image_url: null
  },
  {
    id: 2,
    nom: 'Teranga Import',
    description: 'Import-export de produits électroniques et électroménagers.',
    url: '#',
    image_url: null
  },
  {
    id: 3,
    nom: 'Dakar Logistics',
    description: 'Solutions logistiques et transport de marchandises.',
    url: '#',
    image_url: null
  },
  {
    id: 4,
    nom: 'Baobab Cosmétiques',
    description: 'Marque de cosmétiques naturels made in Sénégal.',
    url: '#',
    image_url: null
  },
  {
    id: 5,
    nom: 'Ndiaye & Frères',
    description: 'Grossiste en matériaux de construction.',
    url: '#',
    image_url: null
  },
  {
    id: 6,
    nom: 'Sahel Foods',
    description: 'Agroalimentaire : transformation et distribution.',
    url: '#',
    image_url: null
  },
  {
    id: 7,
    nom: 'Atlantic Trade',
    description: 'Négoce international et sourcing Asie-Europe.',
    url: '#',
    image_url: null
  },
  {
    id: 8,
    nom: 'Groupe Teranga',
    description: 'Conglomérat multisectoriel basé à Dakar.',
    url: '#',
    image_url: null
  }
];

const PartnersSection = () => {
  const scrollRef = useRef(null);

  // ============================================================
  // ANIMATION CARROUSEL INFINI
  // ============================================================
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationId;
    let scrollPosition = 0;
    const speed = 0.5;

    const animate = () => {
      if (!scrollContainer) return;

      scrollPosition += speed;

      const totalWidth = scrollContainer.scrollWidth / 2;
      if (scrollPosition >= totalWidth) {
        scrollPosition = 0;
      }

      scrollContainer.scrollLeft = scrollPosition;
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    const handleMouseEnter = () => {
      if (animationId) cancelAnimationFrame(animationId);
    };

    const handleMouseLeave = () => {
      animationId = requestAnimationFrame(animate);
    };

    scrollContainer.addEventListener('mouseenter', handleMouseEnter);
    scrollContainer.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (scrollContainer) {
        scrollContainer.removeEventListener('mouseenter', handleMouseEnter);
        scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  const doubledPartners = [...partenairesFictifs, ...partenairesFictifs];

  return (
    <section className="relative py-24 bg-base-100 overflow-hidden">

      {/* ==================== FONDS DÉCORATIFS ==================== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-secondary/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4">

        {/* ==================== EN-TÊTE ==================== */}
        <div className="text-center max-w-3xl mx-auto mb-16">

          <div className="inline-flex items-center gap-2 px-1 py-1 rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30 shadow-lg shadow-primary/10 mb-6">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-primary-content text-xs sm:text-sm font-bold uppercase tracking-wider">
              <Handshake className="w-4 h-4" />
              Nos partenaires
            </span>
            <span className="pr-3 flex items-center gap-1 text-xs font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5 fill-primary" />
              Réseau B2B
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-secondary leading-[1.05] tracking-tighter mb-6">
            Ils nous font{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                confiance
              </span>
              <span className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-primary/60 to-transparent rounded-full"></span>
            </span>
          </h2>

          <p className="text-base-content/70 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-medium">
            Fournisseurs, distributeurs et partenaires engagés à nos côtés
            pour offrir le meilleur à nos clients.
          </p>
        </div>

        {/* ==================== CARROUSEL INFINI ==================== */}
        <div className="relative">

          {/* Dégradés sur les bords */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-base-100 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-base-100 to-transparent z-10 pointer-events-none" />

          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-hidden scroll-smooth py-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex gap-6 flex-nowrap partners-scroll">
              {doubledPartners.map((partner, index) => (
                <div
                  key={`${partner.id}-${index}`}
                  className="group relative flex-shrink-0 w-[200px] sm:w-[220px] lg:w-[240px]"
                >
                  {/* Halo au survol */}
                  <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative h-full bg-base-200 border border-base-300 rounded-3xl p-6 text-center shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden">

                    {/* Bande décorative */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Logo / Avatar */}
                    <div className="flex justify-center mb-4">
                      <div className="relative">
                        <div className="absolute -inset-2 bg-primary/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl font-black text-primary shadow-md group-hover:scale-110 transition-transform duration-300">
                          {partner.nom?.charAt(0)?.toUpperCase() || <Building2 className="w-8 h-8" />}
                        </div>
                      </div>
                    </div>

                    {/* Nom */}
                    <h3 className="relative font-bold text-base text-secondary mb-2 truncate group-hover:text-primary transition-colors duration-300">
                      {partner.nom}
                    </h3>

                    {/* Description */}
                    {partner.description && (
                      <p className="relative text-xs text-base-content/55 line-clamp-2 mb-3">
                        {partner.description}
                      </p>
                    )}

                    {/* Lien */}
                    {partner.url && (
                      <a
                        href={partner.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:gap-2 transition-all duration-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Visiter
                        <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    )}

                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ==================== CTA DEVENIR PARTENAIRE ==================== */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-transparent to-secondary/20 rounded-3xl blur-2xl opacity-60" />

            <div className="relative bg-base-200/80 backdrop-blur-sm border-2 border-primary/20 rounded-2xl p-8 text-center shadow-xl">

              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
                <TrendingUp className="w-7 h-7 text-primary" />
              </div>

              <h3 className="text-xl md:text-2xl font-black text-secondary mb-3">
                Rejoignez notre <span className="text-primary">réseau de partenaires</span>
              </h3>

              <p className="text-base-content/70 mb-6 max-w-lg mx-auto">
                Fournisseurs, distributeurs, marques : développons ensemble
                des opportunités d'affaires durables.
              </p>

              <button className="group relative inline-flex">
                <span className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/60 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></span>
                <span className="relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-base bg-primary text-primary-content hover:-translate-y-1 transition-all duration-300 shadow-xl">
                  Devenir partenaire
                  <Handshake className="w-5 h-5" />
                </span>
              </button>

            </div>
          </div>
        </div>

      </div>

      {/* Masquer la scrollbar */}
      <style>{`
        .partners-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>

    </section>
  );
};

export default PartnersSection;