// src/components/inscriptions/Eleves.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, Users, RefreshCw,
  X, CheckCircle, AlertCircle, Eye, Filter,
  ChevronLeft, ChevronRight, Grid3x3, List,
  Calendar, User, Phone, Mail, MapPin,
  MoreVertical, FileText, CreditCard, TrendingUp,
  UserPlus, Award, Clock, School, Download,
  Printer, FileSpreadsheet, File, DollarSign,
  UserCheck, GraduationCap, Building2, Home,
  AlertTriangle, Activity, Heart, Briefcase,
  PhoneCall, UserRound, Stethoscope, Droplet,
  PhoneForwarded, BookOpen, Users as UsersIcon,
  Loader2
} from 'lucide-react';

const Eleves = () => {
  const navigate = useNavigate();
  const [eleves, setEleves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [niveauFilter, setNiveauFilter] = useState('all');
  const [classeFilter, setClasseFilter] = useState('all');
  const [statutFilter, setStatutFilter] = useState('all');
  const [inscriptionFilter, setInscriptionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eleveToDelete, setEleveToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [viewMode, setViewMode] = useState('list');
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [niveaux, setNiveaux] = useState([]);
  const [classes, setClasses] = useState([]);
  const [exporting, setExporting] = useState(false);

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ ...notification, show: false }), 4000);
  };

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================
  const fetchData = async () => {
    setLoading(true);
    try {
      const [elevesRes, statsRes, niveauxRes, classesRes] = await Promise.all([
        axiosInstance.get('/eleves/'),
        axiosInstance.get('/eleves/statistiques/'),
        axiosInstance.get('/niveaux/'),
        axiosInstance.get('/classes/')
      ]);
      setEleves(elevesRes.data || []);
      setStats(statsRes.data);
      setNiveaux(niveauxRes.data || []);
      setClasses(classesRes.data || []);
    } catch (error) {
      console.error('Erreur chargement:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée, veuillez vous reconnecter', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement des élèves', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    if (!eleveToDelete) return;
    try {
      await axiosInstance.delete(`/eleves/${eleveToDelete.id}/`);
      showNotification('Élève supprimé avec succès', 'success');
      fetchData();
      setShowDeleteModal(false);
      setEleveToDelete(null);
    } catch (error) {
      console.error('Erreur suppression:', error);
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  // ============================================================
  // GÉNÉRATION PDF
  // ============================================================
  const handleGeneratePDF = async (id) => {
    try {
      const response = await axiosInstance.get(`/eleves/${id}/pdf/`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `eleve_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showNotification('PDF généré avec succès', 'success');
    } catch (error) {
      console.error('Erreur PDF:', error);
      showNotification('Erreur lors de la génération du PDF', 'error');
    }
  };

  // ============================================================
  // EXPORT CSV
  // ============================================================
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const response = await axiosInstance.get('/eleves/export_csv/', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'eleves_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      showNotification('Export CSV effectué avec succès', 'success');
    } catch (error) {
      console.error('Erreur export:', error);
      showNotification('Erreur lors de l\'export', 'error');
    } finally {
      setExporting(false);
    }
  };

  // ============================================================
  // EXPORT PDF TOUS
  // ============================================================
  const handleGenerateAllPDF = async () => {
    try {
      const response = await axiosInstance.get('/eleves/pdf_all/', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'tous_les_eleves.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      showNotification('PDF de tous les élèves généré avec succès', 'success');
    } catch (error) {
      console.error('Erreur PDF:', error);
      showNotification('Erreur lors de la génération du PDF', 'error');
    }
  };

  // ============================================================
  // NAVIGATION VERS LE DÉTAIL
  // ============================================================
  const goToDetail = (id) => {
    navigate(`/eleves/${id}`);
  };

  // ============================================================
  // FILTRES
  // ============================================================
  const filteredEleves = eleves.filter(e => {
    const matchSearch = !searchTerm ||
      (e.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (e.prenom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (e.matricule?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (e.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (e.telephone || '').includes(searchTerm);

    const matchNiveau = niveauFilter === 'all' || e.niveau === parseInt(niveauFilter);
    const matchClasse = classeFilter === 'all' || e.classe === parseInt(classeFilter);
    const matchStatut = statutFilter === 'all' || e.statut === statutFilter;
    
    let matchInscription = true;
    if (inscriptionFilter === 'complete') matchInscription = e.inscription_complete === true;
    else if (inscriptionFilter === 'incomplete') matchInscription = e.inscription_complete === false;
    
    return matchSearch && matchNiveau && matchClasse && matchStatut && matchInscription;
  });

  const totalPages = Math.ceil(filteredEleves.length / itemsPerPage);
  const paginatedEleves = filteredEleves.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ============================================================
  // FORMATAGE
  // ============================================================
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(value || 0);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatutBadge = (statut) => {
    const map = {
      actif: 'badge-success',
      suspendu: 'badge-warning',
      exclu: 'badge-error',
      transfere: 'badge-info',
      diplome: 'badge-primary',
      abandon: 'badge-ghost'
    };
    return map[statut] || 'badge-ghost';
  };

  const getStatutLabel = (statut) => {
    const map = {
      actif: 'Actif',
      suspendu: 'Suspendu',
      exclu: 'Exclu',
      transfere: 'Transféré',
      diplome: 'Diplômé',
      abandon: 'Abandon'
    };
    return map[statut] || statut;
  };

  const getSexeLabel = (sexe) => {
    return sexe === 'M' ? 'Masculin' : 'Féminin';
  };

  // ============================================================
  // RENDU
  // ============================================================
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-primary animate-spin mx-auto" />
          <p className="text-base sm:text-xl font-semibold text-base-content/70 animate-pulse">
            Chargement des élèves...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen">
      {/* ============================================================
          NOTIFICATION TOAST
          ============================================================ */}
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

      {/* ============================================================
          MODAL SUPPRESSION
          ============================================================ */}
      {showDeleteModal && eleveToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-base-content/70">Voulez-vous vraiment supprimer cet élève ?</p>
              <p className="font-semibold text-error mt-2">{eleveToDelete.prenom} {eleveToDelete.nom}</p>
              <p className="text-sm text-gray-500">{eleveToDelete.matricule}</p>
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

      {/* ============================================================
          MODAL STATISTIQUES
          ============================================================ */}
      {showStats && stats && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Statistiques des élèves
              </h3>
              <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setShowStats(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="stat bg-primary/5 rounded-xl p-3 text-center">
                <div className="stat-title text-xs text-gray-500">Total élèves</div>
                <div className="stat-value text-2xl font-bold text-primary">{stats.total || 0}</div>
              </div>
              <div className="stat bg-success/5 rounded-xl p-3 text-center">
                <div className="stat-title text-xs text-gray-500">Actifs</div>
                <div className="stat-value text-2xl font-bold text-success">{stats.actifs || 0}</div>
              </div>
              <div className="stat bg-info/5 rounded-xl p-3 text-center">
                <div className="stat-title text-xs text-gray-500">Nouveaux (mois)</div>
                <div className="stat-value text-2xl font-bold text-info">{stats.nouveaux_mois || 0}</div>
              </div>
              <div className="stat bg-warning/5 rounded-xl p-3 text-center">
                <div className="stat-title text-xs text-gray-500">Sexe</div>
                <div className="stat-value text-lg font-bold text-warning">
                  M {stats.par_sexe?.M || 0} / F {stats.par_sexe?.F || 0}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Par niveau</h4>
                <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {Object.entries(stats.par_niveau || {}).length === 0 ? (
                    <p className="text-sm text-gray-400 text-center">Aucune donnée</p>
                  ) : (
                    Object.entries(stats.par_niveau || {}).map(([niveau, count]) => (
                      <div key={niveau} className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                        <span>{niveau}</span>
                        <span className="font-bold text-primary">{count}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Par statut</h4>
                <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {Object.entries(stats.par_statut || {}).length === 0 ? (
                    <p className="text-sm text-gray-400 text-center">Aucune donnée</p>
                  ) : (
                    Object.entries(stats.par_statut || {}).map(([statut, count]) => (
                      <div key={statut} className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                        <span>{statut}</span>
                        <span className="font-bold text-primary">{count}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="modal-action">
              <button className="btn" onClick={() => setShowStats(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          EN-TÊTE
          ============================================================ */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl"></div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary">Élèves</h1>
            </div>
            <p className="text-sm text-base-content/60 ml-1">
              Gérez les élèves inscrits – {eleves.length} élève(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowStats(true)} className="btn btn-sm sm:btn-md btn-outline gap-2 hover:bg-primary/10 transition-all">
              <TrendingUp className="w-4 h-4" />
              Stats
            </button>
            <button onClick={handleExportCSV} className="btn btn-sm sm:btn-md btn-outline gap-2 hover:bg-primary/10 transition-all" disabled={exporting}>
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              CSV
            </button>
            <button onClick={handleGenerateAllPDF} className="btn btn-sm sm:btn-md btn-outline gap-2 hover:bg-primary/10 transition-all">
              <File className="w-4 h-4" />
              Tous PDF
            </button>
            <button onClick={fetchData} className="btn btn-sm sm:btn-md btn-outline gap-2 hover:bg-primary/10 transition-all">
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <button onClick={() => navigate('/eleves/nouveau')} className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white border-none shadow-lg hover:shadow-xl transition-all gap-2">
              <UserPlus className="w-4 h-4" />
              Nouvel élève
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          CARTES STATISTIQUES RAPIDES
          ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">{eleves.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Actifs</p>
                <p className="text-xl sm:text-2xl font-bold text-success">{eleves.filter(e => e.statut === 'actif').length}</p>
              </div>
              <UserCheck className="w-8 h-8 text-success/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">A completer</p>
                <p className="text-xl sm:text-2xl font-bold text-warning">{eleves.filter(e => !e.inscription_complete).length}</p>
              </div>
              <Clock className="w-8 h-8 text-warning/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Masculin</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-500">{eleves.filter(e => e.sexe === 'M').length}</p>
              </div>
              <User className="w-8 h-8 text-blue-500/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Féminin</p>
                <p className="text-xl sm:text-2xl font-bold text-pink-500">{eleves.filter(e => e.sexe === 'F').length}</p>
              </div>
              <UserRound className="w-8 h-8 text-pink-500/20" />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          FILTRES
          ============================================================ */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom, matricule, email ou téléphone..."
              className="input input-bordered w-full pl-9 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline btn-sm sm:hidden gap-2">
            <Filter className="w-4 h-4" /> {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
          </button>
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-5 gap-3`}>
            <select className="select select-bordered w-full focus:border-primary" value={niveauFilter} onChange={(e) => { setNiveauFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les niveaux</option>
              {niveaux.map(n => (
                <option key={n.id} value={n.id}>{n.nom}</option>
              ))}
            </select>
            <select className="select select-bordered w-full focus:border-primary" value={classeFilter} onChange={(e) => { setClasseFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Toutes les classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
            <select className="select select-bordered w-full focus:border-primary" value={statutFilter} onChange={(e) => { setStatutFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="suspendu">Suspendu</option>
              <option value="exclu">Exclu</option>
              <option value="transfere">Transféré</option>
              <option value="diplome">Diplômé</option>
              <option value="abandon">Abandon</option>
            </select>
            <select className="select select-bordered w-full focus:border-primary" value={inscriptionFilter} onChange={(e) => { setInscriptionFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">Toutes les inscriptions</option>
              <option value="complete">Complètes</option>
              <option value="incomplete">A completer</option>
            </select>
            <div className="flex gap-2">
              <button className="btn btn-outline gap-2 flex-1 hover:bg-primary/10 transition-all" 
                onClick={() => { setNiveauFilter('all'); setClasseFilter('all'); setStatutFilter('all'); setInscriptionFilter('all'); setSearchTerm(''); setCurrentPage(1); }}>
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

      {/* ============================================================
          TABLEAU / GRILLE
          ============================================================ */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-white text-sm">
                  <th className="py-4 font-semibold">Élève</th>
                  <th className="py-4 font-semibold">Matricule</th>
                  <th className="py-4 font-semibold">Niveau</th>
                  <th className="py-4 font-semibold">Classe</th>
                  <th className="py-4 font-semibold">Statut</th>
                  <th className="py-4 font-semibold">Inscription</th>
                  <th className="py-4 font-semibold text-right">Solde</th>
                  <th className="py-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEleves.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                          <Users className="w-10 h-10 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">Aucun élève trouvé</p>
                        <button onClick={() => navigate('/eleves/nouveau')} className="btn btn-primary btn-sm gap-2 mt-2">
                          <UserPlus className="w-4 h-4" /> Ajouter un élève
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedEleves.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className={`w-4 h-4 ${e.sexe === 'M' ? 'text-blue-500' : 'text-pink-500'}`} />
                          </div>
                          <div>
                            <p 
                              className="font-semibold hover:text-primary cursor-pointer transition-colors"
                              onClick={() => goToDetail(e.id)}
                            >
                              {e.prenom} {e.nom}
                            </p>
                            <p className="text-xs text-gray-400">{e.email || 'Pas d\'email'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{e.matricule}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{e.niveau_nom || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{e.classe_nom || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${getStatutBadge(e.statut)}`}>
                          {getStatutLabel(e.statut)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {e.inscription_complete ? (
                          <span className="badge badge-success gap-1">
                            <CheckCircle className="w-3 h-3" /> Complet
                          </span>
                        ) : (
                          <span className="badge badge-warning gap-1">
                            <Clock className="w-3 h-3" /> A completer
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold ${e.compte_client_details?.solde > 0 ? 'text-error' : 'text-success'}`}>
                          {formatCurrency(e.compte_client_details?.solde || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button 
                            onClick={() => goToDetail(e.id)} 
                            className="btn btn-ghost btn-sm btn-circle tooltip" 
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => navigate(`/eleves/${e.id}/modifier`)} 
                            className="btn btn-ghost btn-sm btn-circle tooltip" 
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleGeneratePDF(e.id)} 
                            className="btn btn-ghost btn-sm btn-circle tooltip" 
                            title="PDF"
                          >
                            <File className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => { setEleveToDelete(e); setShowDeleteModal(true); }} 
                            className="btn btn-ghost btn-sm btn-circle text-error tooltip" 
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          // ============================================================
          // VUE GRILLE
          // ============================================================
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {paginatedEleves.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                    <Users className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">Aucun élève trouvé</p>
                  <button onClick={() => navigate('/eleves/nouveau')} className="btn btn-primary btn-sm gap-2 mt-2">
                    <UserPlus className="w-4 h-4" /> Ajouter un élève
                  </button>
                </div>
              </div>
            ) : (
              paginatedEleves.map(e => (
                <div 
                  key={e.id} 
                  className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200 cursor-pointer hover:border-primary"
                  onClick={() => goToDetail(e.id)}
                >
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                          <User className={`w-5 h-5 ${e.sexe === 'M' ? 'text-blue-500' : 'text-pink-500'}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm hover:text-primary transition-colors">
                            {e.prenom} {e.nom}
                          </h3>
                          <p className="text-xs text-gray-400 font-mono">{e.matricule}</p>
                        </div>
                      </div>
                      <div className="dropdown dropdown-end" onClick={(ev) => ev.stopPropagation()}>
                        <button className="btn btn-ghost btn-sm btn-circle">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <ul className="dropdown-menu dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-48">
                          <li>
                            <button onClick={() => goToDetail(e.id)} className="flex items-center gap-2">
                              <Eye className="w-4 h-4" /> Détails
                            </button>
                          </li>
                          <li>
                            <button onClick={() => navigate(`/eleves/${e.id}/modifier`)} className="flex items-center gap-2">
                              <Edit className="w-4 h-4" /> Modifier
                            </button>
                          </li>
                          <li>
                            <button onClick={() => handleGeneratePDF(e.id)} className="flex items-center gap-2">
                              <File className="w-4 h-4" /> PDF
                            </button>
                          </li>
                          <li>
                            <button onClick={() => { setEleveToDelete(e); setShowDeleteModal(true); }} className="flex items-center gap-2 text-error">
                              <Trash2 className="w-4 h-4" /> Supprimer
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1 mt-2 text-sm">
                      <div className="flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-gray-400" />
                        <span className="text-xs">{e.niveau_nom || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <School className="w-3 h-3 text-gray-400" />
                        <span className="text-xs">{e.classe_nom || '-'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        {e.inscription_complete ? (
                          <span className="badge badge-success badge-xs">Complet</span>
                        ) : (
                          <span className="badge badge-warning badge-xs">A completer</span>
                        )}
                        <span className={`badge ${getStatutBadge(e.statut)} badge-xs`}>
                          {getStatutLabel(e.statut)}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Solde</p>
                        <p className={`text-xs font-bold ${e.compte_client_details?.solde > 0 ? 'text-error' : 'text-success'}`}>
                          {formatCurrency(e.compte_client_details?.solde || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ============================================================
            PAGINATION
            ============================================================ */}
        {filteredEleves.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Affichage de <span className="font-semibold text-primary">{((currentPage-1)*itemsPerPage)+1}</span> à{' '}
                <span className="font-semibold text-primary">{Math.min(currentPage*itemsPerPage, filteredEleves.length)}</span>{' '}
                sur <span className="font-semibold">{filteredEleves.length}</span> élèves
              </div>
              <div className="flex items-center gap-3">
                <select className="select select-bordered select-sm" value={itemsPerPage} onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}>
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
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

export default Eleves;