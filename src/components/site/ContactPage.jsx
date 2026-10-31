// src/components/site/ContactPage.jsx
import React from 'react';
import PublicLayout from './Layout/PublicLayout';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Clock,
  MessageSquare,
  Sparkles,
  Headphones,
  ArrowRight,
  Building2,
  User,
  CheckCircle2
} from 'lucide-react';

// ✅ Image de fond (carte de la Côte d'Ivoire)
import ivoryCoast from '../../assets/ivory-coast.svg';

const ContactPage = () => {
  // ============================================================
  // ✅ COORDONNÉES — StockAcha (Abidjan, Côte d'Ivoire)
  // ⚠️ TODO — Remplacer téléphone, email et adresse par les
  // coordonnées officielles avant publication (section 10 du doc).
  // ============================================================
  const contactMethods = [
    {
      icon: Mail,
      label: 'Email',
      value: 'contact@stockacha.com',
      link: 'mailto:contact@stockacha.com'
    },
    {
      icon: Phone,
      label: 'Téléphone',
      value: '+225 XX XX XX XX XX',
      link: 'tel:+2250000000000'
    },
    {
      icon: MapPin,
      label: 'Adresse',
      value: 'Abidjan, Côte d\'Ivoire',
      link: 'https://maps.google.com/?q=Abidjan'
    },
    {
      icon: Clock,
      label: 'Horaires',
      value: 'Lun – Ven : 8h – 18h',
      link: null
    }
  ];

  // ============================================================
  // ✅ SUJETS PROPOSÉS (adaptés aux services StockAcha)
  // ============================================================
  const sujets = [
    'Demande de devis stockage',
    'Closing et préparation de commandes',
    'Livraison et expédition',
    'Dépôt / stockage pour clients',
    'Vente sur ZonAcha',
    'Autre demande'
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
                <MessageSquare className="w-4 h-4" />
                Contact
              </span>
              <span className="pr-3 flex items-center gap-1 text-xs font-semibold text-primary">
                <Sparkles className="w-3.5 h-3.5 fill-primary" />
                Réponse rapide
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-secondary leading-[0.95] tracking-tighter mb-6">
              Parlons de votre{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                  logistique
                </span>
                <span className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-primary/60 to-transparent rounded-full"></span>
              </span>
            </h1>

            <p className="text-base-content/75 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-medium">
              Une question sur le stockage, le closing, la préparation ou la livraison ?
              Notre équipe vous répond et vous accompagne dans votre projet.
            </p>
          </div>

          {/* ==================== COORDONNÉES ==================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
            {contactMethods.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="group relative">
                  {/* Halo au survol */}
                  <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative h-full bg-base-100 border border-base-300 rounded-2xl p-6 text-center shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden">

                    {/* Bande décorative haut */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Icône */}
                    <div className="relative flex justify-center mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:from-primary group-hover:to-primary/80 group-hover:scale-110 transition-all duration-300 shadow-sm">
                        <Icon className="w-7 h-7 text-primary group-hover:text-primary-content transition-colors duration-300" />
                      </div>
                    </div>

                    {/* Label */}
                    <p className="relative text-xs font-black uppercase tracking-wider text-base-content/50 mb-2">
                      {item.label}
                    </p>

                    {/* Valeur */}
                    {item.link ? (
                      <a
                        href={item.link}
                        target={item.link.startsWith('http') ? '_blank' : undefined}
                        rel={item.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="relative text-sm font-bold text-secondary hover:text-primary transition-colors duration-300 break-words"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <span className="relative text-sm font-bold text-secondary break-words">
                        {item.value}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ==================== FORMULAIRE + INFOS ==================== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">

            {/* Colonne formulaire (2/3) */}
            <div className="lg:col-span-2">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-transparent to-secondary/20 rounded-3xl blur-2xl opacity-60" />

                <div className="relative bg-base-100/80 backdrop-blur-sm border border-base-300 rounded-3xl shadow-xl overflow-hidden">

                  <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent"></div>

                  <div className="p-8 md:p-10">

                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-md">
                        <Send className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-2xl md:text-3xl font-black text-secondary tracking-tight">
                          Envoyez-nous un message
                        </h2>
                        <p className="text-sm text-base-content/55 mt-1">
                          Réponse sous 24h ouvrées
                        </p>
                      </div>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        alert('Formulaire soumis (à connecter au backend)');
                      }}
                      className="space-y-5"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-base-content/50 mb-2">
                            Nom complet
                          </label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                            <input
                              type="text"
                              placeholder="Votre nom"
                              className="input input-bordered w-full pl-11 bg-base-100 border-base-300 focus:border-primary focus:outline-none"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-base-content/50 mb-2">
                            Email
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                            <input
                              type="email"
                              placeholder="votre@email.com"
                              className="input input-bordered w-full pl-11 bg-base-100 border-base-300 focus:border-primary focus:outline-none"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-base-content/50 mb-2">
                          Téléphone <span className="text-base-content/40 font-medium normal-case">(facultatif)</span>
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                          <input
                            type="tel"
                            placeholder="+225 XX XX XX XX XX"
                            className="input input-bordered w-full pl-11 bg-base-100 border-base-300 focus:border-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-base-content/50 mb-2">
                          Sujet
                        </label>
                        <select
                          className="select select-bordered w-full bg-base-100 border-base-300 focus:border-primary focus:outline-none"
                          required
                          defaultValue=""
                        >
                          <option value="" disabled>Choisissez un sujet</option>
                          {sujets.map((s, i) => (
                            <option key={i} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-base-content/50 mb-2">
                          Message
                        </label>
                        <textarea
                          className="textarea textarea-bordered w-full h-32 bg-base-100 border-base-300 focus:border-primary focus:outline-none resize-none"
                          placeholder="Décrivez votre besoin : volume de stockage, nombre de commandes, destinations de livraison..."
                          required
                        ></textarea>
                      </div>

                      <button type="submit" className="group relative inline-flex w-full md:w-auto">
                        <span className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/60 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></span>
                        <span className="relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-base bg-primary text-primary-content hover:-translate-y-1 transition-all duration-300 shadow-xl">
                          Envoyer le message
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </button>
                    </form>

                  </div>
                </div>
              </div>
            </div>

            {/* Colonne info (1/3) */}
            <div className="lg:col-span-1 space-y-5">

              {/* Bloc « Pourquoi nous écrire » */}
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-transparent to-secondary/20 rounded-3xl blur-2xl opacity-60" />

                <div className="relative bg-base-100/80 backdrop-blur-sm border border-base-300 rounded-3xl p-6 shadow-xl">

                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-4">
                    <Headphones className="w-6 h-6 text-primary" />
                  </div>

                  <h3 className="text-lg font-black text-secondary mb-3">
                    Un accompagnement <span className="text-primary">sur-mesure</span>
                  </h3>

                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 text-sm text-base-content/70">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Réponse sous 24h ouvrées</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-base-content/70">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Devis personnalisé selon votre volume</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-base-content/70">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Conseil sur le closing et la préparation</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-base-content/70">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Livraison Abidjan & hors Abidjan</span>
                    </li>
                  </ul>

                </div>
              </div>

              {/* Bloc « Compte partenaire » */}
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-secondary/20 via-transparent to-primary/20 rounded-3xl blur-2xl opacity-60" />

                <div className="relative bg-base-100/80 backdrop-blur-sm border-2 border-primary/20 rounded-3xl p-6 shadow-xl">

                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-4">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>

                  <h3 className="text-lg font-black text-secondary mb-2">
                    Déjà partenaire ?
                  </h3>

                  <p className="text-sm text-base-content/65 mb-4 leading-relaxed">
                    Accédez à votre espace sécurisé pour suivre vos stocks,
                    vos commandes, vos frais et vos paiements.
                  </p>

                  <a
                    href="/connexion"
                    className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:gap-3 transition-all duration-300"
                  >
                    Se connecter
                    <ArrowRight className="w-4 h-4" />
                  </a>

                </div>
              </div>

            </div>

          </div>

          {/* ==================== CARTE / LOCALISATION ==================== */}
          <div className="max-w-5xl mx-auto">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-transparent to-secondary/20 rounded-3xl blur-2xl opacity-60" />

              <div className="relative bg-base-100/80 backdrop-blur-sm border border-base-300 rounded-3xl overflow-hidden shadow-xl">

                <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent"></div>

                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-black text-secondary tracking-tight">
                        Nous trouver
                      </h2>
                      <p className="text-xs text-base-content/55 mt-0.5">
                        Abidjan, Côte d'Ivoire
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl overflow-hidden border border-base-300">
                    <iframe
                      title="Localisation StockAcha — Abidjan"
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d254343.98155501852!2d-4.1556026!3d5.360054!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfc1ea5311959123%3A0x3d4e3f8a7a1c5e0!2sAbidjan%2C%20C%C3%B4te%20d%27Ivoire!5e0!3m2!1sfr!2sci!4v1700000000000!5m2!1sfr!2sci"
                      width="100%"
                      height="320"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="w-full"
                    ></iframe>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ==================== SIGNATURE ==================== */}
          <p className="text-center text-sm font-bold text-base-content/60 mt-12">
            StockAcha — Votre stock, notre logistique, votre tranquillité.
          </p>

        </div>
      </section>
    </PublicLayout>
  );
};

export default ContactPage;