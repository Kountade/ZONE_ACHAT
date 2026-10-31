// src/components/site/ServicesPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from './Layout/PublicLayout';
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
  Award,
  Briefcase,
  CheckCircle2
} from 'lucide-react';

// ✅ Image de fond (carte de la Côte d'Ivoire)
import ivoryCoast from '../../assets/ivory-coast.svg';

const ServicesPage = () => {
  // ============================================================
  // ✅ LES 7 SERVICES OFFICIELS (section 2 du document StockAcha)
  // ============================================================
  const services = [
    {
      icon: Package,
      title: 'Stockage de marchandises',
      description:
        "Un espace adapté à votre activité, avec inventaire et suivi des quantités. Réception contrôlée, enregistrement dans notre système et consultation de votre inventaire depuis votre espace personnel.",
      price: '25 000 FCFA / m³ / mois',
      details: ['À partir de 1 m³', 'Facturation mensuelle', 'Volume calculé avant prise en charge'],
      link: '/services/stockage'
    },
    {
      icon: Boxes,
      title: 'Gestion et suivi des stocks',
      description:
        "Consultez vos produits, variantes, couleurs, tailles, entrées et sorties depuis votre espace personnel, sans vous déplacer. Un historique fiable à chaque opération.",
      price: 'Inclus',
      details: ['Produits et variantes', 'Entrées / sorties historisées', 'Produits réservés et retournés'],
      link: '/services/gestion-stocks'
    },
    {
      icon: ClipboardCheck,
      title: 'Closing des commandes',
      description:
        "Vérification des informations et confirmation de l'achat auprès du client avant préparation. Un traitement soigné pour limiter les erreurs avant expédition.",
      price: '500 FCFA / commande livrée',
      details: ['Commande effectivement livrée', 'Distinct des frais de livraison', 'Annulée = pas de frais'],
      link: '/services/closing'
    },
    {
      icon: PackageCheck,
      title: 'Préparation des commandes',
      description:
        "Prélèvement, vérification des références et des quantités, puis préparation du colis. La préparation standard est gratuite selon les conditions convenues.",
      price: 'Gratuite',
      details: ['Contrôle des références', 'Contrôle des quantités', 'Colis prêt pour expédition'],
      link: '/services/preparation'
    },
    {
      icon: Truck,
      title: 'Livraison et expédition',
      description:
        "Livraison à Abidjan à partir de 1 500 FCFA, expédition hors Abidjan à partir de 2 500 FCFA. Le prix final dépend de la destination et du colis.",
      price: 'Dès 1 500 FCFA',
      details: ['Abidjan : dès 1 500 FCFA', 'Hors Abidjan : dès 2 500 FCFA', 'Tarif confirmé avant validation'],
      link: '/services/livraison'
    },
    {
      icon: Warehouse,
      title: 'Dépôt et stockage pour les clients',
      description:
        "Un espace pour conserver vos marchandises : commerçants, vendeurs en ligne, entrepreneurs ou entreprises souhaitant externaliser leur logistique.",
      price: 'Sur devis',
      details: ['Conditions selon la nature', 'Durée et modalités définies', 'Retrait selon accord'],
      link: '/services/depot'
    },
    {
      icon: Store,
      title: 'Vente sur ZonAcha',
      description:
        "Présentation facultative de vos produits sur la boutique e-commerce ZonAcha, avec photos, descriptions et prix. Nécessite votre accord explicite.",
      price: 'Facultatif',
      details: ['Photos et descriptions', 'Commandes en ligne', 'Suivi des ventes et frais'],
      link: '/services/zonacha'
    }
  ];

  // ============================================================
  // ✅ TABLEAU DES TARIFS DE RÉFÉRENCE (section 3 du document)
  // ============================================================
  const tarifs = [
    { service: 'Stockage standard', tarif: '25 000 FCFA/m³/mois' },
    { service: 'Volume minimal de référence', tarif: '1 m³' },
    { service: 'Préparation standard', tarif: 'Gratuite' },
    { service: 'Closing d\'une commande livrée', tarif: '500 FCFA' },
    { service: 'Livraison à Abidjan', tarif: 'À partir de 1 500 FCFA' },
    { service: 'Expédition hors Abidjan', tarif: 'À partir de 2 500 FCFA' }
  ];

  return (
    <PublicLayout>
      <section className="relative min-h-screen bg-gradient-to-br from-base-100 via-base-100 to-base-200 overflow-hidden">

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
                <Briefcase className="w-4 h-4" />
                Nos services
              </span>
              <span className="pr-3 flex items-center gap-1 text-xs font-semibold text-primary">
                <Sparkles className="w-3.5 h-3.5 fill-primary" />
                Logistique simplifiée
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-secondary leading-[0.95] tracking-tighter mb-6">
              Nos{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                  services
                </span>
                <span className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-primary/60 to-transparent rounded-full"></span>
              </span>
            </h1>

            <p className="text-base-content/75 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-medium">
              Stockage, gestion des stocks, closing, préparation, livraison et dépôt :
              confiez-nous la gestion opérationnelle de vos commandes et concentrez-vous
              sur le développement de votre activité.
            </p>
          </div>

          {/* ==================== GRILLE DES SERVICES ==================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div key={index} className="group relative">
                  {/* Halo au survol */}
                  <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative h-full bg-base-100 border border-base-300 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden flex flex-col">

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
                      {service.title}
                    </h3>

                    {/* Description */}
                    <p className="relative text-sm text-base-content/65 leading-relaxed mb-4">
                      {service.description}
                    </p>

                    {/* Détails */}
                    <ul className="relative space-y-1.5 mb-4">
                      {service.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-base-content/60">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Prix */}
                    <div className="relative mt-auto pt-4 border-t border-base-300 flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-base-content/50">
                        Tarif
                      </span>
                      <span className="text-sm font-black text-primary text-right">
                        {service.price}
                      </span>
                    </div>

                    {/* Lien */}
                    <Link
                      to={service.link}
                      className="relative inline-flex items-center gap-1.5 text-primary text-sm font-bold group/link mt-3"
                    >
                      En savoir plus
                      <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform duration-300" />
                    </Link>

                  </div>
                </div>
              );
            })}
          </div>

          {/* ==================== TABLEAU DES TARIFS ==================== */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 px-1 py-1 rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30 shadow-lg shadow-primary/10 mb-4">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-primary-content text-xs font-bold uppercase tracking-wider">
                  <Award className="w-4 h-4" />
                  Nos tarifs
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-secondary leading-[1.05] tracking-tighter mb-4">
                Tarifs de{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                    référence
                  </span>
                  <span className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-primary/60 to-transparent rounded-full"></span>
                </span>
              </h2>

              <p className="text-base-content/70 text-lg leading-relaxed max-w-2xl mx-auto font-medium">
                Des prix clairs, visibles et compréhensibles. Les conditions
                particulières sont précisées avant la prise en charge.
              </p>
            </div>

            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-transparent to-secondary/20 rounded-3xl blur-2xl opacity-60" />

              <div className="relative bg-base-100/80 backdrop-blur-sm border border-base-300 rounded-3xl overflow-hidden shadow-xl">
                <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent"></div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-base-200 border-b border-base-300">
                        <th className="text-left px-6 py-4 text-xs font-black uppercase tracking-wider text-base-content/60">
                          Service
                        </th>
                        <th className="text-right px-6 py-4 text-xs font-black uppercase tracking-wider text-base-content/60">
                          Tarif retenu
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tarifs.map((t, i) => (
                        <tr
                          key={i}
                          className="border-b border-base-300 last:border-0 hover:bg-primary/5 transition-colors duration-200"
                        >
                          <td className="px-6 py-4 text-sm font-semibold text-secondary">
                            {t.service}
                          </td>
                          <td className="px-6 py-4 text-sm font-black text-primary text-right whitespace-nowrap">
                            {t.tarif}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 bg-base-200/50 border-t border-base-300">
                  <p className="text-xs text-base-content/55 leading-relaxed">
                    <span className="font-bold text-secondary">Conditions particulières :</span>{' '}
                    le stockage est facturé au m³ à partir de 1 m³, la préparation standard est gratuite
                    selon les conditions convenues, et les prix de livraison sont des tarifs de départ
                    (le montant final dépend de la destination et du colis).
                  </p>
                </div>
              </div>
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
                  Créez votre compte partenaire ou demandez un devis personnalisé
                  pour découvrir comment StockAcha peut prendre en charge vos commandes.
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

export default ServicesPage;