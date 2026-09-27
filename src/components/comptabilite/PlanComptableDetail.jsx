// src/components/comptabilite/PlanComptableDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Edit, Trash2, BookOpen, RefreshCw,
  X, CheckCircle, AlertCircle, Loader2,
  Hash, Tag, Layers, FileText, Info, Calendar,
  Clock, FolderTree, Wifi, WifiOff,
  TrendingUp, CreditCard, Wallet, DollarSign,
  Eye, Printer, Download, User, Users,
  Building2, Phone, Mail, MapPin
} from 'lucide-react';

const PlanComptableDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [transactions, setTransactions] = useState([]);
  const [showTransactions, setShowTransactions] = useState(false);

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
      const planRes = await axiosInstance.get(`/plan-comptable/${id}/`, headers);
      setPlan(planRes.data);

      // Charger les transactions liées (optionnel)
      try {
        const transRes = await axiosInstance.get(`/plan-comptable/${id}/transactions/`, headers);
        setTransactions(Array.isArray(transRes.data) ? transRes.data : []);
      } catch (transError) {
        console.warn('⚠️ Aucune transaction trouvée pour ce compte');
        setTransactions([]);
      }

    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        setError('Compte comptable non trouvé');
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
      await axiosInstance.delete(`/plan-comptable/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Compte supprimé avec succès', 'success');
      setTimeout(() => navigate('/plan-comptable'), 1500);
    } catch (error) {
      if (error.response?.status === 403) {
        showNotification('Vous n\'avez pas la permission de supprimer', 'error');
      } else if (error.response?.status === 400) {
        showNotification('Impossible de supprimer : des transactions sont associées', 'error');
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
  const formatDate = (date) => {
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

  const getCategorieLabel = (categorie) => {
    const map = {
      actif: 'Actif',
      passif: 'Passif',
      charge: 'Charge',
      produit: 'Produit'
    };
    return map[categorie] || categorie || 'Non défini';
  };

  const getCategorieColor = (categorie) => {
    const map = {
      actif: 'badge-success',
      passif: 'badge-warning',
      charge: 'badge-error',
      produit: 'badge-info'
    };
    return map[categorie] || 'badge-ghost';
  };

  const getCategorieIcon = (categorie) => {
    const map = {
      actif: '📈',
      passif: '📉',
      charge: '💳',
      produit: '💰'
    };
    return map[categorie] || '📊';
  };

  const getTypeLabel = (type) => {
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
      autre: 'Autre'
    };
    return map[type] || type || 'Non défini';
  };

  const getTypeColor = (type) => {
    const map = {
      inscription: 'badge-primary',
      mensualite: 'badge-secondary',
      scolarite: 'badge-info',
      transport: 'badge-warning',
      cantine: 'badge-success',
      bibliotheque: 'badge-ghost',
      activite: 'badge-accent',
      salaire: 'badge-error',
      fourniture: 'badge-ghost',
      entretien: 'badge-ghost',
      equipement: 'badge-ghost',
      taxe: 'badge-ghost',
      assurance: 'badge-ghost',
      autre: 'badge-ghost'
    };
    return map[type] || 'badge-ghost';
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
            Chargement du compte...
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
            <button onClick={() => navigate('/plan-comptable')} className="btn btn-primary gap-2">
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

  if (!plan) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] w-full bg-gray-50 p-4">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-500 mt-4">Aucune donnée</h3>
          <button onClick={() => navigate('/plan-comptable')} className="btn btn-primary gap-2 mt-6">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU - PRINCIPAL
  // ============================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen">
      
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
              <p className="text-base-content/70">Voulez-vous vraiment supprimer ce compte ?</p>
              <p className="font-semibold text-error mt-2 text-lg">{plan.code} - {plan.nom}</p>
              <p className="text-sm text-gray-500">{getCategorieLabel(plan.categorie)}</p>
              {!plan.est_actif && (
                <p className="text-sm text-warning mt-3 flex items-center justify-center gap-1">
                  <AlertCircle className="w-4 h-4" /> Ce compte est déjà inactif
                </p>
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
              onClick={() => navigate('/plan-comptable')} 
              className="btn btn-ghost btn-sm gap-2 hover:bg-primary/10 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
                <BookOpen className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  {plan.code} - {plan.nom}
                  {plan.est_actif && (
                    <CheckCircle className="w-5 h-5 text-success" />
                  )}
                </h1>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="font-mono">#{plan.id}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span className="flex items-center gap-1">
                    {getCategorieIcon(plan.categorie)} {getCategorieLabel(plan.categorie)}
                  </span>
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
              onClick={() => navigate(`/plan-comptable/${id}/modifier`)} 
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
        <div className={`badge ${getCategorieColor(plan.categorie)} p-3 text-sm gap-1`}>
          {getCategorieIcon(plan.categorie)} {getCategorieLabel(plan.categorie)}
        </div>
        <div className={`badge ${plan.est_actif ? 'badge-success' : 'badge-error'} p-3 text-sm gap-1`}>
          {plan.est_actif ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {plan.est_actif ? 'Actif' : 'Inactif'}
        </div>
        {plan.parent && (
          <div className="badge badge-ghost p-3 text-sm gap-1">
            <FolderTree className="w-4 h-4" /> Parent: {plan.parent_nom || plan.parent}
          </div>
        )}
        <div className="badge badge-ghost p-3 text-sm gap-1">
          <Tag className="w-4 h-4" /> Type: {getTypeLabel(plan.type)}
        </div>
      </div>

      {/* ============================================================
          INFORMATIONS DÉTAILLÉES
          ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Informations générales */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-primary" /> Informations générales
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
              <span className="text-gray-500">Code</span>
              <span className="font-mono font-bold text-primary">{plan.code}</span>
            </div>
            <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
              <span className="text-gray-500">Nom</span>
              <span className="font-medium">{plan.nom}</span>
            </div>
            <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
              <span className="text-gray-500">Catégorie</span>
              <span className={`badge ${getCategorieColor(plan.categorie)}`}>
                {getCategorieLabel(plan.categorie)}
              </span>
            </div>
            <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
              <span className="text-gray-500">Type</span>
              <span className={`badge ${getTypeColor(plan.type)}`}>
                {getTypeLabel(plan.type)}
              </span>
            </div>
            <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
              <span className="text-gray-500">Statut</span>
              <span className={`badge ${plan.est_actif ? 'badge-success' : 'badge-error'}`}>
                {plan.est_actif ? 'Actif' : 'Inactif'}
              </span>
            </div>
            {plan.parent && (
              <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                <span className="text-gray-500">Compte parent</span>
                <span className="font-medium">{plan.parent_nom || plan.parent}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Description</span>
              <span className="font-medium text-right max-w-[200px]">{plan.description || '-'}</span>
            </div>
          </div>
        </div>

        {/* Statistiques et audit */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-primary" /> Audit & Statistiques
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
              <span className="text-gray-500">ID</span>
              <span className="font-mono text-sm">#{plan.id}</span>
            </div>
            <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
              <span className="text-gray-500">Créé le</span>
              <span className="font-medium">{formatDate(plan.date_creation)}</span>
            </div>
            <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
              <span className="text-gray-500">Modifié le</span>
              <span className="font-medium">{formatDate(plan.date_modification)}</span>
            </div>
            <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
              <span className="text-gray-500">Transactions associées</span>
              <span className="font-bold text-primary">{transactions.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Statut d'utilisation</span>
              <span className={`badge ${transactions.length > 0 ? 'badge-warning' : 'badge-success'}`}>
                {transactions.length > 0 ? 'Utilisé' : 'Non utilisé'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          TRANSACTIONS ASSOCIÉES
          ============================================================ */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-gray-700">
                Transactions associées ({transactions.length})
              </h3>
            </div>
            <button 
              onClick={() => setShowTransactions(!showTransactions)}
              className="btn btn-sm btn-outline gap-1"
            >
              {showTransactions ? 'Masquer' : 'Afficher'}
            </button>
          </div>
        </div>

        {showTransactions && (
          <div className="p-4">
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Aucune transaction associée</p>
                <p className="text-sm text-gray-400">Ce compte n'a pas encore été utilisé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr className="text-xs">
                      <th>ID</th>
                      <th>Montant</th>
                      <th>Type</th>
                      <th>Catégorie</th>
                      <th>Date</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 20).map(t => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="text-sm font-mono">#{t.id}</td>
                        <td className={`font-bold ${t.type_transaction === 'credit' ? 'text-success' : 'text-error'}`}>
                          {t.type_transaction === 'credit' ? '+' : '-'} {t.montant || 0} CFA
                        </td>
                        <td>
                          <span className={`badge ${t.type_transaction === 'credit' ? 'badge-success' : 'badge-error'} badge-xs`}>
                            {t.type_transaction || '-'}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-ghost badge-xs">{t.categorie || '-'}</span>
                        </td>
                        <td className="text-sm">{formatDate(t.date_transaction)}</td>
                        <td>
                          <span className={`badge ${t.est_valide ? 'badge-success' : 'badge-warning'} badge-xs`}>
                            {t.est_valide ? 'Validée' : 'En attente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {transactions.length > 20 && (
                  <p className="text-sm text-gray-400 text-center mt-4">
                    + {transactions.length - 20} autres transactions
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================
          AUDIT
          ============================================================ */}
      <div className="text-xs text-gray-400 text-center py-2">
        Créé le {formatDate(plan.date_creation)} • 
        Modifié le {formatDate(plan.date_modification)}
      </div>
    </div>
  );
};

export default PlanComptableDetail;