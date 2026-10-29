// src/components/site/AboutPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from './Layout/PublicLayout';
import {
  Package,
  Target,
  Heart,
  Shield,
  Lightbulb,
  Smartphone,
  ClipboardCheck,
  Truck,
  Boxes,
  Warehouse,
  Store,
  ArrowRight,
  Sparkles,
  Award,
  Building2
} from 'lucide-react';

// ✅ Image de fond (carte de la Côte d'Ivoire)
import ivoryCoast from '../../assets/ivory-coast.svg';

const AboutPage = () => {
  // ============================================================
  // ✅ VALEURS (tirées des sections 1 et 8 du document StockAcha)
  // ============================================================
  const values = [
    {
      icon: Shield,
      title: 'Fiabilité',
      value:
        "Marchandises enregistrées à la réception, mouvements historisés et retours contrôlés avant réintégration."
    },
    {
      icon: Target,
      title: 'Transparence',
      value:
        "Des frais visibles et compréhensibles, des paiements et reversements traçables, consultables à distance."
    },
    {
      icon: Heart,
      title: 'Tranquillité',
      value:
        "Vous vous concentrez sur le développement de votre activité, nous prenons en charge la gestion opérationnelle de vos commandes."
    },
    {
      icon: Lightbulb,
      title: 'Proximité',
      value:
        "Un accompagnement adapté aux commerçants, vendeurs en ligne, entrepreneurs et entreprises, où que vous soyez."
    }
  ];

  // ============================================================
  // ✅ CE QUE NOUS PRENONS EN CHARGE (section 2 du document)
  // ============================================================
  const services = [
    { icon: Package,        title: 'Stockage de marchandises',     desc: 'Inventaire et suivi des quantités' },
    { icon: Boxes,          title: 'Gestion et suivi des stocks',   desc: 'Consultation à distance' },
    { icon: ClipboardCheck, title: 'Closing des commandes',         desc: 'Vérification avant expédition' },
    { icon: Package,        title: 'Préparation des commandes',     desc: 'Prélèvement et contrôle' },
    { icon: Truck,          title: 'Livraison et expédition',       desc: 'Abidjan et hors Abidjan' },
    { icon: Warehouse,      title: 'Dépôt pour les clients',        desc: 'Espace de conservation' },
    { icon: Store,          title: 'Vente sur ZonAcha',             desc: 'Présentation facultative' },
    { icon: Smartphone,     title: 'Suivi des ventes et des frais', desc: 'Paiements traçables' }
  ];

  return (
    <PublicLayout>
      <section className="relative min-h-screen bg-gradient-to-br from-base-100 via-base-100 to-base-200 overflow-hidden">

        {/* ==================== IMAGE DE FOND — CARTE CÔTE D'IVOIRE ==================== */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          aria-hidden="true"
          style={{
            backgroundImage: `url(${ivoryCoast})`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center center',
            backgroundSize: 'contain',
            opacity: 0.06
          }}
        />

        {/* Voile pour adoucir encore l'image et garantir la lisibilité */}
        <div className="fixed inset-0 bg-base-100/40 pointer-events-none z-0" aria-hidden="true" />

        {/* ==================== FONDS DÉCORATIFS ==================== */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
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

        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-28 pb-24">

          {/* ==================== EN-TÊTE ==================== */}
          <div className="text-center max-w-3xl mx-auto mb-16">

            <div className="inline-flex items-center gap-2 px-1 py-1 rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30 shadow-lg shadow-primary/10 mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-primary-content text-xs sm:text-sm font-bold uppercase tracking-wider">
                <Building2 className="w-4 h-4" />
                À propos
              </span>
              <span className="pr-3 flex items-center gap-1 text-xs font-semibold text-primary">
                <Sparkles className="w-3.5 h-3.5 fill-primary" />
                StockAcha
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-secondary leading-[0.95] tracking-tighter mb-6">
              À propos de{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                  StockAcha
                </span>
                <span className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-primary/60 to-transparent rounded-full"></span>
              </span>
            </h1>

            <p className="text-base-content/75 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-medium">
              Votre stock, notre logistique, votre tranquillité.
              Une plateforme conçue pour simplifier la gestion logistique
              des commerçants, vendeurs en ligne, entrepreneurs et entreprises.
            </p>
          </div>

          {/* ==================== QUI SOMMES-NOUS ==================== */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-transparent to-secondary/20 rounded-3xl blur-2xl opacity-60" />

              <div className="relative bg-base-100/80 backdrop-blur-sm border border-base-300 rounded-3xl p-8 md:p-10 shadow-xl">

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-md">
                    <Package className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-secondary tracking-tight">
                    Qui sommes-nous ?
                  </h2>
                </div>

                <div className="space-y-4 text-base-content/70 leading-relaxed text-base md:text-lg">
                  <p>
                    <span className="font-bold text-secondary">StockAcha</span> est une
                    plateforme de stockage, de gestion de stock et de logistique destinée
                    aux commerçants, aux vendeurs en ligne, aux entrepreneurs et aux entreprises.
                  </p>
                  <p>
                    Nous permettons à nos partenaires de <span className="font-semibold text-primary">stocker leurs marchandises</span>,
                    de <span className="font-semibold text-primary">suivre leurs stocks à distance</span> et de
                    <span className="font-semibold text-primary"> confier la gestion opérationnelle de leurs commandes</span> à notre équipe.
                  </p>
                  <p>
                    Vous n'avez plus besoin de gérer seul le stockage de vos produits, leur inventaire
                    ou la préparation de chaque colis : vous pouvez suivre vos marchandises et enregistrer
                    vos commandes depuis votre téléphone, votre tablette ou votre ordinateur.
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-base-300">
                  <p className="text-sm font-bold text-base-content/60 tracking-wide">
                    StockAcha — Votre stock, notre logistique, votre tranquillité.
                  </p>
                </div>

              </div>
            </div>
          </div>

          {/* ==================== NOS VALEURS ==================== */}
          <div className="mb-20">

            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-1 py-1 rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30 shadow-lg shadow-primary/10 mb-4">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-primary-content text-xs font-bold uppercase tracking-wider">
                  <Award className="w-4 h-4" />
                  Nos valeurs
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-secondary leading-[1.05] tracking-tighter mb-4">
                Ce qui nous{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                    guide
                  </span>
                  <span className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-primary/60 to-transparent rounded-full"></span>
                </span>
              </h2>

              <p className="text-base-content/70 text-lg leading-relaxed max-w-2xl mx-auto font-medium">
                Des principes clairs qui s'appliquent à chaque étape :
                réception, stockage, préparation, livraison et paiement.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="group relative">
                    <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative h-full bg-base-100 border border-base-300 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden">

                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <span className="absolute top-4 right-4 text-6xl font-black text-base-300/40 leading-none select-none">
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-5 group-hover:from-primary group-hover:to-primary/80 group-hover:scale-110 transition-all duration-300 shadow-sm">
                        <Icon className="w-7 h-7 text-primary group-hover:text-primary-content transition-colors duration-300" />
                      </div>

                      <h3 className="relative font-bold text-lg text-secondary mb-2 leading-tight group-hover:text-primary transition-colors duration-300">
                        {item.title}
                      </h3>

                      <p className="relative text-sm text-base-content/65 leading-relaxed">
                        {item.value}
                      </p>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ==================== NOTRE MISSION ==================== */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-secondary/20 via-transparent to-primary/20 rounded-3xl blur-2xl opacity-60" />

              <div className="relative bg-base-100/80 backdrop-blur-sm border border-base-300 rounded-3xl p-8 md:p-10 shadow-xl">

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-md">
                    <Target className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-secondary tracking-tight">
                    Notre mission
                  </h2>
                </div>

                <p className="text-base-content/70 leading-relaxed text-base md:text-lg mb-6">
                  Vous permettre de <span className="font-semibold text-primary">vous concentrer sur le développement de votre activité commerciale</span> pendant
                  que nous vous accompagnons dans la gestion logistique. Avec StockAcha,
                  votre stock est organisé, vos commandes sont suivies et votre logistique est simplifiée.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-base-200 border border-base-300">
                    <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm text-secondary">Stock organisé</p>
                      <p className="text-xs text-base-content/55">Inventaire fiable</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-xl bg-base-200 border border-base-300">
                    <ClipboardCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm text-secondary">Commandes suivies</p>
                      <p className="text-xs text-base-content/55">Numéro unique</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-xl bg-base-200 border border-base-300">
                    <Truck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm text-secondary">Logistique simplifiée</p>
                      <p className="text-xs text-base-content/55">Abidjan & hors Abidjan</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ==================== CE QUE NOUS PRENONS EN CHARGE ==================== */}
          <div className="mb-16">

            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-1 py-1 rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30 shadow-lg shadow-primary/10 mb-4">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-primary-content text-xs font-bold uppercase tracking-wider">
                  <Boxes className="w-4 h-4" />
                  Nos services
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-secondary leading-[1.05] tracking-tighter mb-4">
                Ce que nous prenons{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                    en charge
                  </span>
                  <span className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-primary/60 to-transparent rounded-full"></span>
                </span>
              </h2>

              <p className="text-base-content/70 text-lg leading-relaxed max-w-2xl mx-auto font-medium">
                De la réception de vos marchandises jusqu'au reversement,
                nous couvrons toute la chaîne logistique.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {services.map((service, index) => {
                const Icon = service.icon;
                return (
                  <div key={index} className="group relative">
                    <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative h-full bg-base-100 border border-base-300 rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                          <Icon className="w-5 h-5 text-primary group-hover:text-primary-content transition-colors duration-300" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-secondary leading-tight group-hover:text-primary transition-colors duration-300">
                            {service.title}
                          </p>
                          <p className="text-xs text-base-content/55 mt-0.5">
                            {service.desc}
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ==================== CTA FINAL ==================== */}
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-transparent to-secondary/20 rounded-3xl blur-2xl opacity-60" />

              <div className="relative bg-base-100/80 backdrop-blur-sm border-2 border-primary/20 rounded-2xl p-8 text-center shadow-xl">

                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>

                <h3 className="text-xl md:text-2xl font-black text-secondary mb-3">
                  Prêt à simplifier votre <span className="text-primary">logistique</span> ?
                </h3>

                <p className="text-base-content/70 mb-6 max-w-lg mx-auto">
                  Créez votre compte partenaire et découvrez comment StockAcha
                  peut prendre en charge la gestion opérationnelle de vos commandes.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link to="/inscription" className="group relative inline-flex">
                    <span className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/60 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></span>
                    <span className="relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-base bg-primary text-primary-content hover:-translate-y-1 transition-all duration-300 shadow-xl">
                      Créer un compte
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>

                  <Link
                    to="/contact"
                    className="px-8 py-4 rounded-2xl font-black text-base transition-all duration-300 hover:-translate-y-1 border-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-content flex items-center justify-center gap-2"
                  >
                    Demander un devis
                  </Link>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>
    </PublicLayout>
  );
};

export default AboutPage;