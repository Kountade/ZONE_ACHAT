// src/components/classes/GestionClassesDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Edit, Trash2, FileText, Printer,
  School, Users, AlertCircle, CheckCircle, Loader2,
  Clock, X, ChevronRight, BadgeCheck, BookOpen, UserPlus,
  Book, List, Grid, Search, Eye, UserRound, Download, RefreshCw,
  Wifi, WifiOff, AlertTriangle, Info, Archive,
  BarChart3, ClipboardList
} from 'lucide-react';

const GestionClassesDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [classe, setClasse] = useState(null);
  const [eleves, setEleves] = useState([]);
  const [cours, setCours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingEleves, setLoadingEleves] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [viewMode, setViewMode] = useState('list');
  const [activeTab, setActiveTab] = useState('eleves');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // ============================================================
  // CONNEXION
  // ============================================================
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  // ============================================================
  // CHARGEMENT CLASSE
  // ============================================================
  const fetchClasse = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      const headers = { headers: { Authorization: `Token ${token}` } };

      const [classeRes, niveauxRes, enseignantsRes, anneesRes] = await Promise.all([
        axiosInstance.get(`/classes/${id}/`, headers),
        axiosInstance.get('/niveaux/', headers).catch(() => ({ data: [] })),
        axiosInstance.get('/professeurs/', headers).catch(() => ({ data: [] })),
        axiosInstance.get('/annees-scolaires/', headers).catch(() => ({ data: [] }))
      ]);

      const data = classeRes.data;
      const niveauNom = niveauxRes.data?.find(n => n.id === data.niveau)?.nom
                        || data.niveau_nom || 'Niveau inconnu';
      const professeurNom = enseignantsRes.data?.find(e => e.id === data.professeur_principal)?.nom_complet
                            || data.professeur_nom || 'Non assigné';
      const anneeLibelle = anneesRes.data?.find(a => a.id === data.annee_scolaire)?.libelle
                           || data.annee_libelle || 'Année inconnue';

      setClasse({
        id: data.id || id,
        nom: data.nom || 'Classe non renseignée',
        code: data.code || '',
        niveau: data.niveau || null,
        niveau_nom: niveauNom,
        capacite: data.capacite || 0,
        description: data.description || '',
        statut: data.statut || 'active',
        annee_scolaire: data.annee_scolaire || null,
        annee_libelle: anneeLibelle,
        professeur_principal: data.professeur_principal || null,
        professeur_nom: professeurNom,
        salle: data.salle || '',
        date_creation: data.date_creation || null,
        date_modification: data.date_modification || null,
      });

      await Promise.all([
        fetchElevesDeLaClasse(),
        fetchCoursDeLaClasse()
      ]);

    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        setError('Classe non trouvée');
      } else {
        setError('Erreur lors du chargement');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // ✅ CHARGEMENT ÉLÈVES — Le backend filtre déjà par ?classe=X
  // ============================================================
  const fetchElevesDeLaClasse = async () => {
    setLoadingEleves(true);
    try {
      const token = localStorage.getItem('Token');
      const response = await axiosInstance.get(`/eleves/?classe=${id}`, {
        headers: { Authorization: `Token ${token}` }
      });

      let elevesData = [];
      if (Array.isArray(response.data)) {
        elevesData = response.data;
      } else if (response.data?.results) {
        elevesData = response.data.results;
      } else if (typeof response.data === 'object' && response.data !== null) {
        elevesData = Object.values(response.data).filter(item => item?.id);
      }

      console.log(`✅ ${elevesData.length} élèves chargés pour la classe ${id}`);
      setEleves(elevesData);
    } catch (error) {
      console.error('❌ Erreur chargement élèves:', error);
      setEleves([]);
    } finally {
      setLoadingEleves(false);
    }
  };

  // ============================================================
  // CHARGEMENT COURS
  // ============================================================
  const fetchCoursDeLaClasse = async () => {
    try {
      const token = localStorage.getItem('Token');
      const response = await axiosInstance.get(`/cours/?classe=${id}`, {
        headers: { Authorization: `Token ${token}` }
      });

      let coursData = [];
      if (Array.isArray(response.data)) {
        coursData = response.data;
      } else if (response.data?.results) {
        coursData = response.data.results;
      }
      setCours(coursData);
    } catch (error) {
      console.error('❌ Erreur chargement cours:', error);
      setCours([]);
    }
  };

  useEffect(() => {
    if (id) {
      fetchClasse();
    } else {
      setError('ID de classe manquant');
      setLoading(false);
    }
  }, [id]);

  const handleRefresh = () => {
    fetchClasse();
    showNotification('Données actualisées', 'success');
  };

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.delete(`/classes/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Classe supprimée avec succès', 'success');
      setTimeout(() => navigate('/classes'), 1500);
    } catch (error) {
      if (error.response?.status === 403) {
        showNotification("Vous n'avez pas la permission de supprimer", 'error');
      } else if (error.response?.status === 400) {
        showNotification('Impossible : des élèves sont rattachés', 'error');
      } else {
        showNotification('Erreur lors de la suppression', 'error');
      }
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // ============================================================
  // PDF
  // ============================================================
  const goToPdfView = () => navigate(`/classes/${id}/pdf`);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const token = localStorage.getItem('Token');
      const response = await axiosInstance.get(`/classes/${id}/pdf/`, {
        headers: { Authorization: `Token ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Classe_${classe?.nom || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showNotification('PDF téléchargé', 'success');
    } catch (error) {
      showNotification('Erreur téléchargement PDF', 'error');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrintPDF = async () => {
    try {
      const token = localStorage.getItem('Token');
      const response = await axiosInstance.get(`/classes/${id}/pdf/`, {
        headers: { Authorization: `Token ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const win = window.open(url, '_blank');
      win?.focus();
      if (win) win.onload = () => setTimeout(() => win.print(), 500);
      showNotification('PDF ouvert pour impression', 'success');
    } catch (error) {
      showNotification("Erreur impression PDF", 'error');
    }
  };

  // ============================================================
  // FORMATAGE
  // ============================================================
  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    } catch { return '-'; }
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return '-'; }
  };

  const getStatutBadge = (statut) => {
    const map = { active: 'badge-success', inactive: 'badge-error',
                  archived: 'badge-info', complete: 'badge-warning' };
    return map[statut] || 'badge-ghost';
  };

  const getStatutLabel = (statut) => {
    const map = { active: 'Active', inactive: 'Inactive',
                  archived: 'Archivée', complete: 'Complète' };
    return map[statut] || statut || 'Inconnu';
  };

  const getStatutIcon = (statut) => {
    const map = { active: CheckCircle, inactive: X,
                  archived: Archive, complete: BadgeCheck };
    return map[statut] || CheckCircle;
  };

  const getSexeLabel = (sexe) => {
    if (sexe === 'M' || sexe === 'm') return 'Masculin';
    if (sexe === 'F' || sexe === 'f') return 'Féminin';
    return 'Non spécifié';
  };

  const getJourLabel = (jour) => {
    const jours = { lundi: 'Lundi', mardi: 'Mardi', mercredi: 'Mercredi',
                    jeudi: 'Jeudi', vendredi: 'Vendredi', samedi: 'Samedi',
                    dimanche: 'Dimanche' };
    return jours[jour] || jour;
  };

  const getCoursTypeLabel = (type) => {
    const map = { cours: 'Cours', td: 'TD', tp: 'TP' };
    return map[type] || type || 'Cours';
  };

  const filteredEleves = eleves.filter(e => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      (e.nom || '').toLowerCase().includes(s) ||
      (e.prenom || '').toLowerCase().includes(s) ||
      (e.matricule || '').toLowerCase().includes(s) ||
      (e.email || '').toLowerCase().includes(s)
    );
  });

  const stats = {
    totalEleves: eleves.length,
    garcons: eleves.filter(e => (e.sexe || e.genre) === 'M').length,
    filles: eleves.filter(e => (e.sexe || e.genre) === 'F').length,
    totalCours: cours.length
  };

  const tauxRemplissage = classe?.capacite > 0
    ? Math.round((stats.totalEleves / classe.capacite) * 100) : 0;
  const estPleine = stats.totalEleves >= classe?.capacite && classe?.capacite > 0;

  // ============================================================
  // CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] w-full bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-base font-semibold text-gray-500 mt-4">Chargement...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERREUR
  // ============================================================
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] w-full bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-error" />
          </div>
          <h3 className="text-xl font-bold text-error mt-4">{error}</h3>
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={() => navigate('/classes')} className="btn btn-primary gap-2">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <button onClick={fetchClasse} className="btn btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!classe) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] w-full bg-gray-50">
        <div className="text-center">
          <School className="w-16 h-16 text-gray-300 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-500 mt-4">Aucune donnée</h3>
          <button onClick={() => navigate('/classes')} className="btn btn-primary gap-2 mt-6">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>
      </div>
    );
  }

  const StatutIcon = getStatutIcon(classe.statut);

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">

      {/* NOTIFICATION */}
      {notification.show && (
        <div className="fixed top-20 right-4 sm:right-6 z-50">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ?
                <CheckCircle className="w-4 h-4" /> :
                <AlertCircle className="w-4 h-4" />}
              <span className="font-medium text-sm">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle"
                    onClick={() => setNotification(prev => ({ ...prev, show: false }))}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      {showDeleteModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p>Voulez-vous vraiment supprimer cette classe ?</p>
              <p className="font-semibold text-error mt-2 text-lg">{classe.nom}</p>
              {stats.totalEleves > 0 && (
                <div className="flex items-center justify-center gap-2 text-sm text-warning mt-3">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{stats.totalEleves} élève(s) rattaché(s)</span>
                </div>
              )}
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button className="btn btn-ghost flex-1" onClick={() => setShowDeleteModal(false)}>
                Annuler
              </button>
              <button className="btn btn-error flex-1 gap-2" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EN-TÊTE */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/classes')} className="btn btn-ghost btn-sm gap-2">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                <School className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  {classe.nom}
                  {classe.statut === 'active' && <BadgeCheck className="w-5 h-5 text-success" />}
                </h1>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="font-mono">
                    {classe.code || `CL-${String(classe.id).padStart(6, '0')}`}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span>{classe.niveau_nom}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span>{classe.annee_libelle}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className={`badge ${isOnline ? 'badge-success' : 'badge-error'} gap-1 px-2 py-2 text-xs`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </div>
            <button onClick={goToPdfView} className="btn btn-sm btn-outline gap-2">
              <Eye className="w-4 h-4" /> Aperçu PDF
            </button>
            <button onClick={handleDownloadPDF}
                    className="btn btn-sm btn-outline gap-2 text-success"
                    disabled={isGeneratingPDF}>
              {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Télécharger PDF
            </button>
            <button onClick={handlePrintPDF} className="btn btn-sm btn-outline gap-2">
              <Printer className="w-4 h-4" /> Imprimer
            </button>
            <button onClick={() => navigate(`/classes/${id}/modifier`)}
                    className="btn btn-sm btn-primary gap-2">
              <Edit className="w-4 h-4" /> Modifier
            </button>
            <button onClick={() => setShowDeleteModal(true)}
                    className="btn btn-sm btn-error gap-2">
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* STATS RAPIDES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Niveau</p>
          <p className="text-sm font-semibold truncate">{classe.niveau_nom}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Année</p>
          <p className="text-sm font-semibold text-primary truncate">{classe.annee_libelle}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Effectif</p>
          <p className="text-sm font-semibold">
            {stats.totalEleves} / {classe.capacite || '∞'}
          </p>
          {classe.capacite > 0 && (
            <p className={`text-xs ${estPleine ? 'text-error' : 'text-success'}`}>
              {tauxRemplissage}%
            </p>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Professeur</p>
          <p className="text-sm font-semibold truncate">{classe.professeur_nom}</p>
        </div>
      </div>

      {/* BARRE DE REMPLISSAGE */}
      {classe.capacite > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Capacité</span>
            <span className={`font-bold ${estPleine ? 'text-error' : 'text-success'}`}>
              {tauxRemplissage}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full transition-all ${
              estPleine ? 'bg-error' : tauxRemplissage > 80 ? 'bg-warning' : 'bg-success'
            }`} style={{ width: `${Math.min(tauxRemplissage, 100)}%` }} />
          </div>
        </div>
      )}

      {/* ONGLETS */}
      <div className="border-b border-gray-200 bg-white rounded-t-xl px-4">
        <div className="flex overflow-x-auto gap-1">
          {[
            { id: 'eleves', label: 'Élèves', icon: Users },
            { id: 'cours', label: 'Cours', icon: ClipboardList },
            { id: 'info', label: 'Informations', icon: Info },
            { id: 'stats', label: 'Statistiques', icon: BarChart3 },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary' : 'text-gray-400'}`} />
              {tab.label}
              {tab.id === 'eleves' && (
                <span className="badge badge-sm badge-ghost ml-1">{stats.totalEleves}</span>
              )}
              {tab.id === 'cours' && (
                <span className="badge badge-sm badge-ghost ml-1">{stats.totalCours}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENU ONGLETS */}
      <div className="bg-white rounded-b-xl shadow-sm border border-t-0 p-4 sm:p-6">

        {/* ONGLET ÉLÈVES */}
        {activeTab === 'eleves' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-semibold text-gray-700">
                  Liste des élèves ({stats.totalEleves})
                </h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Rechercher..."
                    className="input input-bordered input-sm w-full pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="join">
                  <button onClick={() => setViewMode('list')}
                    className={`join-item btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}>
                    <List className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewMode('grid')}
                    className={`join-item btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}>
                    <Grid className="w-4 h-4" />
                  </button>
                </div>
                <button onClick={() => navigate(`/eleves/nouveau?classe=${id}`)}
                  className="btn btn-sm btn-primary gap-1">
                  <UserPlus className="w-4 h-4" /> Ajouter
                </button>
              </div>
            </div>

            {loadingEleves ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : filteredEleves.length === 0 ? (
              <div className="text-center py-10">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">
                  {searchTerm ? 'Aucun résultat' : 'Aucun élève dans cette classe'}
                </p>
                {!searchTerm && (
                  <button onClick={() => navigate(`/eleves/nouveau?classe=${id}`)}
                    className="btn btn-primary btn-sm gap-2 mt-3">
                    <UserPlus className="w-4 h-4" /> Ajouter un élève
                  </button>
                )}
              </div>
            ) : viewMode === 'list' ? (
              <div className="w-full overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr className="text-xs">
                      <th>N°</th>
                      <th>Matricule</th>
                      <th>Nom</th>
                      <th>Prénom</th>
                      <th>Sexe</th>
                      <th>Statut</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEleves.map((e, idx) => (
                      <tr key={e.id} className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => navigate(`/eleves/${e.id}`)}>
                        <td className="text-xs text-gray-400">{idx + 1}</td>
                        <td className="font-mono text-xs">{e.matricule || '-'}</td>
                        <td className="font-medium">{e.nom || '-'}</td>
                        <td>{e.prenom || '-'}</td>
                        <td>
                          <span className={`badge badge-xs ${
                            (e.sexe || e.genre) === 'M' ? 'badge-info' : 'badge-success'
                          }`}>
                            {getSexeLabel(e.sexe || e.genre)}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-xs ${
                            e.statut === 'actif' ? 'badge-success' : 'badge-warning'
                          }`}>
                            {e.statut || 'Actif'}
                          </span>
                        </td>
                        <td className="text-center">
                          <button onClick={(ev) => { ev.stopPropagation(); navigate(`/eleves/${e.id}`); }}
                            className="btn btn-ghost btn-xs btn-square">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredEleves.map(e => (
                  <div key={e.id}
                    className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 cursor-pointer border border-gray-100"
                    onClick={() => navigate(`/eleves/${e.id}`)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserRound className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {e.prenom || ''} {e.nom || ''}
                        </p>
                        <p className="text-xs text-gray-400 font-mono truncate">
                          {e.matricule || '-'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ONGLET COURS */}
        {activeTab === 'cours' && (
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <ClipboardList className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-semibold text-gray-700">
                  Emploi du temps ({stats.totalCours} cours)
                </h3>
              </div>
              <button onClick={() => navigate(`/cours/ajouter?classe=${id}`)}
                className="btn btn-sm btn-primary gap-1">
                <UserPlus className="w-4 h-4" /> Ajouter
              </button>
            </div>
            {cours.length === 0 ? (
              <div className="text-center py-10">
                <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Aucun cours planifié</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr className="text-xs">
                      <th>Jour</th>
                      <th>Horaire</th>
                      <th>Matière</th>
                      <th>Enseignant</th>
                      <th>Salle</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cours.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => navigate(`/cours/${c.id}`)}>
                        <td className="font-medium">{getJourLabel(c.jour)}</td>
                        <td className="text-sm">{c.heure_debut} - {c.heure_fin}</td>
                        <td>{c.matiere_nom || c.matiere?.nom || 'N/A'}</td>
                        <td>{c.enseignant_nom || c.enseignant?.nom || 'N/A'}</td>
                        <td>{c.salle_nom || c.salle?.nom || 'N/A'}</td>
                        <td>
                          <span className="badge badge-primary badge-xs">
                            {getCoursTypeLabel(c.type_cours)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ONGLET INFO */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
                <Book className="w-4 h-4 text-primary" /> Informations générales
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm border-b pb-2">
                  <span className="text-gray-500">ID</span>
                  <span className="font-mono">#{String(classe.id).padStart(6, '0')}</span>
                </div>
                <div className="flex justify-between text-sm border-b pb-2">
                  <span className="text-gray-500">Code</span>
                  <span className="font-mono">{classe.code || '-'}</span>
                </div>
                <div className="flex justify-between text-sm border-b pb-2">
                  <span className="text-gray-500">Niveau</span>
                  <span>{classe.niveau_nom}</span>
                </div>
                <div className="flex justify-between text-sm border-b pb-2">
                  <span className="text-gray-500">Année</span>
                  <span>{classe.annee_libelle}</span>
                </div>
                <div className="flex justify-between text-sm border-b pb-2">
                  <span className="text-gray-500">Salle</span>
                  <span>{classe.salle || '-'}</span>
                </div>
                <div className="flex justify-between text-sm border-b pb-2">
                  <span className="text-gray-500">Capacité</span>
                  <span>{classe.capacite || 'Illimitée'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Professeur principal</span>
                  <span className="font-medium">{classe.professeur_nom}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-primary" /> Audit
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm border-b pb-2">
                  <span className="text-gray-500">Créé le</span>
                  <span>{formatDateTime(classe.date_creation)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Modifié le</span>
                  <span>{formatDateTime(classe.date_modification)}</span>
                </div>
              </div>
            </div>

            {classe.description && (
              <div className="md:col-span-2 bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-primary" /> Description
                </h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{classe.description}</p>
              </div>
            )}
          </div>
        )}

        {/* ONGLET STATS */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-primary" /> Élèves
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm border-b pb-2">
                  <span className="text-gray-500">Total</span>
                  <span className="font-bold">{stats.totalEleves}</span>
                </div>
                <div className="flex justify-between text-sm border-b pb-2">
                  <span className="text-gray-500">Garçons</span>
                  <span className="font-bold text-info">{stats.garcons}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Filles</span>
                  <span className="font-bold text-success">{stats.filles}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
                <ClipboardList className="w-4 h-4 text-primary" /> Cours
              </h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total cours</span>
                <span className="font-bold">{stats.totalCours}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionClassesDetail;