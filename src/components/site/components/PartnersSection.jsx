// src/components/site/components/PartnersSection.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Handshake, ExternalLink } from 'lucide-react';
import axiosInstance from '../../AxiosInstance';

const PartnersSection = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  // ============================================================
  // CHARGEMENT DES PARTENAIRES DEPUIS L'API
  // ============================================================
  useEffect(() => {
    const fetchPartners = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('Token');
        const headers = token ? { headers: { Authorization: `Token ${token}` } } : {};

        const response = await axiosInstance.get('/partenaires/?est_actif=true', headers);
        
        let partnersData = [];
        if (Array.isArray(response.data)) {
          partnersData = response.data;
        } else if (response.data?.results) {
          partnersData = response.data.results;
        }
        
        setPartners(partnersData);
      } catch (error) {
        console.error('❌ Erreur chargement partenaires:', error);
        setError('Impossible de charger les partenaires. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  // ============================================================
  // ANIMATION DU CARROUSEL
  // ============================================================
  useEffect(() => {
    if (partners.length === 0) return;

    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationId;
    let scrollPosition = 0;
    const speed = 0.5; // Vitesse de défilement (ajuste selon besoin)

    const animate = () => {
      if (!scrollContainer) return;
      
      scrollPosition += speed;
      
      // Si on a dépassé la moitié du contenu, on revient au début
      const totalWidth = scrollContainer.scrollWidth / 2;
      if (scrollPosition >= totalWidth) {
        scrollPosition = 0;
      }
      
      scrollContainer.scrollLeft = scrollPosition;
      animationId = requestAnimationFrame(animate);
    };

    // Démarrer l'animation
    animationId = requestAnimationFrame(animate);

    // Mettre en pause au survol
    const handleMouseEnter = () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };

    const handleMouseLeave = () => {
      animationId = requestAnimationFrame(animate);
    };

    scrollContainer.addEventListener('mouseenter', handleMouseEnter);
    scrollContainer.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (scrollContainer) {
        scrollContainer.removeEventListener('mouseenter', handleMouseEnter);
        scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [partners]);

  // ============================================================
  // CONSTRUCTION URL IMAGE
  // ============================================================
  const getImageUrl = (image) => {
    if (!image) return null;
    if (image.startsWith('http')) return image;
    return `${axiosInstance.defaults.baseURL}${image}`;
  };

  // Doubler les partenaires pour l'effet infini
  const doubledPartners = [...partners, ...partners];

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <section className="py-16 bg-base-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Handshake className="w-4 h-4" />
              <span className="text-sm font-medium">Nos partenaires</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">Ils nous font confiance</h2>
            <p className="mt-3 text-base-content/60 text-lg">
              Des partenaires engagés à nos côtés pour offrir le meilleur à nos élèves.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card bg-base-200 shadow-md p-4 text-center animate-pulse">
                <div className="w-20 h-20 rounded-full bg-base-300 mx-auto"></div>
                <div className="h-4 bg-base-300 rounded mt-3 w-3/4 mx-auto"></div>
                <div className="h-3 bg-base-300 rounded mt-2 w-1/2 mx-auto"></div>
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
      <section className="py-16 bg-base-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-error">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-primary btn-sm mt-4"
          >
            Réessayer
          </button>
        </div>
      </section>
    );
  }

  // ============================================================
  // RENDU - AUCUN PARTENAIRE
  // ============================================================
  if (partners.length === 0) {
    return (
      <section className="py-16 bg-base-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Handshake className="w-4 h-4" />
              <span className="text-sm font-medium">Nos partenaires</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">Ils nous font confiance</h2>
            <p className="mt-3 text-base-content/60 text-lg">
              Des partenaires engagés à nos côtés pour offrir le meilleur à nos élèves.
            </p>
          </div>
          <div className="text-center py-12 bg-base-200 rounded-xl">
            <p className="text-base-content/50">Aucun partenaire pour le moment.</p>
          </div>
        </div>
      </section>
    );
  }

  // ============================================================
  // RENDU - CARROUSEL INFINI
  // ============================================================
  return (
    <section className="py-16 bg-base-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        {/* En-tête */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Handshake className="w-4 h-4" />
            <span className="text-sm font-medium">Nos partenaires</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">Ils nous font confiance</h2>
          <p className="mt-3 text-base-content/60 text-lg">
            Des partenaires engagés à nos côtés pour offrir le meilleur à nos élèves.
          </p>
        </div>

        {/* Carrousel */}
        <div 
          ref={scrollRef}
          className="flex gap-6 overflow-x-hidden scroll-smooth"
          style={{ 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <style>
            {`
              .partners-scroll::-webkit-scrollbar {
                display: none;
              }
            `}
          </style>
          <div className="flex gap-6 flex-nowrap partners-scroll">
            {doubledPartners.map((partner, index) => (
              <div
                key={`${partner.id}-${index}`}
                className="flex-shrink-0 w-[150px] sm:w-[180px] lg:w-[200px] card bg-base-200 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 p-4 text-center"
              >
                <div className="flex justify-center">
                  {partner.image_url ? (
                    <img
                      src={getImageUrl(partner.image_url)}
                      alt={partner.nom}
                      className="w-20 h-20 rounded-full object-cover border-2 border-base-300"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '';
                        e.target.alt = partner.nom;
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-base-300 flex items-center justify-center text-2xl font-bold text-base-content/30">
                      {partner.nom?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-sm mt-3 truncate">{partner.nom}</h3>
                {partner.url && (
                  <a
                    href={partner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Visiter <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {partner.description && (
                  <p className="text-xs text-base-content/50 mt-2 max-h-[2.5em] overflow-hidden text-ellipsis">
                    {partner.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Appel à l'action */}
        <div className="mt-12 text-center bg-primary/5 rounded-xl p-6 border border-primary/10 max-w-2xl mx-auto">
          <p className="text-base-content/70">
            Vous souhaitez rejoindre notre réseau de partenaires ?
          </p>
          <button className="btn btn-primary btn-sm mt-3 gap-2">
            Devenir partenaire
          </button>
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;