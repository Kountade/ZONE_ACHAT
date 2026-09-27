// src/components/comptabilite/Transactions.jsx
// Gestion des transactions - Liste, filtres, recherche et actions

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  Plus, Edit, Trash2, Search, RefreshCw,
  X, CheckCircle, AlertCircle, Eye, Filter,
  ChevronLeft, ChevronRight, Loader2,
  Wifi, WifiOff, CreditCard, Wallet, DollarSign,
  TrendingUp, TrendingDown, Calendar, Clock,
  User, Building2, FileText, Printer,
  Download, EyeOff, Ban, Check, ArrowUpRight,
  ArrowDownRight, Users, List, Grid
} from 'lucide-react';

const Transactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categorieFilter, setCategorieFilter] = useState('all');
  const [statutFilter, setStatutFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [transactionToAction, setTransactionToAction] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelMotif, setCancelMotif] = useState('');
  const [stats, setStats] = useState(null);

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

      // Récupérer les transactions
      const transRes = await axiosInstance.get('/transactions/', headers);
      
      let transData = [];
      if (Array.isArray(transRes.data)) {
        transData = transRes.data;
      } else if (transRes.data?.results) {
        transData = transRes.data.results;
      } else if (typeof transRes.data === 'object') {
        transData = Object.values(transRes.data).filter(item => item?.id);
      }
      
      setTransactions(transData);

      // Récupérer les statistiques
      try {
        const statsRes = await axiosInstance.get('/dashboard-financier/', headers);
        setStats(statsRes.data);
      } catch (statsError) {
        console.warn('⚠️ Impossible de charger les statistiques:', statsError);
        setStats(null);
      }

    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        setTransactions([]);
        showNotification('Aucune transaction trouvée', 'info');
      } else {
        showNotification('Erreur de chargement des transactions', 'error');
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
    if (!transactionToAction) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.delete(`/transactions/${transactionToAction.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Transaction supprimée avec succès', 'success');
      fetchData();
      setShowDeleteModal(false);
      setTransactionToAction(null);
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      if (error.response?.status === 403) {
        showNotification('Vous n\'avez pas la permission de supprimer', 'error');
      } else if (error.response?.status === 400) {
        showNotification('Impossible de supprimer cette transaction', 'error');
      } else {
        showNotification('Erreur lors de la suppression', 'error');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // ============================================================
  // VALIDATION
  // ============================================================
  const handleValidate = async () => {
    if (!transactionToAction) return;
    setIsValidating(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.post(`/transactions/${transactionToAction.id}/valider/`, {}, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Transaction validée avec succès', 'success');
      fetchData();
      setShowValidateModal(false);
      setTransactionToAction(null);
    } catch (error) {
      console.error('❌ Erreur validation:', error);
      if (error.response?.status === 403) {
        showNotification('Vous n\'avez pas la permission de valider', 'error');
      } else {
        showNotification('Erreur lors de la validation', 'error');
      }
    } finally {
      setIsValidating(false);
    }
  };

  // ============================================================
  // ANNULATION
  // ============================================================
  const handleCancel = async () => {
    if (!transactionToAction) return;
    if (!cancelMotif.trim()) {
      showNotification('Veuillez fournir un motif d\'annulation', 'error');
      return;
    }
    setIsCancelling(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.post(`/transactions/${transactionToAction.id}/annuler/`, {
        motif: cancelMotif
      }, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Transaction annulée avec succès', 'success');
      fetchData();
      setShowCancelModal(false);
      setTransactionToAction(null);
      setCancelMotif('');
    } catch (error) {
      console.error('❌ Erreur annulation:', error);
      if (error.response?.status === 403) {
        showNotification('Vous n\'avez pas la permission d\'annuler', 'error');
      } else {
        showNotification('Erreur lors de l\'annulation', 'error');
      }
    } finally {
      setIsCancelling(false);
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

  const formatDateTime = (date) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  const getTypeLabel = (type) => {
    const map = {
      credit: 'Crédit (Payé)',
      debit: 'Débit (Dû)'
    };
    return map[type] || type || 'Non défini';
  };

  const getTypeColor = (type) => {
    return type === 'credit' ? 'badge-success' : 'badge-error';
  };

  const getCategorieLabel = (categorie) => {
    const map = {
      inscription: 'Frais d\'inscription',
      mensualite: 'Mensualité',
      scolarite: 'Scolarité',
      transport: 'Transport',
      cantine: 'Cantine',
      bibliotheque: 'Bibliothèque',
      activite: 'Activité parascolaire',
      salaire: 'Salaire',
      fourniture: 'Fourniture',
      entretien: 'Entretien',
      equipement: 'Équipement',
      taxe: 'Taxe',
      assurance: 'Assurance',
      remise: 'Remise',
      annulation: 'Annulation',
      autre: 'Autre'
    };
    return map[categorie] || categorie || 'Non défini';
  };

  const getStatutLabel = (statut) => {
    const map = {
      attente: 'En attente',
      valide: 'Validée',
      annule: 'Annulée',
      rembourse: 'Remboursée'
    };
    return map[statut] || statut || 'Inconnu';
  };

  const getStatutColor = (statut) => {
    const map = {
      attente: 'badge-warning',
      valide: 'badge-success',
      annule: 'badge-error',
      rembourse: 'badge-info'
    };
    return map[statut] || 'badge-ghost';
  };

  const getModePaiementLabel = (mode) => {
    const map = {
      especes: 'Espèces',
      cheque: 'Chèque',
      virement: 'Virement',
      carte: 'Carte bancaire',
      mobile: 'Mobile Money',
      transfert: 'Transfert',
      autre: 'Autre'
    };
    return map[mode] || mode || '-';
  };

  const getClientName = (transaction) => {
    if (transaction.client_nom) return transaction.client_nom;
    if (transaction.compte_client) {
      return `${transaction.compte_client?.prenom || ''} ${transaction.compte_client?.nom || ''}`;
    }
    return '-';
  };

  // ============================================================
  // FILTRES
  // ============================================================
  const filteredTransactions = transactions.filter(t => {
    const clientName = getClientName(t);
    const matchSearch = !searchTerm ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (t.numero_facture?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (t.reference_paiement?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchType = typeFilter === 'all' || t.type_transaction === typeFilter;
    const matchCategorie = categorieFilter === 'all' || t.categorie === categorieFilter;
    const matchStatut = statutFilter === 'all' || t.statut === statutFilter;

    return matchSearch && matchType && matchCategorie && matchStatut;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, categorieFilter, statutFilter]);

  // Statistiques
  const totalCredit = transactions
    .filter(t => t.type_transaction === 'credit' && t.statut === 'valide')
    .reduce((sum, t) => sum + parseFloat(t.montant || 0), 0);
  
  const totalDebit = transactions
    .filter(t => t.type_transaction === 'debit' && t.statut === 'valide')
    .reduce((sum, t) => sum + parseFloat(t.montant || 0), 0);

  const totalEnAttente = transactions
    .filter(t => t.statut === 'attente')
    .reduce((sum, t) => sum + parseFloat(t.montant || 0), 0);

  // Catégories uniques pour le filtre
  const categories = [...new Set(transactions.map(t => t.categorie))].filter(Boolean);

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-primary animate-spin mx-auto" />
          <p className="text-base sm:text-xl font-semibold text-base-content/70 animate-pulse">
            Chargement des transactions...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - PRINCIPAL
  // ============================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen w-full">
      
      {/* ============================================================
          NOTIFICATION TOAST
          ============================================================ */}
      {notification.show && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : notification.type === 'error' ? 'alert-error' : 'alert-info'} shadow-xl text-sm sm:text-base rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? 
                <CheckCircle className="w-4 h-4 flex-shrink-0" /> : 
                notification.type === 'error' ?
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> :
                <Info className="w-4 h-4 flex-shrink-0" />
              }
              <span className="font-medium">{notification.message}</span>
            </div>
            <button 
              className="btn btn-ghost btn-xs btn-circle flex-shrink-0" 
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL SUPPRESSION
          ============================================================ */}
      {showDeleteModal && transactionToAction && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-base-content/70">Voulez-vous vraiment supprimer cette transaction ?</p>
              <p className="font-semibold text-error mt-2 text-lg">
                {formatCurrency(transactionToAction.montant)}
              </p>
              <p className="text-sm text-gray-500">{transactionToAction.description}</p>
              <p className="text-xs text-gray-400 mt-2">Cette action est irréversible.</p>
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
          MODAL VALIDATION
          ============================================================ */}
      {showValidateModal && transactionToAction && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-success/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
                <Check className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-bold text-success">Valider la transaction</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-base-content/70">Voulez-vous valider cette transaction ?</p>
              <p className="font-semibold text-success mt-2 text-lg">
                {formatCurrency(transactionToAction.montant)}
              </p>
              <p className="text-sm text-gray-500">{transactionToAction.description}</p>
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button className="btn btn-ghost flex-1" onClick={() => setShowValidateModal(false)} disabled={isValidating}>
                Annuler
              </button>
              <button className="btn btn-success flex-1 gap-2" onClick={handleValidate} disabled={isValidating}>
                {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {isValidating ? 'Validation...' : 'Valider'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL ANNULATION
          ============================================================ */}
      {showCancelModal && transactionToAction && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-warning/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-3">
                <Ban className="w-8 h-8 text-warning" />
              </div>
              <h3 className="text-xl font-bold text-warning">Annuler la transaction</h3>
            </div>
            <div className="p-6">
              <p className="text-base-content/70 text-center">Voulez-vous annuler cette transaction ?</p>
              <p className="font-semibold text-warning mt-2 text-lg text-center">
                {formatCurrency(transactionToAction.montant)}
              </p>
              <p className="text-sm text-gray-500 text-center mb-4">{transactionToAction.description}</p>
              <div className="form-control">
                <label className="label text-sm font-medium">Motif d'annulation</label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  placeholder="Expliquez le motif de l'annulation..."
                  value={cancelMotif}
                  onChange={(e) => setCancelMotif(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button className="btn btn-ghost flex-1" onClick={() => {
                setShowCancelModal(false);
                setCancelMotif('');
              }} disabled={isCancelling}>
                Annuler
              </button>
              <button className="btn btn-warning flex-1 gap-2" onClick={handleCancel} disabled={isCancelling || !cancelMotif.trim()}>
                {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                {isCancelling ? 'Annulation...' : 'Confirmer'}
              </button>
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
                <CreditCard className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary">Transactions</h1>
            </div>
            <p className="text-sm text-base-content/60 ml-1">
              Gérez les transactions – {transactions.length} transaction(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className={`badge ${isOnline ? 'badge-success' : 'badge-error'} gap-1 px-2 py-2 text-xs`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </div>
            <button 
              onClick={fetchData} 
              className="btn btn-sm sm:btn-md btn-outline gap-2 hover:bg-primary/10 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button 
              onClick={() => navigate('/transactions/nouveau')} 
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white border-none shadow-lg hover:shadow-xl transition-all gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouvelle transaction
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          CARTES STATISTIQUES
          ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">{transactions.length}</p>
              </div>
              <CreditCard className="w-8 h-8 text-primary/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Crédits</p>
                <p className="text-xl sm:text-2xl font-bold text-success">{formatCurrency(totalCredit)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Débits</p>
                <p className="text-xl sm:text-2xl font-bold text-error">{formatCurrency(totalDebit)}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-error/20" />
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-gray-200">
          <div className="card-body p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">En attente</p>
                <p className="text-xl sm:text-2xl font-bold text-warning">{formatCurrency(totalEnAttente)}</p>
              </div>
              <Clock className="w-8 h-8 text-warning/20" />
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
              placeholder="Rechercher par client, description, facture..."
              className="input input-bordered w-full pl-9 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); }}
            />
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="btn btn-outline btn-sm sm:hidden gap-2"
          >
            <Filter className="w-4 h-4" /> 
            {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
          </button>
          
          <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-4 gap-3`}>
            <select 
              className="select select-bordered w-full focus:border-primary" 
              value={typeFilter} 
              onChange={(e) => { setTypeFilter(e.target.value); }}
            >
              <option value="all">Tous les types</option>
              <option value="credit">Crédit (Payé)</option>
              <option value="debit">Débit (Dû)</option>
            </select>
            
            <select 
              className="select select-bordered w-full focus:border-primary" 
              value={categorieFilter} 
              onChange={(e) => { setCategorieFilter(e.target.value); }}
            >
              <option value="all">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{getCategorieLabel(cat)}</option>
              ))}
            </select>
            
            <select 
              className="select select-bordered w-full focus:border-primary" 
              value={statutFilter} 
              onChange={(e) => { setStatutFilter(e.target.value); }}
            >
              <option value="all">Tous les statuts</option>
              <option value="attente">En attente</option>
              <option value="valide">Validée</option>
              <option value="annule">Annulée</option>
              <option value="rembourse">Remboursée</option>
            </select>
            
            <button 
              className="btn btn-outline gap-2 hover:bg-primary/10 transition-all" 
              onClick={() => { 
                setTypeFilter('all');
                setCategorieFilter('all');
                setStatutFilter('all');
                setSearchTerm('');
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
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-white text-sm">
                <th className="py-4 font-semibold">Client</th>
                <th className="py-4 font-semibold hidden sm:table-cell">Type</th>
                <th className="py-4 font-semibold">Description</th>
                <th className="py-4 font-semibold text-right">Montant</th>
                <th className="py-4 font-semibold hidden md:table-cell">Date</th>
                <th className="py-4 font-semibold hidden lg:table-cell">Statut</th>
                <th className="py-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                        <CreditCard className="w-10 h-10 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium">
                        {searchTerm || typeFilter !== 'all' || categorieFilter !== 'all' || statutFilter !== 'all'
                          ? 'Aucune transaction ne correspond aux filtres'
                          : 'Aucune transaction trouvée'}
                      </p>
                      <button 
                        onClick={() => navigate('/transactions/nouveau')} 
                        className="btn btn-primary btn-sm gap-2 mt-2"
                      >
                        <Plus className="w-4 h-4" /> Ajouter une transaction
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map(t => {
                  const isCredit = t.type_transaction === 'credit';
                  const isValide = t.statut === 'valide';
                  const isAttente = t.statut === 'attente';
                  const isAnnule = t.statut === 'annule';
                  
                  return (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{getClientName(t)}</p>
                            {t.numero_facture && (
                              <p className="text-xs text-gray-400">{t.numero_facture}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`badge ${getTypeColor(t.type_transaction)}`}>
                          {getTypeLabel(t.type_transaction)}
                        </span>
                        <span className="badge badge-ghost badge-sm ml-1">
                          {getCategorieLabel(t.categorie)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm truncate max-w-[150px] sm:max-w-xs">{t.description || '-'}</p>
                        {t.mode_paiement && (
                          <span className="text-xs text-gray-400">{getModePaiementLabel(t.mode_paiement)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold ${isCredit ? 'text-success' : 'text-error'}`}>
                          {isCredit ? '+' : '-'} {formatCurrency(t.montant)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="text-sm">
                          {formatDate(t.date_transaction)}
                          {t.date_echeance && (
                            <p className="text-xs text-gray-400">Échéance: {formatDate(t.date_echeance)}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`badge ${getStatutColor(t.statut)}`}>
                          {getStatutLabel(t.statut)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button 
                            onClick={() => navigate(`/transactions/${t.id}`)} 
                            className="btn btn-ghost btn-sm btn-circle tooltip" 
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {isAttente && (
                            <>
                              <button 
                                onClick={() => { setTransactionToAction(t); setShowValidateModal(true); }} 
                                className="btn btn-ghost btn-sm btn-circle text-success tooltip" 
                                title="Valider"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          
                          {!isAnnule && !isValide && (
                            <button 
                              onClick={() => { setTransactionToAction(t); setShowCancelModal(true); }} 
                              className="btn btn-ghost btn-sm btn-circle text-warning tooltip" 
                              title="Annuler"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          
                          {isAttente && (
                            <button 
                              onClick={() => { setTransactionToAction(t); setShowDeleteModal(true); }} 
                              className="btn btn-ghost btn-sm btn-circle text-error tooltip" 
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ============================================================
            PAGINATION
            ============================================================ */}
        {filteredTransactions.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Affichage de <span className="font-semibold text-primary">{((currentPage-1)*itemsPerPage)+1}</span> à{' '}
                <span className="font-semibold text-primary">{Math.min(currentPage*itemsPerPage, filteredTransactions.length)}</span>{' '}
                sur <span className="font-semibold">{filteredTransactions.length}</span> transactions
              </div>
              <div className="flex items-center gap-3">
                <select 
                  className="select select-bordered select-sm" 
                  value={itemsPerPage} 
                  onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
                <div className="join">
                  <button 
                    className="join-item btn btn-sm" 
                    onClick={() => setCurrentPage(p => Math.max(1, p-1))} 
                    disabled={currentPage===1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i+1;
                    else if (currentPage <= 3) pageNum = i+1;
                    else if (currentPage >= totalPages-2) pageNum = totalPages-4+i;
                    else pageNum = currentPage-2+i;
                    return (
                      <button 
                        key={pageNum} 
                        onClick={() => setCurrentPage(pageNum)} 
                        className={`join-item btn btn-sm ${currentPage === pageNum ? 'btn-primary text-white' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button 
                    className="join-item btn btn-sm" 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} 
                    disabled={currentPage===totalPages}
                  >
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

// ✅ Composant Info pour les notifications
const Info = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default Transactions;