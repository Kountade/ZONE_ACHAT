// src/components/comptabilite/CompteClientDetail.jsx
// Détails d'un compte client

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Edit, Trash2, FileText, Printer,
  User, Calendar, CreditCard, Wallet, DollarSign,
  Users, AlertCircle, CheckCircle, Loader2,
  Clock, X, ChevronRight, BadgeCheck,
  Phone, Mail, MapPin, Building2,
  RefreshCw, Wifi, WifiOff, AlertTriangle,
  Info, TrendingUp, TrendingDown, Minus,
  Eye, Download, Search, List, Grid,
  Plus, MoreVertical, FileSpreadsheet
} from 'lucide-react';

const CompteClientDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [compte, setCompte] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [echeances, setEcheances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [activeTab, setActiveTab] = useState('info');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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
    setError(null);
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
      setTransactions(Array.isArray(transRes.data) ? transRes.data : transRes.data?.data || []);

      // Charger les échéances
      const echRes = await axiosInstance.get(`/comptes-clients/${id}/echeances/`, headers);
      setEcheances(Array.isArray(echRes.data) ? echRes.data : echRes.data?.data || []);

    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        setError('Compte client non trouvé');
      } else {
        setError('Erreur lors du chargement');
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    } else {
      setError('ID de compte manquant');
      setLoading(false);
    }
  }, [id]);

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('Token');
      await axiosInstance.delete(`/comptes-clients/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Compte client supprimé avec succès', 'success');
      setTimeout(() => navigate('/comptes-clients'), 1500);
    } catch (error) {
      if (error.response?.status === 403) {
        showNotification('Vous n\'avez pas la permission de supprimer', 'error');
      } else {
        showNotification('Erreur lors de la suppression', 'error');
      }
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
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

  const getTypeClientLabel = (type) => {
    const map = {
      eleve: 'Élève',
      parent: 'Parent',
      tuteur: 'Tuteur',
      entreprise: 'Entreprise',
      autre: 'Autre'
    };
    return map[type] || type;
  };

  const getSituationBadge = (situation) => {
    const map = {
      normal: 'badge-success',
      retard: 'badge-error',
      exclusion: 'badge-error',
      suspendu: 'badge-warning',
      transfert: 'badge-info'
    };
    return map[situation] || 'badge-ghost';
  };

  const getSituationLabel = (situation) => {
    const map = {
      normal: 'Normal',
      retard: 'En retard',
      exclusion: 'Exclusion',
      suspendu: 'Suspendu',
      transfert: 'Transféré'
    };
    return map[situation] || situation;
  };

  const getTransactionTypeLabel = (type) => {
    return type === 'credit' ? 'Crédit' : 'Débit';
  };

  const getEcheanceStatusBadge = (statut) => {
    const map = {
      a_payer: 'badge-warning',
      paye: 'badge-success',
      en_retard: 'badge-error',
      annule: 'badge-ghost'
    };
    return map[statut] || 'badge-ghost';
  };

  const getEcheanceStatusLabel = (statut) => {
    const map = {
      a_payer: 'À payer',
      paye: 'Payé',
      en_retard: 'En retard',
      annule: 'Annulé'
    };
    return map[statut] || statut;
  };

  // Statistiques
  const stats = {
    totalTransactions: transactions.length,
    totalEcheances: echeances.length,
    echeancesRetard: echeances.filter(e => e.statut === 'en_retard').length,
    echeancesPayees: echeances.filter(e => e.statut === 'paye').length,
    totalCredits: transactions.filter(t => t.type_transaction === 'credit').reduce((sum, t) => sum + parseFloat(t.montant || 0), 0),
    totalDebits: transactions.filter(t => t.type_transaction === 'debit').reduce((sum, t) => sum + parseFloat(t.montant || 0), 0),
  };

  // ============================================================
  // RENDU - CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] w-full bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-base font-semibold text-gray-500 mt-4 animate-pulse">
            Chargement du compte client...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - ERREUR
  // ============================================================
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] w-full bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-error" />
          </div>
          <h3 className="text-xl font-bold text-error mt-4">{error}</h3>
          <p className="text-gray-500 text-sm mt-2">Veuillez réessayer.</p>
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={() => navigate('/comptes-clients')} className="btn btn-primary gap-2">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <button onClick={fetchData} className="btn btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!compte) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] w-full bg-gray-50 p-4">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-500 mt-4">Aucune donnée</h3>
          <button onClick={() => navigate('/comptes-clients')} className="btn btn-primary gap-2 mt-6">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>
      </div>
    );
  }

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
                notification.type === 'error' ?
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> :
                <Info className="w-4 h-4 flex-shrink-0" />
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
          MODAL SUPPRESSION
          ============================================================ */}
      {showDeleteModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-base-content/70">Voulez-vous vraiment supprimer ce compte client ?</p>
              <p className="font-semibold text-error mt-2 text-lg">{compte.prenom} {compte.nom}</p>
              <p className="text-sm text-gray-500 mt-1">{compte.matricule}</p>
              {parseFloat(compte.solde || 0) > 0 && (
                <div className="flex items-center justify-center gap-2 text-sm text-warning mt-3">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Solde de {formatCurrency(compte.solde)}</span>
                </div>
              )}
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
          EN-TÊTE
          ============================================================ */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl"></div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/comptes-clients')} 
              className="btn btn-ghost btn-sm gap-2 hover:bg-primary/10 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
                <User className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  {compte.prenom} {compte.nom}
                  {compte.est_actif && (
                    <BadgeCheck className="w-5 h-5 text-success" />
                  )}
                </h1>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="font-mono">{compte.matricule}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span>{getTypeClientLabel(compte.type_client)}</span>
                  {compte.niveau && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                      <span>{compte.niveau}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className={`badge ${isOnline ? 'badge-success' : 'badge-error'} gap-1 px-2 py-2 text-xs`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </div>
            <button 
              onClick={() => navigate(`/comptes-clients/${id}/modifier`)} 
              className="btn btn-sm btn-primary gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <Edit className="w-4 h-4" /> Modifier
            </button>
            <button 
              onClick={() => setShowDeleteModal(true)} 
              className="btn btn-sm btn-error gap-2"
            >
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          BADGES STATUT
          ============================================================ */}
      <div className="flex flex-wrap gap-3">
        <div className={`badge ${getSituationBadge(compte.situation)} p-3 text-sm gap-1`}>
          <AlertCircle className="w-4 h-4" /> {getSituationLabel(compte.situation)}
        </div>
        <div className={`badge ${compte.est_actif ? 'badge-success' : 'badge-error'} p-3 text-sm gap-1`}>
          {compte.est_actif ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {compte.est_actif ? 'Actif' : 'Inactif'}
        </div>
        {compte.date_inscription && (
          <div className="badge badge-ghost p-3 text-sm gap-1">
            <Calendar className="w-4 h-4" /> Inscrit le {formatDate(compte.date_inscription)}
          </div>
        )}
      </div>

      {/* ============================================================
          STATISTIQUES RAPIDES
          ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Total dû</p>
          <p className="text-lg font-bold text-error">{formatCurrency(compte.montant_total_dû)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Total payé</p>
          <p className="text-lg font-bold text-success">{formatCurrency(compte.montant_total_paye)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Solde</p>
          <p className={`text-lg font-bold ${parseFloat(compte.solde || 0) > 0 ? 'text-error' : 'text-success'}`}>
            {formatCurrency(compte.solde)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Transactions</p>
          <p className="text-lg font-bold text-primary">{stats.totalTransactions}</p>
        </div>
      </div>

      {/* ============================================================
          ONGLETS
          ============================================================ */}
      <div className="border-b border-gray-200 bg-white rounded-t-xl px-4">
        <div className="flex overflow-x-auto gap-1">
          {[
            { id: 'info', label: 'Informations', icon: Info },
            { id: 'transactions', label: 'Transactions', icon: CreditCard },
            { id: 'echeances', label: 'Échéances', icon: Calendar },
            { id: 'stats', label: 'Statistiques', icon: TrendingUp },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary' : 'text-gray-400'}`} />
              {tab.label}
              {tab.id === 'transactions' && (
                <span className="badge badge-sm badge-ghost ml-1">{stats.totalTransactions}</span>
              )}
              {tab.id === 'echeances' && (
                <span className="badge badge-sm badge-ghost ml-1">{stats.totalEcheances}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================
          CONTENU DES ONGLETS
          ============================================================ */}
      <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-200 p-4 sm:p-6">
        
        {/* ============================================================
            ONGLET INFORMATIONS
            ============================================================ */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-primary" /> Informations personnelles
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Nom</span>
                  <span className="font-medium">{compte.nom}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Prénom</span>
                  <span className="font-medium">{compte.prenom}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Type</span>
                  <span className="font-medium">{getTypeClientLabel(compte.type_client)}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Matricule</span>
                  <span className="font-mono font-medium">{compte.matricule}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Statut</span>
                  <span className={`badge ${compte.est_actif ? 'badge-success' : 'badge-error'}`}>
                    {compte.est_actif ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <Phone className="w-4 h-4 text-primary" /> Contact
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium truncate max-w-[150px]">{compte.email || '-'}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Téléphone</span>
                  <span className="font-medium">{compte.telephone || '-'}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Téléphone 2</span>
                  <span className="font-medium">{compte.telephone2 || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Adresse</span>
                  <span className="font-medium text-right max-w-[150px]">{compte.adresse || '-'}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-primary" /> Informations scolaires
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Niveau</span>
                  <span className="font-medium">{compte.niveau || '-'}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Classe</span>
                  <span className="font-medium">{compte.classe || '-'}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Année scolaire</span>
                  <span className="font-medium">{compte.annee_scolaire || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date d'inscription</span>
                  <span className="font-medium">{formatDate(compte.date_inscription)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <Wallet className="w-4 h-4 text-primary" /> Situation financière
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Situation</span>
                  <span className={`badge ${getSituationBadge(compte.situation)}`}>
                    {getSituationLabel(compte.situation)}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Dernier paiement</span>
                  <span className="font-medium">{formatDate(compte.date_dernier_paiement)}</span>
                </div>
                {compte.remise_personnalisee > 0 && (
                  <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                    <span className="text-gray-500">Remise</span>
                    <span className="font-medium text-success">{compte.remise_personnalisee}%</span>
                  </div>
                )}
                {compte.remise_motif && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Motif remise</span>
                    <span className="font-medium text-right max-w-[150px]">{compte.remise_motif}</span>
                  </div>
                )}
              </div>
            </div>

            {compte.observation && (
              <div className="md:col-span-2 bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-primary" /> Observations
                </h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{compte.observation}</p>
              </div>
            )}

            <div className="md:col-span-2 bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-primary" /> Audit
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-gray-500">Créé le</span>
                    <span className="font-medium">{formatDateTime(compte.date_creation)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Modifié le</span>
                    <span className="font-medium">{formatDateTime(compte.date_modification)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            ONGLET TRANSACTIONS
            ============================================================ */}
        {activeTab === 'transactions' && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-semibold text-gray-700">
                  Transactions ({stats.totalTransactions})
                </h3>
              </div>
              <button 
                onClick={() => navigate(`/comptes-clients/${id}/transactions/ajouter`)}
                className="btn btn-sm btn-primary gap-1"
              >
                <Plus className="w-4 h-4" /> Ajouter
              </button>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-10">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Aucune transaction pour ce compte</p>
                <button 
                  onClick={() => navigate(`/comptes-clients/${id}/transactions/ajouter`)}
                  className="btn btn-primary btn-sm gap-2 mt-3"
                >
                  <Plus className="w-4 h-4" /> Ajouter une transaction
                </button>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr className="text-xs">
                      <th>Date</th>
                      <th>Libellé</th>
                      <th>Catégorie</th>
                      <th>Type</th>
                      <th className="text-right">Montant</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="text-sm">{formatDate(t.date_transaction)}</td>
                        <td className="font-medium">{t.description || t.libelle || '-'}</td>
                        <td>
                          <span className="badge badge-ghost badge-xs">
                            {t.categorie || '-'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${t.type_transaction === 'credit' ? 'badge-success' : 'badge-error'} badge-xs`}>
                            {getTransactionTypeLabel(t.type_transaction)}
                          </span>
                        </td>
                        <td className={`text-right font-bold ${t.type_transaction === 'credit' ? 'text-success' : 'text-error'}`}>
                          {t.type_transaction === 'credit' ? '+' : '-'} {formatCurrency(t.montant)}
                        </td>
                        <td>
                          <span className={`badge ${t.est_valide ? 'badge-success' : 'badge-warning'} badge-xs`}>
                            {t.est_valide ? 'Validée' : 'En attente'}
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

        {/* ============================================================
            ONGLET ÉCHÉANCES
            ============================================================ */}
        {activeTab === 'echeances' && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-semibold text-gray-700">
                  Échéances ({stats.totalEcheances})
                </h3>
              </div>
              <div className="flex gap-2">
                <span className="badge badge-error">{stats.echeancesRetard} en retard</span>
                <span className="badge badge-success">{stats.echeancesPayees} payées</span>
              </div>
            </div>

            {echeances.length === 0 ? (
              <div className="text-center py-10">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Aucune échéance pour ce compte</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr className="text-xs">
                      <th>Libellé</th>
                      <th>Catégorie</th>
                      <th className="text-right">Montant</th>
                      <th>Date échéance</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {echeances.map(e => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="font-medium">{e.libelle}</td>
                        <td>
                          <span className="badge badge-ghost badge-xs">
                            {e.categorie || '-'}
                          </span>
                        </td>
                        <td className="text-right font-bold">{formatCurrency(e.montant)}</td>
                        <td className="text-sm">{formatDate(e.date_echeance)}</td>
                        <td>
                          <span className={`badge ${getEcheanceStatusBadge(e.statut)} badge-xs`}>
                            {getEcheanceStatusLabel(e.statut)}
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

        {/* ============================================================
            ONGLET STATISTIQUES
            ============================================================ */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <CreditCard className="w-4 h-4 text-primary" /> Transactions
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Total transactions</span>
                  <span className="font-bold">{stats.totalTransactions}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Total crédits</span>
                  <span className="font-bold text-success">{formatCurrency(stats.totalCredits)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total débits</span>
                  <span className="font-bold text-error">{formatCurrency(stats.totalDebits)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-primary" /> Échéances
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Total échéances</span>
                  <span className="font-bold">{stats.totalEcheances}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Payées</span>
                  <span className="font-bold text-success">{stats.echeancesPayees}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500">En retard</span>
                  <span className="font-bold text-error">{stats.echeancesRetard}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Taux de paiement</span>
                  <span className={`font-bold ${stats.totalEcheances > 0 && stats.echeancesPayees / stats.totalEcheances > 0.8 ? 'text-success' : 'text-warning'}`}>
                    {stats.totalEcheances > 0 ? Math.round((stats.echeancesPayees / stats.totalEcheances) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Résumé financier */}
            <div className="md:col-span-2 bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <DollarSign className="w-4 h-4 text-primary" /> Résumé financier
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                  <p className="text-xs text-gray-500 uppercase">Total dû</p>
                  <p className="text-lg font-bold text-error">{formatCurrency(compte.montant_total_dû)}</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                  <p className="text-xs text-gray-500 uppercase">Total payé</p>
                  <p className="text-lg font-bold text-success">{formatCurrency(compte.montant_total_paye)}</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                  <p className="text-xs text-gray-500 uppercase">Solde</p>
                  <p className={`text-lg font-bold ${parseFloat(compte.solde || 0) > 0 ? 'text-error' : 'text-success'}`}>
                    {formatCurrency(compte.solde)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================
          AUDIT
          ============================================================ */}
      <div className="text-xs text-gray-400 text-center py-2">
        Créé le {formatDateTime(compte.date_creation)} • 
        Modifié le {formatDateTime(compte.date_modification)}
      </div>
    </div>
  );
};

export default CompteClientDetail;