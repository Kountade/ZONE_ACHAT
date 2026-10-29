// src/components/site/StatsSection.jsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Boxes,
  PackageCheck,
  Truck,
  ClipboardCheck,
  Users,
  Wallet,
  BarChart3,
  Award,
  Sparkles
} from 'lucide-react';

// ✅ Image de fond (carte de la Côte d'Ivoire)

import ivoryCoast from '../../../assets/ivory-coast.svg';

// ============================================================
// ⚠️ TODO — Chiffres à faire valider par le directeur de StockAcha.
// Les valeurs ci-dessous sont des PLACEHOLDERS neutres, pas des
// chiffres réels. Remplacer par les données vérifiées avant publication.
// ============================================================
const stats = [
  { icon: Boxes,          value: 0,  suffix: ' m³', label: 'Capacité de stockage',     desc: 'Espace disponible' /* TODO */ },
  { icon: PackageCheck,   value: 0,  suffix: '+',  label: 'Commandes préparées',      desc: 'Depuis le lancement' /* TODO */ },
  { icon: Truck,          value: 2,  suffix: '',   label: 'Zones de livraison',       desc: 'Abidjan & hors Abidjan' },
  { icon: ClipboardCheck, value: 500, suffix: ' FCFA', label: 'Closing par commande', desc: 'Commande effectivement livrée' },
  { icon: Users,          value: 0,  suffix: '+',  label: 'Partenaires actifs',       desc: 'Commerçants & vendeurs en ligne' /* TODO */ },
  { icon: Wallet,         value: 3,  suffix: '',   label: 'Fréquences de reversement', desc: 'Quotidien, hebdo, mensuel' },
  { icon: BarChart3,      value: 25, suffix: ' 000 FCFA', label: 'Stockage / m³ / mois', desc: 'À partir de 1 m³' },
  { icon: Award,          value: 100, suffix: '%', label: 'Traçabilité des mouvements', desc: 'Entrées & sorties historisées' }
];

// ✅ Compteur animé simple
const AnimatedNumber = ({ end, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const animate = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
            else setCount(end);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString('fr-FR')}
      {suffix}
    </span>
  );
};

const StatsSection = () => {
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
              <BarChart3 className="w-4 h-4" />
              Chiffres clés
            </span>
            <span className="pr-3 flex items-center gap-1 text-xs font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5 fill-primary" />
              Transparence
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-secondary leading-[1.05] tracking-tighter mb-6">
            StockAcha en{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                chiffres
              </span>
              <span className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-primary/60 to-transparent rounded-full"></span>
            </span>
          </h2>

          <p className="text-base-content/70 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-medium">
            Des tarifs clairs, des règles transparentes et un engagement
            quotidien pour simplifier votre logistique.
          </p>
        </div>

        {/* ==================== GRILLE DE STATS ==================== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="group relative">

                {/* Halo au survol */}
                <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative h-full bg-base-200 border border-base-300 rounded-2xl p-6 text-center shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden">

                  {/* Bande décorative haut */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Numéro en filigrane */}
                  <span className="absolute -top-2 right-3 text-6xl font-black text-base-300/40 leading-none select-none">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  {/* Icône */}
                  <div className="relative flex justify-center mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:from-primary group-hover:to-primary/80 group-hover:scale-110 transition-all duration-300 shadow-sm">
                      <Icon className="w-7 h-7 text-primary group-hover:text-primary-content transition-colors duration-300" />
                    </div>
                  </div>

                  {/* Valeur animée */}
                  <div className="relative text-2xl md:text-3xl font-black text-primary leading-none mb-2">
                    <AnimatedNumber end={stat.value} suffix={stat.suffix} />
                  </div>

                  {/* Label */}
                  <p className="relative font-bold text-sm md:text-base text-secondary leading-tight mb-1">
                    {stat.label}
                  </p>

                  {/* Description */}
                  <p className="relative text-xs text-base-content/55 leading-tight">
                    {stat.desc}
                  </p>

                </div>
              </div>
            );
          })}
        </div>

        {/* ==================== MESSAGE DE CONFIANCE ==================== */}
        <div className="mt-16 max-w-3xl mx-auto">

          {/* Halo */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-transparent to-secondary/20 rounded-3xl blur-2xl opacity-60" />

          <div className="relative bg-base-200/80 backdrop-blur-sm border-2 border-primary/20 rounded-2xl p-8 text-center shadow-xl">

            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
              <Award className="w-6 h-6 text-primary" />
            </div>

            <p className="text-base-content/80 text-lg font-medium leading-relaxed mb-3">
              Notre engagement : vous permettre de savoir quels produits vous possédez,
              quelles quantités sont disponibles et comment votre stock évolue.
              <span className="text-primary font-bold"> Votre tranquillité, notre priorité.</span>
            </p>

            <p className="text-sm text-base-content/55 italic">
              — L'équipe StockAcha {new Date().getFullYear()}
            </p>

          </div>
        </div>

      </div>
    </section>
  );
};

export default StatsSection;