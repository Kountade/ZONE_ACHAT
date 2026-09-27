// src/components/site/BlogPage.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from './Layout/PublicLayout';
import axiosInstance from '../AxiosInstance';
import {
  Calendar,
  User,
  Clock,
  Tag,
  Search,
  ArrowRight,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Award,
  Users,
  Loader2,
  AlertCircle
} from 'lucide-react';

const BlogPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');

  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const itemsPerPage = 6;

  // ============================================================
  // CHARGEMENT DES ARTICLES
  // ============================================================
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('Token');
        const headers = token ? { headers: { Authorization: `Token ${token}` } } : {};

        // 1. Charger les articles publiés
        const articlesRes = await axiosInstance.get('/articles/?statut=publie', headers);
        let articlesData = [];
        if (Array.isArray(articlesRes.data)) {
          articlesData = articlesRes.data;
        } else if (articlesRes.data?.results) {
          articlesData = articlesRes.data.results;
        }
        setArticles(articlesData);

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
        console.error('❌ Erreur chargement articles:', error);
        setError('Impossible de charger les articles. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  // ============================================================
  // FILTRES
  // ============================================================
  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          article.extrait?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Tous' || article.categorie_nom === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Articles à la une
  const featuredArticles = filteredArticles.filter(a => a.mise_en_avant);
  const regularArticles = filteredArticles.filter(a => !a.mise_en_avant);

  // Pagination
  const totalPages = Math.ceil(regularArticles.length / itemsPerPage);
  const paginatedArticles = regularArticles.slice(
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
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
            <p className="mt-4 text-base-content/60">Chargement des articles...</p>
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
            backgroundImage: 'url("https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1400&q=80")',
            backgroundColor: '#1a1a2e'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50"></div>
          <div className="relative z-10 text-center text-white px-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4 border border-white/10">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Actualités</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Blog</h1>
            <p className="mt-3 text-lg text-white/80 max-w-2xl mx-auto">
              Actualités, événements et vie de l'établissement
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
                  placeholder="Rechercher un article..."
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
          </div>

          {/* ===== FEATURED ARTICLES ===== */}
          {featuredArticles.length > 0 && searchTerm === '' && selectedCategory === 'Tous' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
              {featuredArticles.map((article) => (
                <div key={article.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all overflow-hidden">
                  <figure className="relative h-56">
                    {article.image ? (
                      <img
                        src={article.image}
                        alt={article.titre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-base-300 flex items-center justify-center">
                        <span className="text-4xl">📰</span>
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
                        {formatDate(article.date_publication || article.date_creation)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {article.auteur_nom || 'Administration'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.temps_lecture || 5} min
                      </span>
                    </div>
                    <h3 className="card-title text-xl">{article.titre}</h3>
                    <p className="text-base-content/60 line-clamp-2">{article.extrait}</p>
                    <div className="flex flex-wrap items-center justify-between mt-4">
                      <div className="flex gap-3 text-xs text-base-content/40">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {article.vues || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {article.likes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {article.commentaires_count || 0}
                        </span>
                      </div>
                      <Link to={`/blog/${article.slug || article.id}`} className="btn btn-primary btn-sm gap-1">
                        Lire la suite
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ===== ARTICLES GRID ===== */}
          {regularArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedArticles.map((article) => (
                <div key={article.id} className="card bg-base-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 overflow-hidden">
                  <figure className="relative h-48">
                    {article.image ? (
                      <img
                        src={article.image}
                        alt={article.titre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-base-300 flex items-center justify-center">
                        <span className="text-3xl">📄</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className="badge badge-ghost badge-sm">
                        {article.categorie_nom || 'Non catégorisé'}
                      </span>
                    </div>
                  </figure>
                  <div className="card-body p-5">
                    <div className="flex flex-wrap gap-2 items-center text-xs text-base-content/40">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(article.date_publication || article.date_creation)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.temps_lecture || 5} min
                      </span>
                    </div>
                    <h3 className="card-title text-base line-clamp-2">{article.titre}</h3>
                    <p className="text-sm text-base-content/50 line-clamp-2">{article.extrait}</p>
                    <div className="flex flex-wrap items-center justify-between mt-3">
                      <div className="flex items-center gap-2 text-xs text-base-content/40">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {article.auteur_nom || 'Administration'}
                        </span>
                      </div>
                      <Link to={`/blog/${article.slug || article.id}`} className="btn btn-primary btn-xs gap-1">
                        Lire
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-bold">Aucun article trouvé</h3>
              <p className="text-base-content/50">
                {searchTerm || selectedCategory !== 'Tous'
                  ? 'Aucun article ne correspond à vos critères'
                  : 'Aucun article publié pour le moment'}
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
    </PublicLayout>
  );
};

export default BlogPage;