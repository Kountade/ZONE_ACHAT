// src/components/ventesclients/ClientDeliveriesList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Truck, Search, RefreshCw, Plus, Eye, Clock, CheckCircle,
  XCircle, Loader2, X, ChevronRight, Package, User, Phone, MapPin
} from 'lucide-react';

const ClientDeliveriesList = () => {
  const navigate = useNavigate();

  const [deliveries, setDeliveries] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const getToken = () => localStorage.getItem('Token');
  const showNotif = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatCurrency = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;

  // ============================================================
  // CHARGEMENT
  // ============================================================
  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotif('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const res = await AxiosInstance.get(
        `/client-delivery/list/?${params.toString()}`,
        { headers: { 'Authorization': `Token ${token}` } }
      );

      setDeliveries(res.data.results || []);
      setStats(res.data.stats || {});
      setIsFirstLoad(false);
    } catch (e) {
      console.error(e);
      if (e.response?.status === 401) {
        showNotif('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotif('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, navigate]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  // ============================================================
  // PAGINATION LOCALE
  // ============================================================
  const paginatedDeliveries = deliveries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(deliveries.length / itemsPerPage);

  // ============================================================
  // BADGE STATUT
  // ============================================================
  const getStatusBadge = (status) => {
    const configs = {
      pending: { label: 'En attente', className: 'badge-warning', icon: Clock },
      in_transit: { label: 'En transit', className: 'badge-info', icon: Truck },
      delivered: { label: 'Livré', className: 'badge-success', icon: CheckCircle },
      cancelled: { label: 'Annulé', className: 'badge-error', icon: XCircle },
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    return (
      <span className={`badge ${config.className} gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  // ============================================================
  // RENDU : CHARGEMENT INITIAL
  // ============================================================
  if (loading && isFirstLoad) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-base font-medium text-gray-500">Chargement des livraisons...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">

      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification({ ...notification, show: false })}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <Truck className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-blue-600">
                Livraisons Clients
              </h1>
              <p className="text-sm text-gray-500">
                Retraits de stock client avec suivi de livraison
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchDeliveries}
              className="btn btn-sm btn-outline gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <Link
              to="/client-deliveries/nouveau"
              className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouvelle Livraison
            </Link>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">En attente</p>
              <p className="text-2xl font-bold text-warning">{stats.pending || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">En transit</p>
              <p className="text-2xl font-bold text-info">{stats.in_transit || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Truck className="w-5 h-5 text-info" />
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Livrées</p>
              <p className="text-2xl font-bold text-success">{stats.delivered || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total</p>
              <p className="text-2xl font-bold text-primary">{stats.total || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher n° livraison, client, destinataire, tracking..."
              className="input input-bordered w-full pl-9"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <select
            className="select select-bordered w-full"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="in_transit">En transit</option>
            <option value="delivered">Livrées</option>
            <option value="cancelled">Annulées</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        {loading && !isFirstLoad ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : deliveries.length === 0 ? (
          <div className="p-12 text-center">
            <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucune livraison trouvée</p>
            <Link
              to="/client-deliveries/nouveau"
              className="btn btn-primary btn-sm mt-4 gap-2"
            >
              <Plus className="w-4 h-4" />
              Créer une livraison
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4">N° Livraison</th>
                    <th className="py-3 px-4">Client source</th>
                    <th className="py-3 px-4">Destinataire</th>
                    <th className="py-3 px-4 hidden lg:table-cell">Date</th>
                    <th className="py-3 px-4 text-right">Quantité</th>
                    <th className="py-3 px-4 text-right">Valeur</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDeliveries.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-blue-600">
                          {d.delivery_number}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{d.client_name}</p>
                          <p className="text-xs text-gray-500">{d.client_code}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-sm flex items-center gap-1">
                            <User className="w-3 h-3 text-blue-500" />
                            {d.recipient_name}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {d.recipient_phone}
                          </p>
                          {d.recipient_address && (
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 truncate max-w-[180px]">
                              <MapPin className="w-3 h-3" />
                              {d.recipient_address}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell text-sm text-gray-600">
                        {formatDate(d.request_date)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {d.total_quantity}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-600">
                        {formatCurrency(d.total_value)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(d.status)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => navigate(`/client-deliveries/${d.id}`)}
                          className="btn btn-ghost btn-sm btn-circle tooltip text-blue-600"
                          data-tip="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
              <div className="text-sm text-gray-500">
                Affichage de {(currentPage - 1) * itemsPerPage + 1} à{' '}
                {Math.min(currentPage * itemsPerPage, deliveries.length)} sur{' '}
                {deliveries.length}
              </div>
              <div className="flex items-center gap-3">
                <select
                  className="select select-bordered select-sm"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value="5">5 lignes</option>
                  <option value="10">10 lignes</option>
                  <option value="20">20 lignes</option>
                  <option value="50">50 lignes</option>
                </select>
                <div className="join">
                  <button
                    className="join-item btn btn-sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                  <span className="join-item btn btn-sm btn-disabled">
                    Page {currentPage} / {totalPages || 1}
                  </span>
                  <button
                    className="join-item btn btn-sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ClientDeliveriesList;