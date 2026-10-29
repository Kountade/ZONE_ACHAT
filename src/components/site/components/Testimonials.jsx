// src/components/site/Testimonials.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  TrendingUp,
  Receipt,
  Wallet,
  User,
  ArrowRight,
  Sparkles
} from 'lucide-react';

// ✅ Image de fond (carte de la Côte d'Ivoire)

import ivoryCoast from '../../../assets/ivory-coast.svg';

// ============================================================
// ✅ RUBRIQUES DE L'ESPACE PARTENAIRE (section 5 du document)
// ============================================================
const rubriques = [
  {
    id: 1,
    titre: 'Mon tableau de bord',
    description:
      "Produits en stock, quantités disponibles, commandes en cours et livrées, mouvements récents, ventes, frais et montants en attente de reversement.",
    icon: LayoutDashboard,
    link: '/espace-partenaire/tableau-de-bord'
  },
  {
    id: 2,
    titre: 'Mon stock',
    description:
      "Produits, références, variantes, quantités disponibles et historique des mouvements de stock.",
    icon: Boxes,
    link: '/espace-partenaire/stock'
  },
  {
    id: 3,
    titre: 'Mes commandes',
    description:
      "Enregistrez vos commandes, consultez leur statut et suivez leur préparation et leur livraison. Chaque commande a un numéro unique.",
    icon: ShoppingCart,
    link: '/espace-partenaire/commandes'
  },
  {
    id: 4,
    titre: 'Mes ventes',
    description:
      "Consultez les commandes livrées et les montants correspondants.",
    icon: TrendingUp,
    link: '/espace-partenaire/ventes'
  },
  {
    id: 5,
    titre: 'Mes frais',
    description:
      "Frais de stockage, de closing, de livraison et autres frais contractuels éventuels, tous visibles et compréhensibles.",
    icon: Receipt,
    link: '/espace-partenaire/frais'
  },
  {
    id: 6,
    titre: 'Mes paiements',
    description:
      "Sommes dues, reversements effectués et opérations en attente. Chaque paiement est traçable.",
    icon: Wallet,
    link: '/espace-partenaire/paiements'
  },
  {
    id: 7,
    titre: 'Mon compte',
    description:
      "Informations personnelles, coordonnées et informations contractuelles. Accès sécurisé et personnel.",
    icon: User,
    link: '/espace-partenaire/compte'
  }
];

const Testimonials = () => {
  return (
    <section className="relative py-24 bg-base-200 overflow-hidden">

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
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-secondary/10 blur-[120px]" />
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
              <LayoutDashboard className="w-4 h-4" />
              Espace partenaire
            </span>
            <span className="pr-3 flex items-center gap-1 text-xs font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5 fill-primary" />
              Suivi à distance
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-secondary leading-[1.05] tracking-tighter mb-6">
            Ce que vous pouvez{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                suivre
              </span>
              <span className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-primary/60 to-transparent rounded-full"></span>
            </span>
          </h2>

          <p className="text-base-content/70 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-medium">
            Depuis votre compte personnel sécurisé, consultez toutes les informations
            liées à votre activité, où que vous soyez.
          </p>
        </div>

        {/* ==================== GRILLE ==================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rubriques.map((r, index) => {
            const Icon = r.icon;
            return (
              <div key={r.id} className="group relative">

                {/* Halo au survol */}
                <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative h-full bg-base-100 border border-base-300 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden">

                  {/* Bande décorative */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Numéro en filigrane */}
                  <span className="absolute top-3 right-4 text-5xl font-black text-base-300/40 leading-none select-none">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  {/* Icône + titre */}
                  <div className="relative flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>

                    <h3 className="font-bold text-base text-secondary group-hover:text-primary transition-colors duration-300 leading-tight">
                      {r.titre}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="relative text-sm text-base-content/65 leading-relaxed mb-5">
                    {r.description}
                  </p>

                  {/* Lien */}
                  <Link
                    to={r.link}
                    className="relative inline-flex items-center gap-1.5 text-primary text-sm font-bold group/link"
                  >
                    Consulter
                    <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform duration-300" />
                  </Link>

                </div>
              </div>
            );
          })}
        </div>

        {/* ==================== CTA FINAL ==================== */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-transparent to-secondary/20 rounded-3xl blur-2xl opacity-60" />

            <div className="relative bg-base-100/80 backdrop-blur-sm border-2 border-primary/20 rounded-2xl p-8 text-center shadow-xl">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
                <LayoutDashboard className="w-7 h-7 text-primary" />
              </div>

              <h3 className="text-xl md:text-2xl font-black text-secondary mb-3">
                Accédez à votre <span className="text-primary">espace partenaire</span>
              </h3>

              <p className="text-base-content/70 mb-6 max-w-lg mx-auto">
                Créez votre compte pour suivre vos stocks, enregistrer vos commandes
                et consulter vos frais et paiements en toute transparence.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/inscription" className="group relative inline-flex">
                  <span className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/60 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></span>
                  <span className="relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-base bg-primary text-primary-content hover:-translate-y-1 transition-all duration-300 shadow-xl">
                    Créer un compte
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </Link>

                <Link
                  to="/connexion"
                  className="px-8 py-4 rounded-2xl font-black text-base transition-all duration-300 hover:-translate-y-1 border-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-content flex items-center justify-center gap-2"
                >
                  Se connecter
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Testimonials;