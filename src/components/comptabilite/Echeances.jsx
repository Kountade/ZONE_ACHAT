// src/components/comptabilite/Echeances.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, Calendar, RefreshCw,
  X, CheckCircle, AlertCircle, Eye, Filter,
  ChevronLeft, ChevronRight, Loader2,
  TrendingUp, FileSpreadsheet, Wifi, WifiOff,
  User, Clock, DollarSign, AlertTriangle, Info,
  List, Grid3x3, MoreVertical
} from 'lucide-react';

const Echeances = () => {
  const navigate = useNavigate();
  const [echeances, setEcheances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState('all');
  const [categorieFilter, setCategorieFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [echeanceToDelete, setEcheanceToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [viewMode, setViewMode] = useState('list');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStats, setShowStats] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // ============================================================
  // SURVEILLER LA CONNEXION
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

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const headers = { headers: { Authorization: `Token ${token}` } };

      const response = await axiosInstance.get('/echeances/', headers);
      
      let data = [];
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data?.results) {
        data = response.data.results;
      }
      
      setEcheances(data);

    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement des échéances', 'error');
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
    if (!echeanceToDelete) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.delete(`/echeances/${echeanceToDelete.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Échéance supprimée avec succès', 'success');
      fetchData();
      setShowDeleteModal(false);
      setEcheanceToDelete(null);
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      showNotification('Erreur lors de la suppression', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // ============================================================
  // MARQUER COMME PAYÉ
  // ============================================================
  const handleMarquerPaye = async (id) => {
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.post(`/echeances/${id}/marquer_paye/`, {}, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Échéance marquée comme payée', 'success');
      fetchData();
    } catch (error) {
      console.error('❌ Erreur:', error);
      showNotification('Erreur lors du marquage', 'error');
    }
  };

  // ============================================================
  // FORMATAGE
  // ============================================================
  const formatCurrency = (value) => {
    const num = parseFloat(value) || 0;
    return num.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' });
  };

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  const getStatutLabel = (statut) => {
    const map = {
      a_payer: 'À payer',
      paye: 'Payé',
      en_retard: 'En retard',
      annule: 'Annulé'
    };
    return map[statut] || statut || 'Inconnu';
  };

  const getStatutBadge = (statut) => {
    const map = {
      a_payer: 'badge-warning',
      paye: 'badge-success',
      en_retard: 'badge-error',
      annule: 'badge-ghost'
    };
    return map[statut] || 'badge-ghost';
  };

  const getCategorieLabel = (categorie) => {
    const map = {
      inscription: 'Inscription',
      mensualite: 'Mensualité',
      scolarite: 'Scolarité',
      transport: 'Transport',
      cantine: 'Cantine',
      bibliotheque: 'Bibliothèque',
      activite: 'Activité',
      salaire: 'Salaire',
      fourniture: 'Fourniture',
      entretien: 'Entretien',
      equipement: 'Équipement',
      taxe: 'Taxe',
      assurance: 'Assurance',
      autre: 'Autre'
    };
    return map[categorie] || categorie || 'Non défini';
  };

  // ============================================================
  // FILTRES
  // ============================================================
  const filteredEcheances = echeances.filter(e => {
    const matchSearch = !searchTerm ||
      (e.libelle?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (e.compte_client?.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (e.compte_client?.prenom?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchStatut = statutFilter === 'all' || e.statut === statutFilter;
    const matchCategorie = categorieFilter === 'all' || e.categorie === categorieFilter;

    return matchSearch && matchStatut && matchCategorie;
  });

  const totalPages = Math.ceil(filteredEcheances.length / itemsPerPage) || 1;
  const paginatedEcheances = filteredEcheances.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statutFilter, categorieFilter]);

  // Statistiques
  const totalMontant = echeances.reduce((sum, e) => sum + parseFloat(e.montant || 0), 0);
  const totalPaye = echeances.filter(e => e.statut === 'paye').reduce((sum, e) => sum + parseFloat(e.montant || 0), 0);
  const tauxPaiement = totalMontant > 0 ? Math.round((totalPaye / totalMontant) * 100) : 0;

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-base font-semibold text-gray-500 animate-pulse">
            Chargement des échéances...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - PRINCIPAL
  // ============================================================
  return (
    <div className="space-y-4 p-4 lg:p-6 bg-gray-50 min-h-screen">
      
      {/* ============================================================
          NOTIFICATION TOAST
          ============================================================ */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? 
                <CheckCircle className="w-4 h-4" /> : 
                <AlertCircle className="w-4 h-4" />
              }
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification(prev => ({ ...prev, show: false }))}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL SUPPRESSION
          ============================================================ */}
      {showDeleteModal && echeanceToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-base-content/70">Voulez-vous vraiment supprimer cette échéance ?</p>
              <p className="font-semibold text-error mt-2">{echeanceToDelete.libelle}</p>
              <p className="text-sm text-gray-500">{formatCurrency(echeanceToDelete.montant)}</p>
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button className="btn btn-ghost flex-1" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
                Annuler
              </button>
              <button className="btn btn-error flex-1 gap-2" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          EN-TÊTE
          ============================================================ */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Calendar className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Échéances</h1>
                <p className="text-sm text-gray-500">{echeances.length} échéance(s)</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className={`badge ${isOnline ? 'badge-success' : 'badge-error'} gap-1`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </div>
            <button onClick={fetchData} className="btn btn-sm btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button onClick={() => navigate('/echeances/nouveau')} className="btn btn-sm btn-primary gap-2">
              <Plus className="w-4 h-4" /> Nouvelle échéance
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          CARTES STATISTIQUES RAPIDES
          ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card bg-white shadow-sm rounded-xl border border-gray-200">
          <div className="card-body p-3">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-xl font-bold text-primary">{echeances.length}</p>
          </div>
        </div>
        <div className="card bg-white shadow-sm rounded-xl border border-gray-200">
          <div className="card-body p-3">
            <p className="text-xs text-gray-500">Montant total</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(totalMontant)}</p>
          </div>
        </div>
        <div className="card bg-white shadow-sm rounded-xl border border-gray-200">
          <div className="card-body p-3">
            <p className="text-xs text-gray-500">Payé</p>
            <p className="text-xl font-bold text-success">{formatCurrency(totalPaye)}</p>
          </div>
        </div>
        <div className="card bg-white shadow-sm rounded-xl border border-gray-200">
          <div className="card-body p-3">
            <p className="text-xs text-gray-500">Taux paiement</p>
            <p className={`text-xl font-bold ${tauxPaiement > 80 ? 'text-success' : 'text-warning'}`}>
              {tauxPaiement}%
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================
          FILTRES
          ============================================================ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par libellé ou client..."
              className="input input-bordered w-full pl-9 py-2"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select 
              className="select select-bordered w-full" 
              value={statutFilter} 
              onChange={(e) => { setStatutFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Tous les statuts</option>
              <option value="a_payer">À payer</option>
              <option value="paye">Payé</option>
              <option value="en_retard">En retard</option>
              <option value="annule">Annulé</option>
            </select>
            
            <select 
              className="select select-bordered w-full" 
              value={categorieFilter} 
              onChange={(e) => { setCategorieFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Toutes les catégories</option>
              <option value="inscription">Inscription</option>
              <option value="mensualite">Mensualité</option>
              <option value="scolarite">Scolarité</option>
              <option value="transport">Transport</option>
              <option value="cantine">Cantine</option>
              <option value="autre">Autre</option>
            </select>
            
            <button 
              className="btn btn-outline gap-2" 
              onClick={() => { 
                setStatutFilter('all');
                setCategorieFilter('all');
                setSearchTerm('');
                setCurrentPage(1);
              }}
            >
              <RefreshCw className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          TABLEAU
          ============================================================ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 font-semibold">Client</th>
                <th className="py-3 font-semibold">Libellé</th>
                <th className="py-3 font-semibold hidden md:table-cell">Catégorie</th>
                <th className="py-3 font-semibold text-right">Montant</th>
                <th className="py-3 font-semibold hidden lg:table-cell">Échéance</th>
                <th className="py-3 font-semibold">Statut</th>
                <th className="py-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEcheances.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Aucune échéance trouvée</p>
                    <button onClick={() => navigate('/echeances/nouveau')} className="btn btn-primary btn-sm mt-3 gap-2">
                      <Plus className="w-4 h-4" /> Ajouter une échéance
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedEcheances.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">
                            {e.compte_client?.prenom || ''} {e.compte_client?.nom || 'Client inconnu'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 font-medium">{e.libelle}</td>
                    <td className="py-3 hidden md:table-cell">
                      <span className="badge badge-ghost">{getCategorieLabel(e.categorie)}</span>
                    </td>
                    <td className="py-3 text-right font-bold">{formatCurrency(e.montant)}</td>
                    <td className="py-3 hidden lg:table-cell">{formatDate(e.date_echeance)}</td>
                    <td className="py-3">
                      <span className={`badge ${getStatutBadge(e.statut)}`}>
                        {getStatutLabel(e.statut)}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button 
                          onClick={() => navigate(`/echeances/${e.id}`)} 
                          className="btn btn-ghost btn-sm btn-circle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => navigate(`/echeances/${e.id}/modifier`)} 
                          className="btn btn-ghost btn-sm btn-circle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {e.statut !== 'paye' && e.statut !== 'annule' && (
                          <button 
                            onClick={() => handleMarquerPaye(e.id)} 
                            className="btn btn-ghost btn-sm btn-circle text-success"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => { setEcheanceToDelete(e); setShowDeleteModal(true); }} 
                          className="btn btn-ghost btn-sm btn-circle text-error"
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

        {/* ============================================================
            PAGINATION
            ============================================================ */}
        {filteredEcheances.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm text-gray-500">
                {((currentPage-1)*itemsPerPage)+1} - {Math.min(currentPage*itemsPerPage, filteredEcheances.length)} sur {filteredEcheances.length}
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
                  <button className="join-item btn btn-sm btn-primary text-white">{currentPage}</button>
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

export default Echeances;