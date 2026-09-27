// src/components/site/Testimonials.jsx

import React, { useState, useEffect } from 'react';
import { Star, Quote, Loader2, AlertCircle } from 'lucide-react';
import axiosInstance from '../../AxiosInstance';

const Testimonials = () => {
  const [temoignages, setTemoignages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================================
  // FONCTION POUR OBTENIR L'URL DE L'IMAGE
  // ============================================================
  const getImageUrl = (item) => {
    if (!item) return null;
    
    // Priorité 1: image du modèle
    if (item.image) {
      if (item.image.startsWith('http')) {
        return item.image;
      }
      return `${axiosInstance.defaults.baseURL}${item.image}`;
    }
    
    // Priorité 2: avatar_url du modèle
    if (item.avatar_url) {
      if (item.avatar_url.startsWith('http')) {
        return item.avatar_url;
      }
      return `${axiosInstance.defaults.baseURL}${item.avatar_url}`;
    }
    
    return null;
  };

  // ============================================================
  // CHARGEMENT DES TÉMOIGNAGES DEPUIS L'API
  // ============================================================
  useEffect(() => {
    const fetchTemoignages = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('Token');
        const headers = token ? { headers: { Authorization: `Token ${token}` } } : {};

        // Récupérer les témoignages publiés et à la une
        const response = await axiosInstance.get('/temoignages/?publie=true', headers);
        
        let temoignagesData = [];
        if (Array.isArray(response.data)) {
          temoignagesData = response.data;
        } else if (response.data?.results) {
          temoignagesData = response.data.results;
        }
        
        // Trier par ordre puis par date de création
        temoignagesData.sort((a, b) => {
          if (a.ordre !== b.ordre) return a.ordre - b.ordre;
          return new Date(b.date_creation) - new Date(a.date_creation);
        });
        
        setTemoignages(temoignagesData);
      } catch (error) {
        console.error('❌ Erreur chargement témoignages:', error);
        setError('Impossible de charger les témoignages. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchTemoignages();
  }, []);

  // ============================================================
  // FONCTION POUR AFFICHER LES ÉTOILES
  // ============================================================
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <section className="py-16 bg-base-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Quote className="w-4 h-4" />
              <span className="text-sm font-medium">Ils parlent de nous</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">Témoignages</h2>
            <p className="mt-3 text-base-content/60 text-lg">
              Découvrez ce que nos élèves, parents et enseignants pensent de notre établissement.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card bg-base-100 shadow-lg p-6 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-base-300"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-base-300 rounded w-3/4"></div>
                    <div className="h-3 bg-base-300 rounded w-1/2 mt-2"></div>
                  </div>
                </div>
                <div className="mt-3 flex gap-1">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="w-4 h-4 bg-base-300 rounded"></div>
                  ))}
                </div>
                <div className="mt-3">
                  <div className="h-16 bg-base-300 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ============================================================
  // RENDU - ERREUR
  // ============================================================
  if (error) {
    return (
      <section className="py-16 bg-base-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Quote className="w-4 h-4" />
              <span className="text-sm font-medium">Ils parlent de nous</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">Témoignages</h2>
            <p className="mt-3 text-base-content/60 text-lg">
              Découvrez ce que nos élèves, parents et enseignants pensent de notre établissement.
            </p>
          </div>
          <div className="text-center py-12 bg-base-100 rounded-xl">
            <AlertCircle className="w-12 h-12 text-error mx-auto" />
            <p className="text-error mt-2">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary btn-sm mt-4"
            >
              Réessayer
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ============================================================
  // RENDU - AUCUN TÉMOIGNAGE
  // ============================================================
  if (temoignages.length === 0) {
    return (
      <section className="py-16 bg-base-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Quote className="w-4 h-4" />
              <span className="text-sm font-medium">Ils parlent de nous</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">Témoignages</h2>
            <p className="mt-3 text-base-content/60 text-lg">
              Découvrez ce que nos élèves, parents et enseignants pensent de notre établissement.
            </p>
          </div>
          <div className="text-center py-12 bg-base-100 rounded-xl">
            <Quote className="w-12 h-12 text-base-300 mx-auto" />
            <p className="text-base-content/50 mt-2">Aucun témoignage pour le moment.</p>
          </div>
        </div>
      </section>
    );
  }

  // ============================================================
  // RENDU - PRINCIPAL
  // ============================================================
  return (
    <section className="py-16 bg-base-200">
      <div className="max-w-7xl mx-auto px-4">
        {/* En-tête */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Quote className="w-4 h-4" />
            <span className="text-sm font-medium">Ils parlent de nous</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">Témoignages</h2>
          <p className="mt-3 text-base-content/60 text-lg">
            Découvrez ce que nos élèves, parents et enseignants pensent de notre établissement.
          </p>
        </div>

        {/* Grille de témoignages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {temoignages.map((t) => {
            const imageUrl = getImageUrl(t);
            return (
              <div
                key={t.id}
                className="card bg-base-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 p-6"
              >
                {/* En-tête : avatar, nom, rôle */}
                <div className="flex items-center gap-4">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={t.nom}
                      className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '';
                        e.target.alt = t.nom;
                      }}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                      <span className="text-2xl font-bold text-primary">
                        {t.nom?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-base">{t.nom || 'Anonyme'}</h3>
                    <p className="text-sm text-base-content/50">{t.role || 'Témoignage'}</p>
                  </div>
                </div>

                {/* Étoiles */}
                <div className="flex items-center gap-0.5 mt-3">
                  {renderStars(t.note || 0)}
                  <span className="ml-2 text-sm text-base-content/50">{t.note || 0}/5</span>
                </div>

                {/* Citation */}
                <div className="mt-3 relative">
                  <Quote className="w-8 h-8 text-primary/10 absolute -top-1 -left-1" />
                  <p className="text-sm text-base-content/70 leading-relaxed pl-4">
                    {t.contenu || '...'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Appel à l'action */}
        <div className="mt-12 text-center">
          <p className="text-base-content/60">
            Vous aussi, rejoignez notre communauté et partagez votre expérience.
          </p>
          <button className="btn btn-ghost btn-sm mt-2 gap-2">
            Laissez un témoignage
          </button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;