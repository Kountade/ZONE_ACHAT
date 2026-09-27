// src/components/site/AboutPage.jsx
import React from 'react';
import PublicLayout from './Layout/PublicLayout';
import { Target, Heart, Shield, Lightbulb } from 'lucide-react';

const AboutPage = () => {
  const values = [
    { icon: Target, title: 'Excellence Académique', value: 'Nous visons l\'excellence dans tout ce que nous faisons' },
    { icon: Heart, title: 'Bienveillance', value: 'Un environnement respectueux et bienveillant' },
    { icon: Shield, title: 'Intégrité', value: 'La transparence et l\'honnêteté sont nos valeurs' },
    { icon: Lightbulb, title: 'Innovation Pédagogique', value: 'Nous innovons constamment pour mieux enseigner' }
  ];

  return (
    <PublicLayout>
      <div className="min-h-screen bg-base-200 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-2">À propos de nous</h1>
          <p className="text-center text-base-content/60 mb-8">Découvrez notre établissement et nos valeurs</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {values.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="card bg-base-100 shadow-lg p-6 text-center hover:shadow-xl transition-all">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-base-content/60">{item.value}</p>
                </div>
              );
            })}
          </div>

          <div className="card bg-base-100 shadow-xl p-6">
            <h2 className="text-xl font-bold mb-4">Notre Mission</h2>
            <p className="text-base-content/70 leading-relaxed">
              Offrir une éducation de qualité et un environnement d'apprentissage exceptionnel 
              qui prépare les élèves à réussir dans un monde en constante évolution.
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default AboutPage;