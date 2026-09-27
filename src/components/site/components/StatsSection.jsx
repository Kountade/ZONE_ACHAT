// src/components/site/StatsSection.jsx
import React from 'react';
import { Users, BookOpen, Award, Calendar, Building, GraduationCap, Heart, TrendingUp } from 'lucide-react';

const StatsSection = () => {
  const stats = [
    { icon: Users, value: '500+', label: 'Élèves scolarisés' },
    { icon: Building, value: '45', label: 'Salles de classe' },
    { icon: GraduationCap, value: '98%', label: 'Taux de réussite aux examens' },
    { icon: Award, value: '35', label: 'Enseignants expérimentés' },
    { icon: Calendar, value: '30+', label: 'Événements par an' },
    { icon: BookOpen, value: '20', label: 'Partenariats pédagogiques' },
    { icon: Heart, value: '100%', label: 'Satisfaction des parents' },
    { icon: TrendingUp, value: '15', label: 'Années d\'excellence' },
  ];

  return (
    <section className="py-16 bg-base-100">
      <div className="max-w-7xl mx-auto px-4">
        {/* En-tête */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Chiffres clés</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">L'école en quelques chiffres</h2>
          <p className="mt-3 text-base-content/60 text-lg">
            Des résultats et des engagements qui parlent d'eux‑mêmes.
          </p>
        </div>

        {/* Grille de statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="card bg-base-200 shadow-md hover:shadow-xl transition-all p-6 text-center hover:-translate-y-1"
              >
                <div className="flex justify-center">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-primary mt-3">{stat.value}</div>
                <div className="text-sm text-base-content/60 mt-1">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Message de confiance */}
        <div className="mt-12 text-center max-w-2xl mx-auto bg-primary/5 rounded-xl p-6 border border-primary/10">
          <p className="text-base-content/70">
            Ces chiffres reflètent notre engagement quotidien pour offrir une éducation de qualité
            et un cadre propice à l'épanouissement de chaque élève.
          </p>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;