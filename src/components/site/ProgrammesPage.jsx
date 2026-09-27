// src/components/site/ProgrammesPage.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from './Layout/PublicLayout';
import axiosInstance from '../AxiosInstance';
import {
  Search,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  Clock as ClockIcon,
  Bell,
  Award,
  BookOpen,
  Globe,
  Briefcase,
  GraduationCap,
  Heart,
  Shield,
  Lightbulb,
  Star,
  TrendingUp,
  ArrowRight,
  School,
  Compass,
  Target,
  Zap,
  Brain,
  Layers,
  PenTool,
  Loader2,
  AlertCircle
} from 'lucide-react';

const ProgrammesPage = () => {
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [categories, setCategories] = useState(['Tous']);

  // Icônes par niveau
  const getNiveauIcon = (niveau) => {
    const map = {
      'primaire': School,
      'college': Compass,
      'lycee': Target,
      'tous': Layers
    };
    return map[niveau] || BookOpen;
  };

  // Icônes par catégorie
  const getCategoryIcon = (categorieNom) => {
    const map = {
      'Scientifique': Brain,
      'Langues': Globe,
      'Littéraire': PenTool,
      'Artistique': PenTool,
      'Primaire': School,
      'Collège': Compass,
      'Lycée': Target
    };
    return map[categorieNom] || BookOpen;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  // Récupération des programmes depuis l'API
  const fetchProgrammes = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('Token');
      const headers = token ? { headers: { Authorization: `Token ${token}` } } : {};
      
      const res = await axiosInstance.get('/programmes/?statut=publie', headers);
      
      let programmesData = [];
      if (Array.isArray(res.data)) {
        programmesData = res.data;
      } else if (res.data?.results) {
        programmesData = res.data.results;
      } else if (typeof res.data === 'object') {
        programmesData = Object.values(res.data).filter(item => item && typeof item === 'object' && item.id);
      }
      
      setProgrammes(programmesData);

      // Extraire les catégories uniques
      const uniqueCategories = ['Tous'];
      programmesData.forEach(p => {
        if (p.categorie_nom && !uniqueCategories.includes(p.categorie_nom)) {
          uniqueCategories.push(p.categorie_nom);
        }
      });
      setCategories(uniqueCategories);

    } catch (error) {
      console.error('Erreur chargement programmes:', error);
      setError('Impossible de charger les programmes. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgrammes();
  }, []);

  // Filtrer les programmes
  const filteredProgrammes = programmes.filter(programme => {
    const matchesSearch = programme.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          programme.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          programme.extrait?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Tous' || programme.categorie_nom === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Programmes populaires (est_populaire = true)
  const popularProgrammes = filteredProgrammes.filter(p => p.est_populaire);
  const regularProgrammes = filteredProgrammes.filter(p => !p.est_populaire);

  // Fonction pour obtenir l'URL complète de l'image
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    const baseURL = axiosInstance.defaults.baseURL || 'http://localhost:8000';
    return `${baseURL}${imagePath}`;
  };

  const getNiveauLabel = (niveau) => {
    const map = {
      'primaire': 'Primaire',
      'college': 'Collège',
      'lycee': 'Lycée',
      'tous': 'Tous niveaux'
    };
    return map[niveau] || niveau;
  };

  const getDureeLabel = (duree) => {
    const map = {
      '1_an': '1 an',
      '2_ans': '2 ans',
      '3_ans': '3 ans',
      '4_ans': '4 ans',
      '5_ans': '5 ans',
      'variable': 'Variable'
    };
    return map[duree] || duree;
  };

  // ============================================================
  // RENDU
  // ============================================================
  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-base-200 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
            <p className="text-base-content/70">Chargement des programmes...</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (error) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-base-200 flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
            <h3 className="text-xl font-bold text-error">Erreur</h3>
            <p className="text-base-content/70">{error}</p>
            <button onClick={fetchProgrammes} className="btn btn-primary mt-4">
              Réessayer
            </button>
          </div>
        </div>
      </PublicLayout>
    );
  }

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
              <GraduationCap className="w-4 h-4" />
              <span className="text-sm font-medium">Nos Programmes</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Programmes Éducatifs</h1>
            <p className="mt-3 text-lg text-white/80 max-w-2xl mx-auto">
              Des parcours d'excellence pour chaque élève
            </p>
            <p className="text-sm text-white/50 mt-2">
              {programmes.length} programme(s) disponible(s)
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
                  placeholder="Rechercher un programme..."
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

          {/* ===== PROGRAMMES POPULAIRES ===== */}
          {popularProgrammes.length > 0 && searchTerm === '' && selectedCategory === 'Tous' && (
            <div className="mb-12">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Programmes phares
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {popularProgrammes.map((programme) => {
                  const Icon = getNiveauIcon(programme.niveau);
                  const imageUrl = getImageUrl(programme.image_url);
                  return (
                    <div key={programme.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all overflow-hidden">
                      <figure className="relative h-48">
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={programme.titre} 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                            <BookOpen className="w-16 h-16 text-primary/30" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <span className="badge badge-secondary badge-sm gap-1">
                            <Star className="w-3 h-3" />
                            Populaire
                          </span>
                        </div>
                      </figure>
                      <div className="card-body">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="card-title text-lg">{programme.titre}</h3>
                            <div className="text-xs text-base-content/40">{programme.categorie_nom || 'Sans catégorie'}</div>
                          </div>
                        </div>
                        <p className="text-base-content/60 text-sm">{programme.extrait || programme.description}</p>
                        {programme.points_forts && programme.points_forts.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {programme.points_forts.slice(0, 4).map((feature, idx) => (
                              <span key={idx} className="badge badge-ghost badge-sm">{feature}</span>
                            ))}
                            {programme.points_forts.length > 4 && (
                              <span className="badge badge-ghost badge-sm">+{programme.points_forts.length - 4}</span>
                            )}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center justify-between mt-2 text-sm">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1 text-xs">
                              <Clock className="w-3 h-3" />
                              {getDureeLabel(programme.duree)}
                            </span>
                            <span className="flex items-center gap-1 text-xs">
                              <Users className="w-3 h-3" />
                              {getNiveauLabel(programme.niveau)}
                            </span>
                          </div>
                          <Link to={`/programme/${programme.id}`} className="btn btn-primary btn-sm gap-1">
                            En savoir plus <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== TOUS LES PROGRAMMES - 3 colonnes ===== */}
          {filteredProgrammes.length > 0 ? (
            <div>
              {searchTerm === '' && selectedCategory === 'Tous' && popularProgrammes.length > 0 && (
                <h2 className="text-xl font-bold mb-4">Tous les programmes</h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(searchTerm !== '' || selectedCategory !== 'Tous' ? filteredProgrammes : regularProgrammes).map((programme) => {
                  const Icon = getNiveauIcon(programme.niveau);
                  const imageUrl = getImageUrl(programme.image_url);
                  return (
                    <div key={programme.id} className="card bg-base-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 overflow-hidden">
                      <figure className="relative h-40">
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={programme.titre} 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                            <BookOpen className="w-12 h-12 text-primary/30" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <span className="badge badge-ghost badge-sm">{programme.categorie_nom || 'Sans catégorie'}</span>
                        </div>
                        {programme.est_populaire && (
                          <div className="absolute top-2 left-2">
                            <span className="badge badge-secondary badge-sm gap-1">
                              <Star className="w-3 h-3" />
                              Populaire
                            </span>
                          </div>
                        )}
                      </figure>
                      <div className="card-body p-4">
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm line-clamp-1">{programme.titre}</h3>
                            <p className="text-xs text-base-content/50 line-clamp-2">{programme.extrait || programme.description}</p>
                          </div>
                        </div>
                        {programme.points_forts && programme.points_forts.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {programme.points_forts.slice(0, 3).map((feature, idx) => (
                              <span key={idx} className="badge badge-ghost badge-xs">{feature}</span>
                            ))}
                            {programme.points_forts.length > 3 && (
                              <span className="badge badge-ghost badge-xs">+{programme.points_forts.length - 3}</span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-3 text-xs text-base-content/50">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getDureeLabel(programme.duree)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {getNiveauLabel(programme.niveau)}
                            </span>
                          </div>
                          <Link to={`/programme/${programme.id}`} className="btn btn-primary btn-xs gap-1">
                            Détails
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold">Aucun programme trouvé</h3>
              <p className="text-base-content/50">Essayez de modifier votre recherche</p>
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default ProgrammesPage;