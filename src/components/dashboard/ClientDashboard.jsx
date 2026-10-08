// src/components/dashboard/ClientDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import AxiosInstance from '../AxiosInstance';
import {
  Package, ShoppingBag, Truck, DollarSign, AlertTriangle,
  TrendingUp, TrendingDown, Users, Warehouse, Clock,
  RefreshCw, Eye, Calendar, CreditCard, FileText, Receipt,
  Wallet, ShoppingBasket, ArrowRight, CheckCircle, UserCircle
} from 'lucide-react';

// Enregistrement des composants Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

const ClientDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await AxiosInstance.get('/client-space/dashboard/');
      setSummary(response.data);
    } catch (err) {
      console.error('Erreur chargement dashboard client:', err);
      let errorMessage = 'Impossible de charger les données de votre espace';
      if (err.response) {
        const data = err.response.data;
        errorMessage = data.error || data.detail || data.message || `Erreur ${err.response.status}`;
        setError(`Erreur ${err.response.status}: ${errorMessage}`);
      } else if (err.request) {
        setError('Aucune réponse du serveur. Vérifiez votre connexion.');
      } else {
        setError(`Erreur: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // Formatage
  const formatCurrency = (num) => {
    if (num === undefined || num === null) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' })
      .format(num)
      .replace('XOF', 'FCFA');
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ============================================================
  // RENDU : CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-blue-500"></div>
          <p className="mt-4 text-base-content/60">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU : ERREUR
  // ============================================================
  if (error) {
    return (
      <div className="p-6">
        <div className="alert alert-error shadow-lg">
          <AlertTriangle className="w-6 h-6" />
          <span>{error}</span>
          <button className="btn btn-sm btn-ghost" onClick={fetchSummary}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-6 text-center">
        <p className="text-base-content/60">Aucune donnée disponible</p>
      </div>
    );
  }

  const { client_info, stats, recent_orders, wallet } = summary;

  // ============================================================
  // DONNÉES POUR LES GRAPHIQUES
  // ============================================================

  // Graphique : Répartition des commandes par statut
  const ordersByStatus = (() => {
    const counts = {
      payées: 0,
      partielles: 0,
      en_attente: 0,
      autres: 0
    };
    (recent_orders || []).forEach((order) => {
      if (order.payment_status === 'paid') counts.payées++;
      else if (order.payment_status === 'partial') counts.partielles++;
      else if (order.payment_status === 'pending') counts.en_attente++;
      else counts.autres++;
    });
    return counts;
  })();

  const orderStatusPieData = {
    labels: ['Payées', 'Partielles', 'En attente', 'Autres'],
    datasets: [
      {
        label: 'Commandes',
        data: [
          ordersByStatus.payées,
          ordersByStatus.partielles,
          ordersByStatus.en_attente,
          ordersByStatus.autres
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#6b7280'],
        borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 2,
      },
    ],
  };

  const orderStatusPieOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#6b7280',
          font: { size: 12 },
        },
      },
    },
    maintainAspectRatio: false,
  };

  // Graphique : Répartition financière (payé / restant)
  const paidAmount = parseFloat(stats.total_paid || 0);
  const dueAmount = parseFloat(stats.total_due || 0);
  const hasFinancialData = paidAmount > 0 || dueAmount > 0;

  const financialPieData = {
    labels: ['Payé', 'Restant à payer'],
    datasets: [
      {
        label: 'Montant',
        data: [paidAmount, dueAmount],
        backgroundColor: ['#10b981', '#ef4444'],
        borderColor: ['#ffffff', '#ffffff'],
        borderWidth: 2,
      },
    ],
  };

  const financialPieOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#6b7280',
          font: { size: 12 },
        },
      },
    },
    maintainAspectRatio: false,
  };

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  return (
    <div className="p-4 md:p-6 bg-base-200 min-h-screen">

      {/* ============ EN-TÊTE ============ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
            Bonjour {client_info?.name || 'Client'}
          </h1>
          <p className="text-base-content/60 text-sm mt-1 flex items-center gap-2">
            <UserCircle className="w-4 h-4" />
            {client_info?.code && <span className="font-mono">{client_info.code}</span>}
            {client_info?.phone && <span>• 📞 {client_info.phone}</span>}
          </p>
        </div>
        <button onClick={fetchSummary} className="btn btn-primary gap-2">
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* ============ CARTES STATISTIQUES ============ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        {/* Mes Achats */}
        <Link to="/client/orders" className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
          <div className="card-body p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/60 text-sm font-medium">Mes Achats</p>
                <p className="text-2xl font-bold">{formatNumber(stats.total_orders)}</p>
                <p className="text-xs text-base-content/50 mt-1">commande(s) totale(s)</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>
        </Link>

        {/* Total dépensé */}
        <Link to="/client/orders" className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
          <div className="card-body p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/60 text-sm font-medium">Total dépensé</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(stats.total_spent)}</p>
                <p className="text-xs text-base-content/50 mt-1">{formatNumber(stats.total_invoices)} facture(s)</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>
        </Link>

        {/* Reste à payer */}
        <Link to="/client/invoices" className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
          <div className="card-body p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/60 text-sm font-medium">Reste à payer</p>
                <p className="text-2xl font-bold text-error">{formatCurrency(stats.total_due)}</p>
                <p className="text-xs text-base-content/50 mt-1">montant dû</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-error" />
              </div>
            </div>
          </div>
        </Link>

        {/* Porte-monnaie */}
        <Link to="/client/wallet" className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
          <div className="card-body p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/60 text-sm font-medium">Porte-monnaie</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(stats.wallet_balance)}</p>
                <div className="flex gap-3 text-xs mt-1">
                  <span className="text-success">Dépôts: {formatCurrency(wallet?.total_deposits)}</span>
                  <span className="text-warning">Utilisé: {formatCurrency(wallet?.total_used)}</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* ============ GRAPHIQUES CIRCULAIRES ============ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-5">
            <h3 className="text-lg font-semibold mb-2">État de mes commandes</h3>
            <div className="h-64">
              {recent_orders && recent_orders.length > 0 ? (
                <Pie data={orderStatusPieData} options={orderStatusPieOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-base-content/40">Aucune commande à afficher</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-5">
            <h3 className="text-lg font-semibold mb-2">Répartition financière</h3>
            <div className="h-64">
              {hasFinancialData ? (
                <Pie data={financialPieData} options={financialPieOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-base-content/40">Aucune donnée financière</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============ ALERTES ============ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        <Link to="/client/invoices" className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <div>
                <p className="text-sm font-medium">Factures à payer</p>
                <p className="text-xl font-bold text-warning">
                  {formatNumber(
                    (recent_orders || []).filter(o => o.payment_status !== 'paid').length
                  )}
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link to="/client/orders" className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Commandes en cours</p>
                <p className="text-xl font-bold text-blue-500">
                  {formatNumber(
                    (recent_orders || []).filter(o => ['confirmed', 'in_preparation'].includes(o.status)).length
                  )}
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link to="/client/orders" className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-success" />
              <div>
                <p className="text-sm font-medium">Commandes livrées</p>
                <p className="text-xl font-bold text-success">
                  {formatNumber(
                    (recent_orders || []).filter(o => o.status === 'delivered' || o.status === 'paid').length
                  )}
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* ============ ACTIVITÉS RÉCENTES ============ */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Mes dernières commandes
            </h2>
            <Link
              to="/client/orders"
              className="text-xs font-semibold text-blue-500 hover:text-blue-600 flex items-center gap-1"
            >
              Tout voir
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divider my-2"></div>

          <div className="space-y-3">
            {recent_orders && recent_orders.length > 0 ? (
              recent_orders.map((order, idx) => (
                <Link
                  key={idx}
                  to="/client/orders"
                  className="flex items-start gap-3 p-3 rounded-lg border-l-4 border-l-blue-500 bg-base-200/50 hover:bg-base-200 transition-colors"
                >
                  <div className="mt-1">
                    <Receipt className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">
                        {order.invoice_number || `Commande #${order.id}`}
                      </span>
                      <span className="text-xs text-base-content/40">
                        {formatDate(order.sale_date)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-base-content/60 mt-1">
                      <span className="font-semibold text-success">
                        {formatCurrency(order.total)}
                      </span>
                      {order.status_display && (
                        <span className="badge badge-sm badge-ghost">
                          {order.status_display}
                        </span>
                      )}
                      {order.payment_status_display && (
                        <span className={`badge badge-sm ${
                          order.payment_status === 'paid' ? 'badge-success' :
                          order.payment_status === 'partial' ? 'badge-warning' :
                          'badge-ghost'
                        }`}>
                          {order.payment_status_display}
                        </span>
                      )}
                    </div>
                  </div>
                  <Eye className="w-4 h-4 text-base-content/30" />
                </Link>
              ))
            ) : (
              <p className="text-center text-base-content/40 py-4">
                Aucune commande récente
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ============ ACTIONS RAPIDES ============ */}
      <div className="card bg-base-100 shadow-md mt-6">
        <div className="card-body p-5">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Actions rapides
          </h2>
          <div className="divider my-2"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              to="/client/orders"
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-blue-50 border border-blue-200 hover:shadow-md transition-all group"
            >
              <ShoppingBag className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-blue-600 text-center">Mes Achats</span>
            </Link>
            <Link
              to="/client/invoices"
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-purple-50 border border-purple-200 hover:shadow-md transition-all group"
            >
              <Receipt className="w-6 h-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-purple-600 text-center">Mes Factures</span>
            </Link>
            <Link
              to="/client/payments"
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-green-50 border border-green-200 hover:shadow-md transition-all group"
            >
              <CreditCard className="w-6 h-6 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-green-600 text-center">Mes Paiements</span>
            </Link>
            <Link
              to="/client/wallet"
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-orange-50 border border-orange-200 hover:shadow-md transition-all group"
            >
              <Wallet className="w-6 h-6 text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-orange-600 text-center">Mon Porte-monnaie</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;