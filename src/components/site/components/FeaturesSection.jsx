// src/components/site/FeaturesSection.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Truck,
  Handshake,
  Target,
  TrendingUp,
  Shield,
  Globe,
  Headphones,
  ArrowRight,
  Sparkles,
  Zap,
  Award
} from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: ShoppingBag,
      title: 'Négoce & Distribution',
      description:
        "Achat, vente et revente de marchandises en gros et demi-gros. Un circuit court entre producteurs, fournisseurs et revendeurs.",
      link: '/services/distribution'
    },
    {
      icon: Truck,
      title: 'Logistique & Livraison',
      description:
        "Livraison rapide et fiable partout au Sénégal et en Afrique de l'Ouest. Suivi en temps réel de vos commandes.",
      link: '/services/logistique'
    },
    {
      icon: Handshake,
      title: 'Réseau de partenaires',
      description:
        "Un réseau solide de fournisseurs et distributeurs locaux et internationaux pour sécuriser vos approvisionnements.",
      link: '/partenaires'
    },
    {
      icon: Target,
      title: 'Conseil stratégique',
      description:
        "Accompagnement personnalisé pour développer votre activité commerciale, optimiser vos marges et conquérir de nouveaux marchés.",
      link: '/services/conseil'
    },
    {
      icon: TrendingUp,
      title: 'Croissance commerciale',
      description:
        "Des solutions concrètes pour booster votre chiffre d'affaires : prospection, fidélisation et développement B2B.",
      link: '/services/croissance'
    },
    {
      icon: Shield,
      title: 'Fiabilité & Confiance',
      description:
        "Des transactions sécurisées, des contrats clairs et un engagement total sur la qualité de nos produits et services.",
      link: '/about'
    },
    {
      icon: Globe,
      title: 'Import & Export',
      description:
        "Sourcing international (Asie, Europe, Moyen-Orient), gestion des douanes et transport jusqu'à votre entrepôt.",
      link: '/services/import-export'
    },
    {
      icon: Headphones,
      title: 'Service client 24/7',
      description:
        "Une équipe commerciale à votre écoute, disponible à tout moment pour répondre à vos besoins urgents.",
      link: '/contact'
    }
  ];

  return (
    <section className="relative py-24 bg-base-200 overflow-hidden">

      {/* ==================== FONDS DÉCORATIFS ==================== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-1 py-1 rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30 shadow-lg shadow-primary/10 mb-6">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-primary-content text-xs sm:text-sm font-bold uppercase tracking-wider">
              <Award className="w-4 h-4" />
              Nos atouts
            </span>
            <span className="pr-3 flex items-center gap-1 text-xs font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5 fill-primary" />
              Excellence
            </span>
          </div>

          {/* Titre impactant */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-secondary leading-[1.05] tracking-tighter mb-6">
            Pourquoi nous{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                choisir
              </span>
              <span className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-primary/60 to-transparent rounded-full"></span>
            </span>
            {' '}?
          </h2>

          <p className="text-base-content/70 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-medium">
            Des services commerciaux complets pour développer votre activité,
            sécuriser vos approvisionnements et conquérir de nouveaux marchés.
          </p>
        </div>

        {/* ==================== GRILLE ==================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                Discuter de votre projet
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