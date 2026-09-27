// src/components/comptabilite/CompteClientTransactions.jsx
// Liste des transactions d'un compte client

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft, CreditCard, Calendar, User, DollarSign,
  Loader2, RefreshCw, Wifi, WifiOff, AlertCircle,
  CheckCircle, X, Download, Printer, FileText,
  TrendingUp, TrendingDown, Eye, Search, Plus,
  Filter, ChevronLeft, ChevronRight, List,
  Wallet, Info, Trash2, Edit
} from 'lucide-react';

const CompteClientTransactions = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [compte, setCompte] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [stats, setStats] = useState({ total: 0, credits: 0, debits: 0 });

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

      // Charger le compte
      const compteRes = await axiosInstance.get(`/comptes-clients/${id}/`, headers);
      setCompte(compteRes.data);

      // Charger les transactions
      const transRes = await axiosInstance.get(`/comptes-clients/${id}/transactions/`, headers);
      
      let transactionsData = [];
      if (Array.isArray(transRes.data)) {
        transactionsData = transRes.data;
      } else if (transRes.data?.data) {
        transactionsData = transRes.data.data;
      } else if (transRes.data?.results) {
        transactionsData = transRes.data.results;
      }
      
      setTransactions(transactionsData);

      // Calculer les stats
      const total = transactionsData.length;
      const credits = transactionsData.filter(t => t.type_transaction === 'credit')
        .reduce((sum, t) => sum + parseFloat(t.montant || 0), 0);
      const debits = transactionsData.filter(t => t.type_transaction === 'debit')
        .reduce((sum, t) => sum + parseFloat(t.montant || 0), 0);
      
      setStats({ total, credits, debits });

    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        showNotification('Compte client non trouvé', 'error');
        setTimeout(() => navigate('/comptes-clients'), 1500);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

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

  const getTransactionTypeLabel = (type) => {
    return type === 'credit' ? 'Crédit' : 'Débit';
  };

  const getTransactionTypeColor = (type) => {
    return type === 'credit' ? 'text-success' : 'text-error';
  };

  const getTransactionTypeBadge = (type) => {
    return type === 'credit' ? 'badge-success' : 'badge-error';
  };

  const getStatutBadge = (statut) => {
    const map = {
      valide: 'badge-success',
      attente: 'badge-warning',
      annule: 'badge-error',
      rembourse: 'badge-info'
    };
    return map[statut] || 'badge-ghost';
  };

  const getStatutLabel = (statut) => {
    const map = {
      valide: 'Validée',
      attente: 'En attente',
      annule: 'Annulée',
      rembourse: 'Remboursée'
    };
    return map[statut] || statut || 'Inconnu';
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
      remise: 'Remise',
      annulation: 'Annulation',
      autre: 'Autre'
    };
    return map[categorie] || categorie || 'Non défini';
  };

  // ============================================================
  // FILTRES
  // ============================================================
  const filteredTransactions = transactions.filter(t => {
    const matchSearch = !searchTerm ||
      (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.categorie || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.reference_paiement || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchType = typeFilter === 'all' || t.type_transaction === typeFilter;

    return matchSearch && matchType;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter]);

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-base font-semibold text-base-content/70 animate-pulse">
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
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      
      {/* ============================================================
          NOTIFICATION TOAST
          ============================================================ */}
      {notification.show && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : notification.type === 'error' ? 'alert-error' : 'alert-info'} shadow-xl rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? 
                <CheckCircle className="w-4 h-4 flex-shrink-0" /> : 
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              }
              <span className="font-medium text-sm">{notification.message}</span>
            </div>
            <button 
              className="btn btn-ghost btn-xs btn-circle" 
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          EN-TÊTE
          ============================================================ */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl"></div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(`/comptes-clients/${id}`)}
              className="btn btn-ghost btn-sm gap-2 hover:bg-primary/10 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
                <CreditCard className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
                <p className="text-sm text-gray-500">
                  {compte?.prenom} {compte?.nom} - {compte?.matricule}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className={`badge ${isOnline ? 'badge-success' : 'badge-error'} gap-1 px-2 py-2 text-xs`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </div>
            <button 
              onClick={fetchData} 
              className="btn btn-sm btn-outline gap-2 hover:bg-primary/10 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button 
              onClick={() => navigate(`/comptes-clients/${id}/transactions/ajouter`)} 
              className="btn btn-sm btn-primary gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          STATISTIQUES RAPIDES
          ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Total transactions</p>
          <p className="text-lg font-bold text-primary">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Total crédits</p>
          <p className="text-lg font-bold text-success">{formatCurrency(stats.credits)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Total débits</p>
          <p className="text-lg font-bold text-error">{formatCurrency(stats.debits)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Solde</p>
          <p className={`text-lg font-bold ${parseFloat(compte?.solde || 0) > 0 ? 'text-error' : 'text-success'}`}>
            {formatCurrency(compte?.solde || 0)}
          </p>
        </div>
      </div>

      {/* ============================================================
          FILTRES
          ============================================================ */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par description, catégorie, référence..."
              className="input input-bordered w-full pl-9 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="select select-bordered w-full sm:w-auto focus:border-primary" 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">Tous les types</option>
            <option value="credit">Crédits</option>
            <option value="debit">Débits</option>
          </select>
          
          <button 
            className="btn btn-outline gap-2 hover:bg-primary/10 transition-all" 
            onClick={() => { 
              setTypeFilter('all');
              setSearchTerm('');
            }}
          >
            <RefreshCw className="w-4 h-4" /> Réinitialiser
          </button>
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
                <th className="py-4 font-semibold">Date</th>
                <th className="py-4 font-semibold">Description</th>
                <th className="py-4 font-semibold hidden sm:table-cell">Catégorie</th>
                <th className="py-4 font-semibold hidden md:table-cell">Référence</th>
                <th className="py-4 font-semibold">Type</th>
                <th className="py-4 font-semibold text-right">Montant</th>
                <th className="py-4 font-semibold hidden lg:table-cell">Statut</th>
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
                        {searchTerm || typeFilter !== 'all'
                          ? 'Aucune transaction ne correspond aux filtres'
                          : 'Aucune transaction pour ce compte'}
                      </p>
                      <button 
                        onClick={() => navigate(`/comptes-clients/${id}/transactions/ajouter`)} 
                        className="btn btn-primary btn-sm gap-2 mt-2"
                      >
                        <Plus className="w-4 h-4" /> Ajouter une transaction
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm">{formatDate(t.date_transaction)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{t.description || t.libelle || '-'}</p>
                        <p className="text-xs text-gray-400 sm:hidden">
                          {getCategorieLabel(t.categorie)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="badge badge-ghost badge-sm">
                        {getCategorieLabel(t.categorie)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm font-mono">{t.reference_paiement || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${getTransactionTypeBadge(t.type_transaction)} badge-sm`}>
                        {getTransactionTypeLabel(t.type_transaction)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${getTransactionTypeColor(t.type_transaction)}`}>
                        {t.type_transaction === 'credit' ? '+' : '-'} {formatCurrency(t.montant)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`badge ${getStatutBadge(t.statut)} badge-sm`}>
                        {getStatutLabel(t.statut)}
                      </span>
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

      {/* ============================================================
          RÉSUMÉ DU COMPTE
          ============================================================ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Compte client</p>
            <p className="font-semibold">{compte?.prenom} {compte?.nom}</p>
            <p className="text-sm text-gray-400 font-mono">{compte?.matricule}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Solde actuel</p>
            <p className={`text-xl font-bold ${parseFloat(compte?.solde || 0) > 0 ? 'text-error' : 'text-success'}`}>
              {formatCurrency(compte?.solde || 0)}
            </p>
          </div>
          <Link 
            to={`/comptes-clients/${id}`}
            className="btn btn-sm btn-outline gap-2"
          >
            <User className="w-4 h-4" /> Voir le compte
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CompteClientTransactions;