// src/components/site/NewsletterSection.jsx
import React, { useState } from 'react';
import { Mail, Send, CheckCircle, Sparkles, Zap, Bell, TrendingUp } from 'lucide-react';

const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ici vous connecterez la logique d'inscription (API, Mailchimp, etc.)
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <section className="relative py-24 bg-base-200 overflow-hidden">

      {/* ==================== FONDS DÉCORATIFS ==================== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/15 blur-[120px] animate-pulse" />
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

      <div className="relative z-10 max-w-4xl mx-auto px-4">

        {/* ==================== EN-TÊTE ==================== */}
        <div className="text-center mb-12">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-1 py-1 rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30 shadow-lg shadow-primary/10 mb-6">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-primary-content text-xs sm:text-sm font-bold uppercase tracking-wider">
              <Bell className="w-4 h-4" />
              Newsletter
            </span>
            <span className="pr-3 flex items-center gap-1 text-xs font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5 fill-primary" />
              Exclusif
            </span>
          </div>

          {/* Titre impactant */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-secondary leading-[1.05] tracking-tighter mb-6">
            Restez{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                informés
              </span>
              <span className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-primary/60 to-transparent rounded-full"></span>
            </span>
          </h2>

          <p className="text-base-content/70 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-medium">
            Offres commerciales, nouveaux produits, opportunités B2B :
            recevez l'essentiel directement dans votre boîte mail.
          </p>
        </div>

        {/* ==================== FORMULAIRE IMPACTANT ==================== */}
        <div className="relative">

          {/* Halo pulsant */}
          <div className="absolute -inset-2 bg-gradient-to-r from-primary/30 via-transparent to-secondary/30 rounded-3xl blur-2xl opacity-70" />

          <div className="relative bg-base-100 border-2 border-primary/20 rounded-3xl p-8 md:p-12 shadow-2xl">

            {/* Bande décorative haut */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-primary/60 to-transparent rounded-t-3xl" />

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">

              {/* Input */}
              <div className="relative flex-1 group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary group-focus-within:scale-110 transition-transform" />
                <input
                  type="email"
                  placeholder="Votre adresse email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-14 pr-5 py-5 rounded-2xl bg-base-200 border-2 border-base-300 text-base-content placeholder-base-content/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300 text-base font-medium"
                />
              </div>

              {/* Bouton */}
              <button
                type="submit"
                disabled={submitted}
                className="group relative w-full sm:w-auto"
              >
                <span className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/60 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative flex items-center justify-center gap-3 px-8 py-5 rounded-2xl font-black text-lg bg-primary text-primary-content hover:-translate-y-1 transition-all duration-300 shadow-xl whitespace-nowrap">
                  {submitted ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Inscrit !
                    </>
                  ) : (
                    <>
                      S'abonner
                      <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>

            </form>

            {/* Confidentialité */}
            <div className="mt-6 flex items-start gap-3 text-sm text-base-content/55">
              <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="leading-relaxed">
                En vous abonnant, vous acceptez de recevoir nos communications.
                Vos données sont sécurisées et vous pouvez vous désinscrire à tout moment.
              </span>
            </div>

            {/* Badges de confiance */}
            <div className="mt-8 pt-6 border-t border-base-300 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              <span className="flex items-center gap-2 text-sm font-bold text-secondary">
                <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                Pas de spam
              </span>
              <span className="flex items-center gap-2 text-sm font-bold text-secondary">
                <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-primary" />
                </div>
                Désinscription facile
              </span>
              <span className="flex items-center gap-2 text-sm font-bold text-secondary">
                <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                Contenu exclusif
              </span>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default NewsletterSection;