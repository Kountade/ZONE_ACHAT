// src/components/gestion/GestionCours.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, Calendar, RefreshCw,
  X, CheckCircle, AlertCircle, Eye, Filter,
  ChevronLeft, ChevronRight, Grid3x3, List,
  BookOpen, MoreVertical, User, Clock, MapPin,
  GraduationCap, School
} from 'lucide-react';

const GestionCours = () => {
  const navigate = useNavigate();
  const [cours, setCours] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [classes, setClasses] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [classeFilter, setClasseFilter] = useState('all');
  const [jourFilter, setJourFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [coursToDelete, setCoursToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [viewMode, setViewMode] = useState('list');
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);

  const JOURS = [
    { value: 'lundi', label: 'Lundi' },
    { value: 'mardi', label: 'Mardi' },
    { value: 'mercredi', label: 'Mercredi' },
    { value: 'jeudi', label: 'Jeudi' },
    { value: 'vendredi', label: 'Vendredi' },
    { value: 'samedi', label: 'Samedi' },
  ];

  // Récupérer les informations de l'utilisateur connecté
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('User');
      return userData ? JSON.parse(userData) : null;
    } catch { return null; }
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ ...notification, show: false }), 4000);
  };

  // Vérifier si l'utilisateur est un professeur
  const isProfesseur = () => {
    const user = getUserData();
    return user?.role === 'professeur' || user?.role === 'enseignant';
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const user = getUserData();
      setUserRole(user?.role || null);
      setUserId(user?.id || null);

      const isProf = user?.role === 'professeur' || user?.role === 'enseignant';

      // Récupérer les cours
      let coursRes;
      if (isProf && user?.id) {
        // 🔒 Si c'est un professeur, récupérer uniquement ses cours
        console.log('👨‍🏫 Professeur connecté, récupération de ses cours uniquement');
        coursRes = await axiosInstance.get(`/cours/?enseignant=${user.id}`);
      } else {
        // Admin/Direction voit tous les cours
        coursRes = await axiosInstance.get('/cours/');
      }

      const [matieresRes, classesRes, enseignantsRes] = await Promise.all([
        axiosInstance.get('/matieres/'),
        axiosInstance.get('/classes/'),
        axiosInstance.get('/users/?role=enseignant')
      ]);

      setCours(Array.isArray(coursRes.data) ? coursRes.data : []);
      setMatieres(Array.isArray(matieresRes.data) ? matieresRes.data : []);
      setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
      setEnseignants(Array.isArray(enseignantsRes.data) ? enseignantsRes.data : []);

      console.log(`📊 ${coursRes.data.length} cours chargés`);

    } catch (error) {
      console.error('Erreur chargement:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée, veuillez vous reconnecter', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement des cours', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!coursToDelete) return;
    
    // Vérifier si l'utilisateur a le droit de supprimer
    const user = getUserData();
    const isProf = user?.role === 'professeur' || user?.role === 'enseignant';
    
    if (isProf) {
      showNotification('Les professeurs ne peuvent pas supprimer des cours', 'error');
      setShowDeleteModal(false);
      setCoursToDelete(null);
      return;
    }

    try {
      await axiosInstance.delete(`/cours/${coursToDelete.id}/`);
      showNotification('Cours supprimé avec succès', 'success');
      fetchData();
      setShowDeleteModal(false);
      setCoursToDelete(null);
    } catch (error) {
      console.error('Erreur suppression:', error);
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const safeCours = Array.isArray(cours) ? cours : [];
  const safeMatieres = Array.isArray(matieres) ? matieres : [];
  const safeClasses = Array.isArray(classes) ? classes : [];
  const safeEnseignants = Array.isArray(enseignants) ? enseignants : [];

  const filteredCours = safeCours.filter(c => {
    const matchSearch = !searchTerm ||
      (c.matiere_nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (c.classe_nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (c.enseignant_nom?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchClasse = classeFilter === 'all' || c.classe === Number(classeFilter);
    const matchJour = jourFilter === 'all' || c.jour === jourFilter;

    return matchSearch && matchClasse && matchJour;
  });

  const totalPages = Math.ceil(filteredCours.length / itemsPerPage);
  const paginatedCours = filteredCours.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total: safeCours.length,
    parJour: JOURS.map(j => ({
      ...j,
      count: safeCours.filter(c => c.jour === j.value).length
    }))
  };

  const getMatiereNom = (id) => {
    const matiere = safeMatieres.find(m => m.id === id);
    return matiere ? matiere.nom : 'Inconnue';
  };

  const getClasseNom = (id) => {
    const classe = safeClasses.find(c => c.id === id);
    return classe ? classe.nom : 'Inconnue';
  };

  const getEnseignantNom = (id) => {
    const enseignant = safeEnseignants.find(e => e.id === id);
    return enseignant ? (enseignant.full_name || enseignant.email || 'Enseignant') : 'Inconnu';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12 sm:w-16 sm:h-16"></div>
          <p className="text-base sm:text-xl font-semibold text-base-content/70 animate-pulse">
            Chargement des cours...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen">
      {/* Notification Toast */}
      {notification.show && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl text-sm sm:text-base rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification({ ...notification, show: false })}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {showDeleteModal && coursToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-base-content/70">Voulez-vous vraiment supprimer ce cours ?</p>
              <p className="font-semibold text-error mt-2">{coursToDelete.matiere_nom}</p>
              <p className="text-sm text-gray-500 mt-1">{coursToDelete.classe_nom} - {coursToDelete.jour}</p>
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button className="btn btn-ghost flex-1" onClick={() => setShowDeleteModal(false)}>Annuler</button>
              <button className="btn btn-error flex-1 gap-2" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl"></div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Calendar className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary">
                {isProfesseur() ? 'Mes Cours' : 'Cours'}
              </h1>
            </div>
            <p className="text-sm text-base-content/60 ml-1">
              {isProfesseur() 
                ? `Vous avez ${stats.total} cours à votre charge`
                : `Gérez les cours – ${stats.total} cours`
              }
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchData} className="btn btn-sm sm:btn-md btn-outline gap-2 hover:bg-primary/10 transition-all">
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            {/* 🔒 Seuls les admins peuvent ajouter des cours */}
            {!isProfesseur() && (
              <button onClick={() => navigate('/cours/nouveau')} className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white border-none shadow-lg hover:shadow-xl transition-all gap-2">
                <Plus className="w-4 h-4" />
                Nouveau cours
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats par jour */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {stats.parJour.map(j => (
          <div key={j.value} className="card bg-white shadow-md rounded-xl border border-gray-200">
            <div className="card-body p-2 sm:p-3 text-center">
              <p className="text-xs text-gray-500 font-medium uppercase">{j.label}</p>
              <p className="text-lg sm:text-xl font-bold text-primary">{j.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={isProfesseur() ? "Rechercher dans mes cours..." : "Rechercher par matière, classe ou enseignant..."}
              className="input input-bordered w-full pl-9 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline btn-sm sm:hidden gap-2">
            <Filter className="w-4 h-4" /> {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
          </button>
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-3 gap-3`}>
            <select className="select select-bordered w-full focus:border-primary" value={classeFilter} onChange={(e) => { setClasseFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Toutes les classes</option>
              {safeClasses.map(c => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
            <select className="select select-bordered w-full focus:border-primary" value={jourFilter} onChange={(e) => { setJourFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les jours</option>
              {JOURS.map(j => (
                <option key={j.value} value={j.value}>{j.label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button className="btn btn-outline gap-2 flex-1 hover:bg-primary/10 transition-all" onClick={() => { setClasseFilter('all'); setJourFilter('all'); setSearchTerm(''); setCurrentPage(1); }}>
                <RefreshCw className="w-4 h-4" /> Réinitialiser
              </button>
              <div className="join">
                <button onClick={() => setViewMode('list')} className={`join-item btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}>
                  <List className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('grid')} className={`join-item btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}>
                  <Grid3x3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau / Grille */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        {paginatedCours.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                <Calendar className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">
                {isProfesseur() ? 'Aucun cours ne vous est assigné' : 'Aucun cours trouvé'}
              </p>
              {!isProfesseur() && (
                <button onClick={() => navigate('/cours/nouveau')} className="btn btn-primary btn-sm gap-2 mt-2">
                  <Plus className="w-4 h-4" /> Ajouter un cours
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'list' ? (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-white text-sm">
                      <th className="py-4 font-semibold">Matière</th>
                      <th className="py-4 font-semibold">Classe</th>
                      <th className="py-4 font-semibold">Enseignant</th>
                      <th className="py-4 font-semibold">Jour</th>
                      <th className="py-4 font-semibold">Horaire</th>
                      <th className="py-4 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCours.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <BookOpen className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-semibold">{c.matiere_nom}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="badge badge-primary badge-sm">{c.classe_nom}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{c.enseignant_nom}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="badge badge-ghost">{c.jour}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>{c.heure_debut} - {c.heure_fin}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => navigate(`/cours/${c.id}`)} className="btn btn-ghost btn-sm btn-circle" title="Détails">
                              <Eye className="w-4 h-4" />
                            </button>
                            {/* 🔒 Seuls les admins peuvent modifier/supprimer */}
                            {!isProfesseur() && (
                              <>
                                <button onClick={() => navigate(`/cours/${c.id}/modifier`)} className="btn btn-ghost btn-sm btn-circle" title="Modifier">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => { setCoursToDelete(c); setShowDeleteModal(true); }} className="btn btn-ghost btn-sm btn-circle text-error" title="Supprimer">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {paginatedCours.map(c => (
                  <div key={c.id} className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{c.matiere_nom}</h3>
                            <span className="badge badge-primary badge-xs">{c.classe_nom}</span>
                          </div>
                        </div>
                        <div className="dropdown dropdown-end">
                          <button className="btn btn-ghost btn-sm btn-circle">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          <ul className="dropdown-menu dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-52">
                            <li><button onClick={() => navigate(`/cours/${c.id}`)}><Eye className="w-4 h-4" /> Voir détails</button></li>
                            {/* 🔒 Seuls les admins peuvent modifier/supprimer */}
                            {!isProfesseur() && (
                              <>
                                <li><button onClick={() => navigate(`/cours/${c.id}/modifier`)}><Edit className="w-4 h-4" /> Modifier</button></li>
                                <li><button onClick={() => { setCoursToDelete(c); setShowDeleteModal(true); }} className="text-error"><Trash2 className="w-4 h-4" /> Supprimer</button></li>
                              </>
                            )}
                          </ul>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{c.enseignant_nom}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{c.jour}</span>
                        <Clock className="w-4 h-4 text-gray-400 ml-2" />
                        <span>{c.heure_debut} - {c.heure_fin}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {filteredCours.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Affichage de <span className="font-semibold text-primary">{((currentPage-1)*itemsPerPage)+1}</span> à{' '}
                <span className="font-semibold text-primary">{Math.min(currentPage*itemsPerPage, filteredCours.length)}</span>{' '}
                sur <span className="font-semibold">{filteredCours.length}</span> cours
              </div>
              <div className="flex items-center gap-3">
                <select className="select select-bordered select-sm" value={itemsPerPage} onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}>
                  <option value="5">5 lignes</option>
                  <option value="10">10 lignes</option>
                  <option value="15">15 lignes</option>
                  <option value="20">20 lignes</option>
                </select>
                <div className="join">
                  <button className="join-item btn btn-sm" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1}>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i+1;
                    else if (currentPage <= 3) pageNum = i+1;
                    else if (currentPage >= totalPages-2) pageNum = totalPages-4+i;
                    else pageNum = currentPage-2+i;
                    return (
                      <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`join-item btn btn-sm ${currentPage === pageNum ? 'btn-primary text-white' : ''}`}>
                        {pageNum}
                      </button>
                    );
                  })}
                  <button className="join-item btn btn-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionCours;