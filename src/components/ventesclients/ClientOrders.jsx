// src/components/client/ClientOrders.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ShoppingBag, Package, CheckCircle, AlertTriangle,
  RefreshCw, Eye, Filter, Calendar, Receipt, TrendingUp,
  ChevronLeft, ChevronRight, FileText, DollarSign, X,
  Truck, MapPin, Hash, Info, CreditCard
} from 'lucide-react';

// ============================================================
// HELPERS
// ============================================================
const formatCurrency = (num) => {
  const n = parseFloat(num);
  if (isNaN(n)) return '0 FCFA';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'XOF', maximumFractionDigits: 0,
  }).format(n).replace('XOF', 'FCFA').trim();
};

const formatNumber = (num) => {
  const n = parseFloat(num);
  if (isNaN(n)) return '0';
  return new Intl.NumberFormat('fr-FR').format(n);
};

const formatDate = (date) => {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch { return '—'; }
};

const formatDateTime = (date) => {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
};

// ============================================================
// BADGES
// ============================================================
const STATUS_MAP = {
  draft:     { cls: 'badge-ghost',   label: 'Brouillon' },
  confirmed: { cls: 'badge-info',    label: 'Confirmée' },
  paid:      { cls: 'badge-success', label: 'Payée' },
  delivered: { cls: 'badge-primary', label: 'Livrée' },
  cancelled: { cls: 'badge-error',   label: 'Annulée' },
  returned:  { cls: 'badge-warning', label: 'Retournée' },
};

const PAYMENT_MAP = {
  paid:    { cls: 'badge-success', label: 'Payé' },
  partial: { cls: 'badge-warning', label: 'Partiel' },
  pending: { cls: 'badge-ghost',   label: 'En attente' },
};

const StatusBadge = ({ status, display }) => {
  const c = STATUS_MAP[status] || { cls: 'badge-ghost', label: display || status || '—' };
  return <span className={`badge badge-sm ${c.cls}`}>{display || c.label}</span>;
};

const PaymentBadge = ({ status, display }) => {
  const c = PAYMENT_MAP[status] || { cls: 'badge-ghost', label: display || status || '—' };
  return <span className={`badge badge-sm ${c.cls}`}>{display || c.label}</span>;
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const ClientOrders = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtres
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  // Détail
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ============================================================
  // FETCH LISTE
  // ============================================================
  const fetchOrders = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      if (statusFilter) params.append('status', statusFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await AxiosInstance.get(
        `/client-space/my-orders/?${params.toString()}`
      );

      const data = response.data || {};

      // Gestion des 2 cas : results = array OU objet { stats, results }
      let rawResults = data.results;
      let extractedStats = data.stats;

      if (rawResults && !Array.isArray(rawResults) && typeof rawResults === 'object') {
        extractedStats = rawResults.stats || extractedStats;
        rawResults = rawResults.results || rawResults.data || [];
      }

      const results = Array.isArray(rawResults) ? rawResults : [];

      setOrders(results);
      setStats(extractedStats || null);
      setTotalCount(data.count || results.length);
    } catch (err) {
      console.error('Erreur chargement commandes:', err);
      let msg = 'Impossible de charger vos commandes';
      if (err.response) {
        const d = err.response.data;
        msg = d?.error || d?.detail || d?.message || `Erreur ${err.response.status}`;
        setError(`Erreur ${err.response.status}: ${msg}`);
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
    fetchOrders(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, dateFrom, dateTo]);

  // ============================================================
  // DÉTAIL
  // ============================================================
  const openOrderDetail = async (order) => {
    setSelectedOrder(order);
    setDetailLoading(true);
    try {
      const response = await AxiosInstance.get(
        `/client-space/${order.id}/order-detail/`
      );
      setSelectedOrder(response.data);
    } catch (err) {
      console.error('Erreur chargement détail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedOrder(null);
    setDetailLoading(false);
  };

  // ============================================================
  // FILTRES CLIENT-SIDE
  // ============================================================
  const filteredOrders = orders.filter((o) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (o.invoice_number || '').toLowerCase().includes(s) ||
      (o.order_number || '').toLowerCase().includes(s) ||
      (o.client_name || '').toLowerCase().includes(s)
    );
  });

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const activeFiltersCount = [statusFilter, dateFrom, dateTo].filter(Boolean).length;

  // ============================================================
  // RENDU : CHARGEMENT
  // ============================================================
  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-blue-500"></div>
          <p className="mt-4 text-base-content/60">Chargement de vos commandes...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU : ERREUR
  // ============================================================
  if (error && orders.length === 0) {
    return (
      <div className="p-6">
        <div className="alert alert-error shadow-lg">
          <AlertTriangle className="w-6 h-6" />
          <span>{error}</span>
          <button className="btn btn-sm btn-ghost" onClick={() => fetchOrders(1)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  return (
    <div className="p-4 md:p-6 bg-base-200 min-h-screen">

      {/* ============ EN-TÊTE ============ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-blue-500" />
            Mes Achats
          </h1>
          <p className="text-base-content/60 text-sm mt-1">
            Historique complet de vos commandes et achats
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn btn-outline gap-2 ${activeFiltersCount > 0 ? 'btn-primary' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Filtres
            {activeFiltersCount > 0 && (
              <span className="badge badge-sm badge-primary">{activeFiltersCount}</span>
            )}
          </button>
          <button onClick={() => fetchOrders(currentPage)} className="btn btn-primary gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* ============ CARTES STATISTIQUES ============ */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card bg-base-100 shadow-md">
            <div className="card-body p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm font-medium">Total commandes</p>
                  <p className="text-2xl font-bold">{formatNumber(stats.total_orders)}</p>
                  <p className="text-xs text-base-content/50 mt-1">toutes périodes</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md">
            <div className="card-body p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm font-medium">Montant total</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.total_amount)}</p>
                  <p className="text-xs text-base-content/50 mt-1">toutes commandes</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md">
            <div className="card-body p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm font-medium">Total payé</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(stats.total_paid)}</p>
                  <p className="text-xs text-base-content/50 mt-1">montant réglé</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md">
            <div className="card-body p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm font-medium">Reste à payer</p>
                  <p className="text-2xl font-bold text-error">{formatCurrency(stats.total_due)}</p>
                  <p className="text-xs text-base-content/50 mt-1">montant dû</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-error" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ FILTRES ============ */}
      {showFilters && (
        <div className="card bg-base-100 shadow-md mb-6">
          <div className="card-body p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-500" />
                Filtres de recherche
              </h3>
              <button onClick={resetFilters} className="btn btn-xs btn-ghost gap-1">
                <X className="w-3 h-3" />
                Réinitialiser
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="label"><span className="label-text text-xs">Recherche</span></label>
                <input
                  type="text"
                  placeholder="N° facture, commande..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input input-bordered input-sm w-full"
                />
              </div>
              <div>
                <label className="label"><span className="label-text text-xs">Statut</span></label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="select select-bordered select-sm w-full"
                >
                  <option value="">Tous</option>
                  <option value="draft">Brouillon</option>
                  <option value="confirmed">Confirmée</option>
                  <option value="paid">Payée</option>
                  <option value="delivered">Livrée</option>
                  <option value="cancelled">Annulée</option>
                  <option value="returned">Retournée</option>
                </select>
              </div>
              <div>
                <label className="label"><span className="label-text text-xs">Du</span></label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                  className="input input-bordered input-sm w-full"
                />
              </div>
              <div>
                <label className="label"><span className="label-text text-xs">Au</span></label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                  className="input input-bordered input-sm w-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ LISTE ============ */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-500" />
              Liste de mes commandes
              <span className="badge badge-ghost badge-sm">
                {formatNumber(totalCount || filteredOrders.length)}
              </span>
            </h2>
          </div>
          <div className="divider my-2"></div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="loading loading-spinner loading-md text-blue-500"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 mx-auto text-base-content/20 mb-3" />
              <p className="text-base-content/60 font-medium">Aucune commande trouvée</p>
              <p className="text-base-content/40 text-sm mt-1">
                {activeFiltersCount > 0 || search
                  ? 'Essayez de modifier vos filtres'
                  : "Vous n'avez pas encore passé de commande"}
              </p>
              {(activeFiltersCount > 0 || search) && (
                <button onClick={resetFilters} className="btn btn-sm btn-outline btn-primary mt-3 gap-2">
                  <X className="w-4 h-4" />
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order, idx) => (
                <div
                  key={order.id || idx}
                  className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-lg border border-base-300 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer"
                  onClick={() => openOrderDetail(order)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                      <Receipt className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">
                          {order.invoice_number || `Commande #${order.id}`}
                        </span>
                        {order.order_number && (
                          <span className="text-xs text-base-content/50 font-mono">
                            {order.order_number}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-base-content/60">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(order.sale_date)}</span>
                        {order.warehouse_name && (
                          <>
                            <span>•</span>
                            <span>{order.warehouse_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="md:text-right md:min-w-[140px]">
                    <p className="text-lg font-bold text-blue-600">{formatCurrency(order.total)}</p>
                    {parseFloat(order.amount_due) > 0 ? (
                      <p className="text-xs text-error">Reste: {formatCurrency(order.amount_due)}</p>
                    ) : (
                      <p className="text-xs text-success">Soldée</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 md:min-w-[180px] md:justify-end">
                    <StatusBadge status={order.status} display={order.status_display} />
                    <PaymentBadge status={order.payment_status} display={order.payment_status_display} />
                  </div>

                  <div className="flex items-center gap-1 md:ml-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); openOrderDetail(order); }}
                      className="btn btn-sm btn-ghost btn-circle"
                    >
                      <Eye className="w-4 h-4 text-blue-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalCount > pageSize && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-base-300">
              <span className="text-xs text-base-content/60">
                Page {currentPage} sur {Math.ceil(totalCount / pageSize)}
              </span>
              <div className="join">
                <button
                  className="join-item btn btn-sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="join-item btn btn-sm btn-active">{currentPage}</button>
                <button
                  className="join-item btn btn-sm"
                  disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
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
            <Link to="/client/dashboard" className="flex flex-col items-center justify-center p-4 rounded-xl bg-blue-50 border border-blue-200 hover:shadow-md transition-all group">
              <Package className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-blue-600 text-center">Tableau de bord</span>
            </Link>
            <Link to="/client/invoices" className="flex flex-col items-center justify-center p-4 rounded-xl bg-purple-50 border border-purple-200 hover:shadow-md transition-all group">
              <Receipt className="w-6 h-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-purple-600 text-center">Mes Factures</span>
            </Link>
            <Link to="/client/payments" className="flex flex-col items-center justify-center p-4 rounded-xl bg-green-50 border border-green-200 hover:shadow-md transition-all group">
              <FileText className="w-6 h-6 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-green-600 text-center">Mes Paiements</span>
            </Link>
            <Link to="/client/wallet" className="flex flex-col items-center justify-center p-4 rounded-xl bg-orange-50 border border-orange-200 hover:shadow-md transition-all group">
              <DollarSign className="w-6 h-6 text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-orange-600 text-center">Mon Porte-monnaie</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ============ MODAL DÉTAIL ============ */}
      {selectedOrder && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={closeDetail}></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden pointer-events-auto flex flex-col">

              <div className="p-5 bg-gradient-to-r from-blue-500 to-blue-700 text-white shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Receipt className="w-5 h-5" />
                      {selectedOrder.invoice_number || `Commande #${selectedOrder.id}`}
                    </h2>
                    <div className="flex items-center gap-3 mt-1 text-white/80 text-sm flex-wrap">
                      <span>{formatDateTime(selectedOrder.sale_date)}</span>
                      {selectedOrder.order_number && (
                        <>
                          <span>•</span>
                          <span className="font-mono">{selectedOrder.order_number}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button onClick={closeDetail} className="btn btn-sm btn-ghost btn-circle text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-5 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  <div className="p-3 rounded-lg bg-base-200">
                    <p className="text-xs text-base-content/60">Statut</p>
                    <div className="mt-1">
                      <StatusBadge status={selectedOrder.status} display={selectedOrder.status_display} />
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-base-200">
                    <p className="text-xs text-base-content/60">Paiement</p>
                    <div className="mt-1">
                      <PaymentBadge status={selectedOrder.payment_status} display={selectedOrder.payment_status_display} />
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-base-200">
                    <p className="text-xs text-base-content/60">Entrepôt</p>
                    <p className="font-semibold text-sm mt-1">{selectedOrder.warehouse_name || '—'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-base-200">
                    <p className="text-xs text-base-content/60">Livraison</p>
                    <p className="font-semibold text-sm mt-1">{selectedOrder.delivery_status || '—'}</p>
                  </div>
                </div>

                {detailLoading && (
                  <div className="flex items-center justify-center gap-2 py-3 mb-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="loading loading-spinner loading-sm text-blue-500"></div>
                    <span className="text-sm text-blue-700">Chargement du détail complet...</span>
                  </div>
                )}

                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  Produits commandés
                  {Array.isArray(selectedOrder.lines) && (
                    <span className="badge badge-sm badge-ghost">{selectedOrder.lines.length}</span>
                  )}
                </h3>

                {!Array.isArray(selectedOrder.lines) || selectedOrder.lines.length === 0 ? (
                  <div className="text-center py-6 text-base-content/50 text-sm rounded-lg bg-base-200">
                    {detailLoading ? 'Chargement...' : 'Aucune ligne disponible'}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-base-300">
                    <table className="table table-sm">
                      <thead className="bg-base-200">
                        <tr>
                          <th>Produit</th>
                          <th className="text-center">Qté</th>
                          <th className="text-right">Prix unit.</th>
                          <th className="text-center">Type</th>
                          <th className="text-right">Remise</th>
                          <th className="text-right">TVA</th>
                          <th className="text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.lines.map((line, i) => (
                          <tr key={i} className="hover">
                            <td>
                              <div className="font-medium text-sm">
                                {line.product_name || line.product?.name || '—'}
                              </div>
                              {(line.product_code || line.product?.code) && (
                                <div className="text-xs text-base-content/50 font-mono">
                                  {line.product_code || line.product?.code}
                                </div>
                              )}
                              {line.lot_number && (
                                <div className="text-xs text-base-content/50 mt-0.5">
                                  Lot: <span className="font-mono">{line.lot_number}</span>
                                </div>
                              )}
                              {line.notes && (
                                <div className="text-xs text-base-content/50 italic mt-0.5">{line.notes}</div>
                              )}
                            </td>
                            <td className="text-center">{line.quantity}</td>
                            <td className="text-right">{formatCurrency(line.unit_price)}</td>
                            <td className="text-center">
                              {line.price_type === 'gros' ? (
                                <span className="badge badge-sm badge-warning">Gros</span>
                              ) : (
                                <span className="badge badge-sm badge-ghost">Détail</span>
                              )}
                            </td>
                            <td className="text-right text-warning">
                              {parseFloat(line.discount) > 0 ? `-${formatCurrency(line.discount)}` : '—'}
                            </td>
                            <td className="text-right text-base-content/70">
                              {parseFloat(line.tax_rate) > 0 ? `${line.tax_rate}%` : '—'}
                            </td>
                            <td className="text-right font-semibold">{formatCurrency(line.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-5 p-4 rounded-lg bg-base-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-base-content/60">Sous-total</span>
                    <span className="font-medium">{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  {parseFloat(selectedOrder.discount_amount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-base-content/60">Remise</span>
                      <span className="font-medium text-warning">-{formatCurrency(selectedOrder.discount_amount)}</span>
                    </div>
                  )}
                  {parseFloat(selectedOrder.tax_amount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-base-content/60">TVA</span>
                      <span className="font-medium">{formatCurrency(selectedOrder.tax_amount)}</span>
                    </div>
                  )}
                  {parseFloat(selectedOrder.shipping_fee) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-base-content/60">Livraison</span>
                      <span className="font-medium">{formatCurrency(selectedOrder.shipping_fee)}</span>
                    </div>
                  )}
                  <div className="divider my-1"></div>
                  <div className="flex justify-between">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-lg text-blue-600">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-base-content/60">Payé</span>
                    <span className="font-medium text-success">{formatCurrency(selectedOrder.amount_paid)}</span>
                  </div>
                  {parseFloat(selectedOrder.amount_due) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-base-content/60">Reste à payer</span>
                      <span className="font-medium text-error">{formatCurrency(selectedOrder.amount_due)}</span>
                    </div>
                  )}
                </div>

                {Array.isArray(selectedOrder.payments) && selectedOrder.payments.length > 0 && (
                  <div className="mt-5">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-green-500" />
                      Paiements reçus
                      <span className="badge badge-sm badge-ghost">{selectedOrder.payments.length}</span>
                    </h3>
                    <div className="space-y-2">
                      {selectedOrder.payments.map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{formatCurrency(p.amount)}</p>
                              <p className="text-xs text-base-content/60">
                                {p.method_display || p.method}
                                {p.payment_date && ` • ${formatDateTime(p.payment_date)}`}
                                {p.reference && ` • Réf: ${p.reference}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(selectedOrder.factures) && selectedOrder.factures.length > 0 && (
                  <div className="mt-5">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-500" />
                      Factures associées
                      <span className="badge badge-sm badge-ghost">{selectedOrder.factures.length}</span>
                    </h3>
                    <div className="space-y-2">
                      {selectedOrder.factures.map((f, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-200">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                              <FileText className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium font-mono">{f.invoice_number}</p>
                              <p className="text-xs text-base-content/60">
                                {f.status_display}
                                {f.due_date && ` • Échéance: ${formatDate(f.due_date)}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">{formatCurrency(f.total)}</p>
                            {parseFloat(f.remaining_amount) > 0 && (
                              <p className="text-xs text-error">Reste: {formatCurrency(f.remaining_amount)}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedOrder.delivery_method || selectedOrder.delivery_address || selectedOrder.tracking_number) && (
                  <div className="mt-5 p-4 rounded-lg bg-base-200">
                    <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                      <Truck className="w-4 h-4 text-blue-500" />
                      Informations de livraison
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {selectedOrder.delivery_method && (
                        <div>
                          <p className="text-xs text-base-content/60">Mode</p>
                          <p className="font-medium">{selectedOrder.delivery_method}</p>
                        </div>
                      )}
                      {selectedOrder.delivery_status && (
                        <div>
                          <p className="text-xs text-base-content/60">Statut</p>
                          <p className="font-medium">{selectedOrder.delivery_status}</p>
                        </div>
                      )}
                      {selectedOrder.tracking_number && (
                        <div className="col-span-2">
                          <p className="text-xs text-base-content/60 flex items-center gap-1">
                            <Hash className="w-3 h-3" /> N° de suivi
                          </p>
                          <p className="font-medium font-mono">{selectedOrder.tracking_number}</p>
                        </div>
                      )}
                      {selectedOrder.delivery_address && (
                        <div className="col-span-2">
                          <p className="text-xs text-base-content/60 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Adresse
                          </p>
                          <p className="font-medium">{selectedOrder.delivery_address}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(selectedOrder.notes || selectedOrder.internal_notes) && (
                  <div className="mt-5 space-y-3">
                    {selectedOrder.notes && (
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">
                          <Info className="w-3 h-3" /> Notes
                        </p>
                        <p className="text-sm text-blue-900">{selectedOrder.notes}</p>
                      </div>
                    )}
                    {selectedOrder.internal_notes && (
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <p className="text-xs font-semibold text-amber-700 mb-1">Notes internes</p>
                        <p className="text-sm text-amber-900">{selectedOrder.internal_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-base-300 flex justify-end gap-2 bg-base-50 shrink-0">
                <button onClick={closeDetail} className="btn btn-ghost">Fermer</button>
                <Link to="/client/invoices" className="btn btn-primary gap-2" onClick={closeDetail}>
                  <FileText className="w-4 h-4" />
                  Voir mes factures
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ClientOrders;