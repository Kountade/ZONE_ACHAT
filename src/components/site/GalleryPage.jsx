// src/components/site/GalleryPage.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from './Layout/PublicLayout';
import axiosInstance from '../AxiosInstance';
import { 
  Search, 
  X, 
  Image as ImageIcon,
  Calendar,
  Users,
  MapPin,
  Camera,
  Heart,
  Share2,
  Download,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  LayoutGrid,
  List,
  Sparkles,
  Eye,
  Clock,
  Award,
  Loader2,
  AlertCircle,
  Tag,
  ArrowRight
} from 'lucide-react';

const GalleryPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [selectedImage, setSelectedImage] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const itemsPerPage = 6;

  // ============================================================
  // CHARGEMENT DES IMAGES
  // ============================================================
  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('Token');
        const headers = token ? { headers: { Authorization: `Token ${token}` } } : {};

        // 1. Charger les images de la galerie
        const imagesRes = await axiosInstance.get('/galerie/?actif=true', headers);
        let imagesData = [];
        if (Array.isArray(imagesRes.data)) {
          imagesData = imagesRes.data;
        } else if (imagesRes.data?.results) {
          imagesData = imagesRes.data.results;
        }
        setImages(imagesData);

        // 2. Charger les catégories
        const catRes = await axiosInstance.get('/categories/?actif=true', headers);
        let catData = [];
        if (Array.isArray(catRes.data)) {
          catData = catRes.data;
        } else if (catRes.data?.results) {
          catData = catRes.data.results;
        }
        setCategories(['Tous', ...catData.map(c => c.nom)]);

      } catch (error) {
        console.error('❌ Erreur chargement galerie:', error);
        setError('Impossible de charger la galerie. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  // ============================================================
  // FILTRES
  // ============================================================
  const filteredImages = images.filter(image => {
    const matchesSearch = image.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          image.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Tous' || image.categorie === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Images à la une
  const featuredImages = filteredImages.filter(a => a.mise_en_avant || (a.ordre !== undefined && a.ordre < 5));
  const regularImages = filteredImages.filter(a => !a.mise_en_avant && (a.ordre === undefined || a.ordre >= 5));

  // Pagination
  const totalPages = Math.ceil(regularImages.length / itemsPerPage);
  const paginatedImages = regularImages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ============================================================
  // FORMATAGE
  // ============================================================
  const formatDate = (date) => {
    if (!date) return 'Date inconnue';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // ============================================================
  // CONSTRUCTION URL IMAGE
  // ============================================================
  const getImageUrl = (image) => {
    if (!image) return null;
    if (image.startsWith('http')) return image;
    return `${axiosInstance.defaults.baseURL}${image}`;
  };

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
            <p className="mt-4 text-base-content/60">Chargement de la galerie...</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // ============================================================
  // RENDU - ERREUR
  // ============================================================
  if (error) {
    return (
      <PublicLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-error mx-auto" />
            <h3 className="text-xl font-bold mt-4 text-error">Oups !</h3>
            <p className="text-base-content/60 mt-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary mt-4"
            >
              Réessayer
            </button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // ============================================================
  // RENDU - PRINCIPAL
  // ============================================================
  return (
    <PublicLayout>
      <div className="min-h-screen bg-base-200">

        {/* ===== HERO ===== */}
        <div
          className="relative h-[40vh] flex items-center justify-center bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1400&q=80")',
            backgroundColor: '#1a1a2e'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50"></div>
          <div className="relative z-10 text-center text-white px-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4 border border-white/10">
              <Camera className="w-4 h-4" />
              <span className="text-sm font-medium">Notre Galerie</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Galerie</h1>
            <p className="mt-3 text-lg text-white/80 max-w-2xl mx-auto">
              Découvrez notre établissement en images
            </p>
          </div>
        </div>

        {/* ===== CONTENU ===== */}
        <div className="max-w-7xl mx-auto px-4 py-12">

          {/* ===== SEARCH & FILTERS ===== */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Rechercher une image..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input input-bordered w-full pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ===== FEATURED IMAGES ===== */}
          {featuredImages.length > 0 && searchTerm === '' && selectedCategory === 'Tous' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
              {featuredImages.slice(0, 2).map((image) => (
                <div 
                  key={image.id} 
                  className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all overflow-hidden cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  <figure className="relative h-56">
                    {image.image ? (
                      <img
                        src={getImageUrl(image.image)}
                        alt={image.titre}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-base-300 flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-base-content/30" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="badge badge-primary badge-lg">À la une</span>
                    </div>
                  </figure>
                  <div className="card-body">
                    <div className="flex flex-wrap gap-2 items-center text-xs text-base-content/50">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(image.date_creation)}
                      </span>
                      {image.categorie && (
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {image.categorie}
                        </span>
                      )}
                    </div>
                    <h3 className="card-title text-xl">{image.titre}</h3>
                    {image.description && (
                      <p className="text-base-content/60 line-clamp-2">{image.description}</p>
                    )}
                    <div className="flex flex-wrap items-center justify-between mt-4">
                      <div className="flex gap-3 text-xs text-base-content/40">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {image.vues || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {image.likes || 0}
                        </span>
                      </div>
                      <button 
                        className="btn btn-primary btn-sm gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(image);
                        }}
                      >
                        Voir
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ===== IMAGES GRID ===== */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedImages.map((image) => (
                <div 
                  key={image.id} 
                  className="card bg-base-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 overflow-hidden cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  <figure className="relative h-48">
                    {image.image ? (
                      <img
                        src={getImageUrl(image.image)}
                        alt={image.titre}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-base-300 flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-base-content/30" />
                      </div>
                    )}
                    {image.categorie && (
                      <div className="absolute top-2 right-2">
                        <span className="badge badge-ghost badge-sm">
                          {image.categorie}
                        </span>
                      </div>
                    )}
                  </figure>
                  <div className="card-body p-5">
                    <div className="flex flex-wrap gap-2 items-center text-xs text-base-content/40">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(image.date_creation)}
                      </span>
                    </div>
                    <h3 className="card-title text-base line-clamp-2">{image.titre}</h3>
                    {image.description && (
                      <p className="text-sm text-base-content/50 line-clamp-2">{image.description}</p>
                    )}
                    <div className="flex flex-wrap items-center justify-between mt-3">
                      <div className="flex items-center gap-2 text-xs text-base-content/40">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {image.vues || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {image.likes || 0}
                        </span>
                      </div>
                      <button 
                        className="btn btn-primary btn-xs gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(image);
                        }}
                      >
                        Voir
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ===== LIST VIEW ===== */}
          {viewMode === 'list' && (
            <div className="space-y-4">
              {paginatedImages.map((image) => (
                <div 
                  key={image.id} 
                  className="card bg-base-100 shadow-lg hover:shadow-2xl transition-all overflow-hidden cursor-pointer flex flex-col md:flex-row"
                  onClick={() => setSelectedImage(image)}
                >
                  <div className="md:w-48 h-48 md:h-auto relative overflow-hidden">
                    {image.image ? (
                      <img 
                        src={getImageUrl(image.image)} 
                        alt={image.titre} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-base-300 flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-base-content/30" />
                      </div>
                    )}
                  </div>
                  <div className="card-body flex-1 p-4">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        <h3 className="card-title text-base">{image.titre}</h3>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-base-content/40">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(image.date_creation)}
                          </span>
                          {image.categorie && (
                            <span className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {image.categorie}
                            </span>
                          )}
                        </div>
                        {image.description && (
                          <p className="text-sm text-base-content/50 mt-2 line-clamp-2">{image.description}</p>
                        )}
                      </div>
                      {image.categorie && (
                        <span className="badge badge-ghost">{image.categorie}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between mt-3">
                      <div className="flex items-center gap-3 text-xs text-base-content/40">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {image.vues || 0} vues
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {image.likes || 0} likes
                        </span>
                      </div>
                      <button 
                        className="btn btn-primary btn-xs gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(image);
                        }}
                      >
                        Voir
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ===== NO RESULTS ===== */}
          {filteredImages.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🖼️</div>
              <h3 className="text-xl font-bold">Aucune image trouvée</h3>
              <p className="text-base-content/50">
                {searchTerm || selectedCategory !== 'Tous'
                  ? 'Aucune image ne correspond à vos critères'
                  : 'Aucune image dans la galerie pour le moment'}
              </p>
            </div>
          )}

          {/* ===== PAGINATION ===== */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn btn-ghost btn-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`btn btn-sm ${currentPage === i + 1 ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-ghost btn-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===== MODAL ===== */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl w-full bg-base-100 rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-4 right-4 z-10 btn btn-circle btn-ghost btn-sm text-white hover:bg-white/20"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-5 h-5" />
            </button>
            {selectedImage.image ? (
              <img 
                src={getImageUrl(selectedImage.image)} 
                alt={selectedImage.titre} 
                className="w-full max-h-[60vh] object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '';
                }}
              />
            ) : (
              <div className="w-full max-h-[60vh] bg-base-300 flex items-center justify-center">
                <ImageIcon className="w-24 h-24 text-base-content/30" />
              </div>
            )}
            <div className="p-6">
              <h3 className="text-xl font-bold">{selectedImage.titre}</h3>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-base-content/60">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(selectedImage.date_creation)}
                </span>
                {selectedImage.categorie && (
                  <span className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    {selectedImage.categorie}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {selectedImage.vues || 0} vues
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  {selectedImage.likes || 0} likes
                </span>
              </div>
              {selectedImage.description && (
                <p className="mt-3 text-base-content/70">{selectedImage.description}</p>
              )}
              <div className="flex gap-2 mt-4">
                <button className="btn btn-primary btn-sm gap-1">
                  <Heart className="w-4 h-4" />
                  J'aime
                </button>
                <button className="btn btn-ghost btn-sm gap-1">
                  <Share2 className="w-4 h-4" />
                  Partager
                </button>
                <button className="btn btn-ghost btn-sm gap-1">
                  <Download className="w-4 h-4" />
                  Télécharger
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PublicLayout>
  );
};

export default GalleryPage;