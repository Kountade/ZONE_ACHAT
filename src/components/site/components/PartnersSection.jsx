// src/components/site/components/PartnersSection.jsx
import React, { useEffect, useRef } from 'react';
import {
  ShieldCheck,
  History,
  Barcode,
  PackageX,
  RotateCcw,
  Receipt,
  Wallet,
  Smartphone,
  Sparkles,
  Shield
} from 'lucide-react';

// ✅ Image de fond (carte de la Côte d'Ivoire)
import ivoryCoast from '../../../assets/ivory-coast.svg';

// ============================================================
// ✅ GARANTIES DE SERVICE (section 8 du document StockAcha)
// ============================================================
const garanties = [
  {
    id: 1,
    titre: 'Marchandises enregistrées',
    description: "Chaque produit est enregistré à sa réception, contrôlé et identifié dans notre système.",
    icon: ShieldCheck
  },
  {
    id: 2,
    titre: 'Mouvements historisés',
    description: "Toutes les entrées et sorties de stock sont conservées pour un historique fiable.",
    icon: History
  },
  {
    id: 3,
    titre: 'Contrôle par code-barres',
    description: "Les sorties de stock sont vérifiées, notamment à l'aide de codes-barres ou de QR codes.",
    icon: Barcode
  },
  {
    id: 4,
    titre: 'Commandes non livrées',
    description: "Une commande non livrée n'est pas considérée comme une vente définitivement réalisée.",
    icon: PackageX
  },
  {
    id: 5,
    titre: 'Retours contrôlés',
    description: "Un produit retourné n'est jamais remis en stock sans contrôle préalable de son état.",
    icon: RotateCcw
  },
  {
    id: 6,
    titre: 'Frais visibles',
    description: "Les frais de stockage, closing, livraison et autres frais contractuels sont clairs et compréhensibles.",
    icon: Receipt
  },
  {
    id: 7,
    titre: 'Paiements traçables',
    description: "Chaque paiement et reversement est enregistré et consultable depuis votre espace partenaire.",
    icon: Wallet
  },
  {
    id: 8,
    titre: 'Accès à distance',
    description: "Vous consultez vos stocks, commandes et informations financières depuis votre téléphone.",
    icon: Smartphone
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

  const doubledGaranties = [...garanties, ...garanties];

  return (
    <section className="relative py-24 bg-base-100 overflow-hidden">

      {/* ==================== IMAGE DE FOND — CARTE CÔTE D'IVOIRE (NETTE) ==================== */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        aria-hidden="true"
        style={{
          backgroundImage: `url(${ivoryCoast})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
          backgroundSize: 'contain',
          opacity: 0.30
        }}
      />

      {/* Voile léger pour la lisibilité du texte */}
      <div className="absolute inset-0 bg-base-100/20 pointer-events-none z-0" aria-hidden="true" />

      {/* ==================== FONDS DÉCORATIFS ==================== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
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
              <Shield className="w-4 h-4" />
              Nos garanties
            </span>
            <span className="pr-3 flex items-center gap-1 text-xs font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5 fill-primary" />
              Règles de service
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-secondary leading-[1.05] tracking-tighter mb-6">
            Un service{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                fiable
              </span>
              <span className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-primary/60 to-transparent rounded-full"></span>
            </span>
            , à chaque étape
          </h2>

          <p className="text-base-content/70 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-medium">
            Pour garantir un fonctionnement fiable, nous appliquons des règles
            claires à chaque étape : réception, stockage, préparation, livraison et paiement.
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
              {doubledGaranties.map((g, index) => {
                const Icon = g.icon;
                return (
                  <div
                    key={`${g.id}-${index}`}
                    className="group relative flex-shrink-0 w-[240px] sm:w-[260px] lg:w-[280px]"
                  >
                    {/* Halo au survol */}
                    <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative h-full bg-base-200 border border-base-300 rounded-3xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden">

                      {/* Bande décorative */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      {/* Icône */}
                      <div className="flex justify-start mb-4">
                        <div className="relative">
                          <div className="absolute -inset-2 bg-primary/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                            <Icon className="w-7 h-7 text-primary" />
                          </div>
                        </div>
                      </div>

                      {/* Titre */}
                      <h3 className="relative font-bold text-base text-secondary mb-2 group-hover:text-primary transition-colors duration-300">
                        {g.titre}
                      </h3>

                      {/* Description */}
                      <p className="relative text-xs text-base-content/60 leading-relaxed">
                        {g.description}
                      </p>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ==================== CTA ==================== */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-transparent to-secondary/20 rounded-3xl blur-2xl opacity-60" />

            <div className="relative bg-base-200/80 backdrop-blur-sm border-2 border-primary/20 rounded-2xl p-8 text-center shadow-xl">

              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>

              <h3 className="text-xl md:text-2xl font-black text-secondary mb-3">
                Votre stock, notre <span className="text-primary">logistique</span>
              </h3>

              <p className="text-base-content/70 mb-6 max-w-lg mx-auto">
                StockAcha — Votre stock, notre logistique, votre tranquillité.
                Confiez-nous la gestion opérationnelle de vos commandes.
              </p>

              <button className="group relative inline-flex">
                <span className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/60 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></span>
                <span className="relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-base bg-primary text-primary-content hover:-translate-y-1 transition-all duration-300 shadow-xl">
                  Créer un compte
                  <Sparkles className="w-5 h-5" />
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