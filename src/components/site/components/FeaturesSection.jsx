// src/components/site/FeaturesSection.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Users,
  Award,
  Lightbulb,
  Globe,
  Heart,
  Shield,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: BookOpen,
      title: 'Programmes académiques riches',
      description: 'Des cursus adaptés à chaque niveau, du primaire au lycée, avec un suivi personnalisé.',
      link: '/services'
    },
    {
      icon: Users,
      title: 'Communauté engagée',
      description: 'Une équipe pédagogique dévouée et des parents impliqués dans la vie de l\'école.',
      link: '/about'
    },
    {
      icon: Award,
      title: 'Excellence et reconnaissance',
      description: 'Des résultats aux examens parmi les meilleurs de la région, gages de notre qualité.',
      link: '/services'
    },
    {
      icon: Lightbulb,
      title: 'Innovation pédagogique',
      description: 'Des méthodes actives, des outils numériques et des projets interdisciplinaires.',
      link: '/services'
    },
    {
      icon: Globe,
      title: 'Ouverture internationale',
      description: 'Des échanges linguistiques et des partenariats avec des établissements à l\'étranger.',
      link: '/services'
    },
    {
      icon: Heart,
      title: 'Bien-être et inclusion',
      description: 'Un environnement bienveillant où chaque élève trouve sa place et s\'épanouit.',
      link: '/about'
    },
    {
      icon: Shield,
      title: 'Sécurité et confiance',
      description: 'Un cadre sécurisé, des protocoles stricts et une écoute attentive des familles.',
      link: '/about'
    },
    {
      icon: TrendingUp,
      title: 'Préparation à l\'avenir',
      description: 'Des compétences clés pour le 21e siècle : esprit critique, créativité, collaboration.',
      link: '/services'
    }
  ];

  return (
    <section className="py-16 bg-base-200">
      <div className="max-w-7xl mx-auto px-4">
        {/* En-tête de la section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Award className="w-4 h-4" />
            <span className="text-sm font-medium">Pourquoi nous choisir ?</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">Nos atouts</h2>
          <p className="mt-3 text-base-content/60 text-lg">
            Des valeurs et des services qui font la différence pour la réussite de vos enfants.
          </p>
        </div>

        {/* Grille de fonctionnalités */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="card bg-base-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 p-6 group"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-base-content/60 leading-relaxed">{feature.description}</p>
                <div className="mt-4">
                  <Link
                    to={feature.link}
                    className="text-primary text-sm font-medium inline-flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    En savoir plus <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Appel à l'action supplémentaire */}
        <div className="mt-16 text-center">
          <Link to="/contact" className="btn btn-primary btn-lg gap-2">
            Contactez-nous pour une visite <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;