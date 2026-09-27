// src/components/site/Testimonials.jsx
import React from 'react';
import { Star, Quote, Sparkles, Building2, User } from 'lucide-react';

// ============================================================
// ✅ TÉMOIGNAGES FICTIFS (statiques - pas d'API)
// ============================================================
const temoignagesFictifs = [
  {
    id: 1,
    nom: 'Amadou Diallo',
    role: 'Directeur — Diallo & Frères SARL',
    note: 5,
    contenu:
      "Un partenaire commercial fiable et réactif. Grâce à leur réseau de fournisseurs, nous avons réduit nos délais d'approvisionnement de 40% en un an.",
    image: null
  },
  {
    id: 2,
    nom: 'Fatou Ndiaye',
    role: 'Gérante — Boutique Élégance Dakar',
    note: 5,
    contenu:
      "Livraison toujours à l'heure, produits de qualité et un service client qui répond en quelques minutes. Je recommande vivement.",
    image: null
  },
  {
    id: 3,
    nom: 'Moussa Sow',
    role: 'Responsable Achats — Groupe Teranga',
    note: 5,
    contenu:
      "Leur expertise en import-export nous a ouvert de nouveaux marchés en Asie. Une équipe sérieuse, professionnelle et de confiance.",
    image: null
  },
  {
    id: 4,
    nom: 'Aïssatou Ba',
    role: 'Fondatrice — Cosmétiques Naturels',
    note: 4,
    contenu:
      "Accompagnement sur-mesure pour développer ma marque. Leur conseil stratégique m'a permis de doubler mon chiffre d'affaires en 8 mois.",
    image: null
  },
  {
    id: 5,
    nom: 'Cheikh Fall',
    role: 'PDG — Fall Distribution',
    note: 5,
    contenu:
      "Un partenaire de long terme. Des tarifs compétitifs, une logistique impeccable et une équipe qui tient toujours ses engagements.",
    image: null
  },
  {
    id: 6,
    nom: 'Mariama Cissé',
    role: 'Directrice Marketing — Sahel Foods',
    note: 5,
    contenu:
      "Leur service marketing a transformé notre communication. Visibilité en hausse, nouvelles opportunités B2B : que du positif.",
    image: null
  }
];

const Testimonials = () => {
  const temoignages = temoignagesFictifs;

  // ============================================================
  // ÉTOILES
  // ============================================================
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-base-300'}`}
      />
    ));
  };

  return (
    <section className="relative py-24 bg-base-200 overflow-hidden">

      {/* ==================== FONDS DÉCORATIFS ==================== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
              <Quote className="w-4 h-4" />
              Ils parlent de nous
            </span>
            <span className="pr-3 flex items-center gap-1 text-xs font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5 fill-primary" />
              Avis clients
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-secondary leading-[1.05] tracking-tighter mb-6">
            Ce que disent{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                nos clients
              </span>
              <span className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-primary/60 to-transparent rounded-full"></span>
            </span>
          </h2>

          <p className="text-base-content/70 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-medium">
            Des entreprises et particuliers qui nous font confiance au quotidien
            pour leurs besoins commerciaux.
          </p>
        </div>

        {/* ==================== GRILLE DE TÉMOIGNAGES ==================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {temoignages.map((t) => (
            <div key={t.id} className="group relative">

              {/* Halo au survol */}
              <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative h-full bg-base-100 border border-base-300 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden">

                {/* Bande décorative */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Citation en filigrane */}
                <Quote className="absolute -top-2 -right-2 w-20 h-20 text-primary/5 group-hover:text-primary/10 transition-colors duration-500" />

                {/* En-tête : avatar + nom + rôle */}
                <div className="relative flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                    <span className="text-xl font-black text-primary">
                      {t.nom?.charAt(0)?.toUpperCase() || <User className="w-6 h-6" />}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base text-secondary truncate group-hover:text-primary transition-colors duration-300">
                      {t.nom}
                    </h3>
                    <p className="text-xs text-base-content/55 truncate">
                      {t.role}
                    </p>
                  </div>
                </div>

                {/* Étoiles */}
                <div className="relative flex items-center gap-1 mb-4">
                  {renderStars(t.note)}
                  <span className="ml-2 text-xs font-bold text-primary">
                    {t.note}/5
                  </span>
                </div>

                {/* Contenu */}
                <div className="relative">
                  <p className="text-sm text-base-content/70 leading-relaxed italic">
                    "{t.contenu}"
                  </p>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* ==================== CTA FINAL ==================== */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-transparent to-secondary/20 rounded-3xl blur-2xl opacity-60" />

            <div className="relative bg-base-100/80 backdrop-blur-sm border-2 border-primary/20 rounded-2xl p-8 text-center shadow-xl">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
                <Star className="w-7 h-7 text-primary fill-primary" />
              </div>

              <h3 className="text-xl md:text-2xl font-black text-secondary mb-3">
                Rejoignez nos <span className="text-primary">clients satisfaits</span>
              </h3>

              <p className="text-base-content/70 mb-6 max-w-lg mx-auto">
                Vous avez travaillé avec nous ? Partagez votre expérience
                et aidez d'autres entreprises à nous faire confiance.
              </p>

              <button className="group relative inline-flex">
                <span className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/60 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></span>
                <span className="relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-base bg-primary text-primary-content hover:-translate-y-1 transition-all duration-300 shadow-xl">
                  Laisser un témoignage
                  <Star className="w-5 h-5" />
                </span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Testimonials;