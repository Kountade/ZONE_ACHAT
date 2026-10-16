// src/components/dashboard/ClientDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import AxiosInstance from '../AxiosInstance';
import {
  Package, ShoppingBag, Truck, DollarSign, AlertTriangle,
  TrendingUp, TrendingDown, Users, Warehouse, Clock,
  RefreshCw, Eye, Calendar, CreditCard, FileText, Receipt,
  Wallet, ShoppingBasket, ArrowRight, CheckCircle, UserCircle,
  PackageSearch, Boxes, Layers, History
} from 'lucide-react';

// Enregistrement des composants Chart.js
ChartJS.register(
  ArcElement, Tooltip, Legend,
  BarElement, CategoryScale, LinearScale
);

const ClientDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================
  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      // Charger en parallèle : dashboard + stock
      const [dashRes, stockRes] = await Promise.allSettled([
        AxiosInstance.get('/client-space/dashboard/'),
        AxiosInstance.get('/client-space/my-stock/'),
      ]);

      // Dashboard
      if (dashRes.status === 'fulfilled') {
        setSummary(dashRes.value.data);
      } else {
        const err = dashRes.reason;
        console.error('Erreur dashboard:', err);
        const errorMessage =
          err.response?.data?.error ||
          err.response?.data?.detail ||
          `Erreur ${err.response?.status || ''}`;
        setError(`Erreur dashboard : ${errorMessage}`);
      }

      // Stock
      if (stockRes.status === 'fulfilled') {
        setStockData(stockRes.value.data);
      } else {
        console.error('Erreur stock:', stockRes.reason);
        setStockData({ count: 0, total_quantity: 0, total_value: 0, results: [] });
      }

    } catch (err) {
      console.error('Erreur générale:', err);
      setError('Impossible de charger les données de votre espace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ============================================================
  // FORMATAGE
  // ============================================================
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
          <button className="btn btn-sm btn-ghost" onClick={fetchAll}>
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
        labels: { color: '#6b7280', font: { size: 12 } },
      },
    },
    maintainAspectRatio: false,
  };

  // Graphique : Répartition financière
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
        labels: { color: '#6b7280', font: { size: 12 } },
      },
    },
    maintainAspectRatio: false,
  };

  // ============================================================
  // 🆕 DONNÉES STOCK
  // ============================================================
  const stockLines = stockData?.results || [];
  const stockProducts = stockData?.count || 0;
  const stockQuantity = parseFloat(stockData?.total_quantity || 0);
  const stockValue = parseFloat(stockData?.total_value || 0);

  // Top 5 produits par quantité
  const topStockProducts = [...stockLines]
    .sort((a, b) => parseFloat(b.quantity) - parseFloat(a.quantity))
    .slice(0, 5);

  // Graphique : Top 5 produits en stock (bar chart)
  const stockBarData = {
    labels: topStockProducts.map(p => p.product_name || 'Produit'),
    datasets: [
      {
        label: 'Quantité en stock',
        data: topStockProducts.map(p => parseFloat(p.quantity) || 0),
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const stockBarOptions = {
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.parsed.x} unités`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { color: '#6b7280' },
        grid: { color: '#f3f4f6' },
      },
      y: {
        ticks: { color: '#6b7280', font: { size: 11 } },
        grid: { display: false },
      },
    },
    maintainAspectRatio: false,
  };

  // Graphique camembert : Top 5 produits (répartition par valeur)
  const topByValue = [...stockLines]
    .sort((a, b) => parseFloat(b.total_value) - parseFloat(a.total_value))
    .slice(0, 5);

  const stockPieData = {
    labels: topByValue.map(p => p.product_name || 'Produit'),
    datasets: [
      {
        label: 'Valeur',
        data: topByValue.map(p => parseFloat(p.total_value) || 0),
        backgroundColor: [
          '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444',
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  const stockPieOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#6b7280', font: { size: 11 }, padding: 8 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed;
            return `${ctx.label}: ${new Intl.NumberFormat('fr-FR').format(val)} FCFA`;
          },
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
        <button onClick={fetchAll} className="btn btn-primary gap-2">
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* ============ CARTES STATISTIQUES ============ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">

        {/* Mes Achats */}
        <Link to="/client/orders" className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/60 text-xs font-medium">Mes Achats</p>
                <p className="text-2xl font-bold">{formatNumber(stats.total_orders)}</p>
                <p className="text-xs text-base-content/50 mt-1">commande(s)</p>
              </div>
              <div className="w-11 h-11 rounded-full bg-blue-500/10 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </div>
        </Link>

        {/* Total dépensé */}
        <Link to="/client/orders" className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/60 text-xs font-medium">Total dépensé</p>
                <p className="text-lg font-bold text-success">{formatCurrency(stats.total_spent)}</p>
                <p className="text-xs text-base-content/50 mt-1">{formatNumber(stats.total_invoices)} facture(s)</p>
              </div>
              <div className="w-11 h-11 rounded-full bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
            </div>
          </div>
        </Link>

        {/* Reste à payer */}
        <Link to="/client/invoices" className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/60 text-xs font-medium">Reste à payer</p>
                <p className="text-lg font-bold text-error">{formatCurrency(stats.total_due)}</p>
                <p className="text-xs text-base-content/50 mt-1">montant dû</p>
              </div>
              <div className="w-11 h-11 rounded-full bg-error/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-error" />
              </div>
            </div>
          </div>
        </Link>

        {/* Porte-monnaie */}
        <Link to="/client/wallet" className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/60 text-xs font-medium">Porte-monnaie</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(stats.wallet_balance)}</p>
                <p className="text-xs text-base-content/50 mt-1">solde disponible</p>
              </div>
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>
        </Link>

        {/* 🆕 Mon Stock */}
        <Link to="/client/stock" className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/60 text-xs font-medium">Mon Stock</p>
                <p className="text-lg font-bold text-purple-600">
                  {formatNumber(stockQuantity)} unités
                </p>
                <p className="text-xs text-base-content/50 mt-1">
                  {formatNumber(stockProducts)} produit(s) • {formatCurrency(stockValue)}
                </p>
              </div>
              <div className="w-11 h-11 rounded-full bg-purple-500/10 flex items-center justify-center">
                <PackageSearch className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* ============================================================ */}
      {/* 🆕 SECTION STOCK CLIENT                                        */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

        {/* Résumé Stock */}
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 shadow-md border border-purple-200">
          <div className="card-body p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-purple-800 flex items-center gap-2">
                <Boxes className="w-5 h-5" />
                Résumé du stock
              </h3>
              <Link
                to="/client/stock"
                className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1"
              >
                Voir
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">
                    Produits différents
                  </span>
                </div>
                <span className="font-bold text-purple-900">{formatNumber(stockProducts)}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">
                    Quantité totale
                  </span>
                </div>
                <span className="font-bold text-purple-900">
                  {formatNumber(stockQuantity)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">
                    Valeur totale
                  </span>
                </div>
                <span className="font-bold text-purple-900">
                  {formatCurrency(stockValue)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Graphique : Top 5 produits par quantité */}
        <div className="card bg-base-100 shadow-md md:col-span-2">
          <div className="card-body p-5">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Top 5 produits en stock (quantités)
            </h3>
            <div className="h-56">
              {topStockProducts.length > 0 ? (
                <Bar data={stockBarData} options={stockBarOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <PackageSearch className="w-12 h-12 text-base-content/20 mx-auto mb-2" />
                    <p className="text-base-content/40 text-sm">
                      Aucun produit en stock
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Graphique : Répartition par valeur */}
      {topByValue.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="card bg-base-100 shadow-md">
            <div className="card-body p-5">
              <h3 className="text-lg font-semibold mb-2">
                Valeur du stock par produit
              </h3>
              <div className="h-64">
                <Pie data={stockPieData} options={stockPieOptions} />
              </div>
            </div>
          </div>

          {/* Liste des produits */}
          <div className="card bg-base-100 shadow-md">
            <div className="card-body p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-500" />
                  Détail du stock
                </h3>
                <Link
                  to="/client/stock"
                  className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1"
                >
                  Tout voir
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {stockLines.slice(0, 6).map((ligne, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-base-200/50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded bg-purple-500/10 flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {ligne.product_name}
                        </p>
                        <p className="text-xs text-base-content/50 truncate">
                          {ligne.product_code}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-sm font-bold text-purple-700">
                        {formatNumber(ligne.quantity)}
                      </p>
                      <p className="text-xs text-base-content/50">
                        {formatCurrency(ligne.total_value)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {stockLines.length > 6 && (
                <p className="text-xs text-center text-base-content/50 mt-2">
                  +{stockLines.length - 6} autre(s) produit(s)
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* GRAPHIQUES COMMANDES + FINANCES                                */}
      {/* ============================================================ */}
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
              <span className="text-xs font-semibold text-orange-600 text-center">Porte-monnaie</span>
            </Link>
            {/* 🆕 Mon Stock */}
            <Link
              to="/client/stock"
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-fuchsia-50 border border-fuchsia-200 hover:shadow-md transition-all group"
            >
              <PackageSearch className="w-6 h-6 text-fuchsia-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-fuchsia-600 text-center">Mon Stock</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;