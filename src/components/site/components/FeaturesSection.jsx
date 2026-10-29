// src/components/site/FeaturesSection.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Boxes,
  ClipboardCheck,
  PackageCheck,
  Truck,
  Warehouse,
  Store,
  ArrowRight,
  Sparkles,
  Zap,
  Award
} from 'lucide-react';

// ✅ Image de fond (carte de la Côte d'Ivoire)
import ivoryCoast from '../../../assets/ivory-coast.svg';

const FeaturesSection = () => {
  // ============================================================
  // ✅ Les 7 services officiels de StockAcha (section 2 du document)
  // ============================================================
  const features = [
    {
      icon: Package,
      title: 'Stockage de marchandises',
      description:
        "Un espace adapté à votre activité, avec inventaire et suivi des quantités. 25 000 FCFA par m³ et par mois, à partir de 1 m³.",
      link: '/services/stockage'
    },
    {
      icon: Boxes,
      title: 'Gestion et suivi des stocks',
      description:
        "Consultez vos produits, variantes, couleurs, tailles, entrées et sorties depuis votre espace personnel, sans vous déplacer.",
      link: '/services/gestion-stocks'
    },
    {
      icon: ClipboardCheck,
      title: 'Closing des commandes',
      description:
        "Vérification des informations et confirmation de l'achat auprès du client avant préparation. 500 FCFA par commande effectivement livrée.",
      link: '/services/closing'
    },
    {
      icon: PackageCheck,
      title: 'Préparation des commandes',
      description:
        "Prélèvement, vérification des références et des quantités, puis préparation du colis. La préparation standard est gratuite selon les conditions convenues.",
      link: '/services/preparation'
    },
    {
      icon: Truck,
      title: 'Livraison et expédition',
      description:
        "Livraison à Abidjan à partir de 1 500 FCFA, expédition hors Abidjan à partir de 2 500 FCFA. Le prix final dépend de la destination et du colis.",
      link: '/services/livraison'
    },
    {
      icon: Warehouse,
      title: 'Dépôt et stockage pour les clients',
      description:
        "Un espace pour conserver vos marchandises : commerçants, vendeurs en ligne, entrepreneurs ou entreprises souhaitant externaliser leur logistique.",
      link: '/services/depot'
    },
    {
      icon: Store,
      title: 'Vente sur ZonAcha',
      description:
        "Présentation facultative de vos produits sur la boutique e-commerce ZonAcha, avec photos, descriptions et prix. Nécessite votre accord explicite.",
      link: '/services/zonacha'
    }
  ];

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
        <div className="absolute -top-40 right-0 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 left-0 w-[500px] h-[500px] rounded-full bg-secondary/10 blur-[120px]" />
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
              <Award className="w-4 h-4" />
              Nos services
            </span>
            <span className="pr-3 flex items-center gap-1 text-xs font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5 fill-primary" />
              Logistique simplifiée
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-secondary leading-[1.05] tracking-tighter mb-6">
            Ce que nous{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                faisons
              </span>
              <span className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-primary/60 to-transparent rounded-full"></span>
            </span>
            {' '}pour vous
          </h2>

          <p className="text-base-content/70 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-medium">
            Stockage, gestion des stocks, closing, préparation, livraison et dépôt :
            confiez-nous la gestion opérationnelle de vos commandes et concentrez-vous
            sur le développement de votre activité.
          </p>
        </div>

        {/* ==================== GRILLE ==================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative"
              >
                {/* Halo au survol */}
                <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative h-full bg-base-100 border border-base-300 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden">

                  {/* Bande décorative haut */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Numéro en filigrane */}
                  <span className="absolute top-4 right-4 text-6xl font-black text-base-300/40 leading-none select-none">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  {/* Icône */}
                  <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-5 group-hover:from-primary group-hover:to-primary/80 group-hover:scale-110 transition-all duration-300 shadow-sm">
                    <Icon className="w-7 h-7 text-primary group-hover:text-primary-content transition-colors duration-300" />
                  </div>

                  {/* Titre */}
                  <h3 className="relative font-bold text-lg text-secondary mb-3 leading-tight group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="relative text-sm text-base-content/65 leading-relaxed mb-5">
                    {feature.description}
                  </p>

                  {/* Lien */}
                  <Link
                    to={feature.link}
                    className="relative inline-flex items-center gap-1.5 text-primary text-sm font-bold group/link"
                  >
                    En savoir plus
                    <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform duration-300" />
                  </Link>

                </div>
              </div>
            );
          })}
        </div>

        {/* ==================== CTA FINAL ==================== */}
        <div className="mt-20 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4">

            <Link to="/contact" className="group relative">
              <span className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/60 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></span>
              <button className="relative px-10 py-5 rounded-2xl font-black text-lg transition-all duration-300 hover:-translate-y-1 shadow-2xl flex items-center justify-center gap-3 bg-primary text-primary-content">
                Demander un devis
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
              </button>
            </Link>

            <Link
              to="/services"
              className="px-10 py-5 rounded-2xl font-black text-lg transition-all duration-300 hover:-translate-y-1 border-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-content flex items-center justify-center gap-3"
            >
              <Zap className="w-6 h-6" />
              Voir tous nos services
            </Link>

          </div>
        </div>

      </div>
    </section>
  );
};

export default FeaturesSection;