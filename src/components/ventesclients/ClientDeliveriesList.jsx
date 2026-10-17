// src/components/ventesclients/ClientDeliveriesList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Truck, Search, RefreshCw, Plus, Eye, Clock, CheckCircle,
  XCircle, Loader2, X, ChevronLeft, ChevronRight, Package,
  User, Phone, MapPin, AlertTriangle, ThumbsUp, Filter
} from 'lucide-react';

const ClientDeliveriesList = () => {
  const navigate = useNavigate();

  const [deliveries, setDeliveries] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('all');   // 🆕
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
      if (originFilter === 'client') params.append('from_client', 'true');
      if (originFilter === 'admin') params.append('from_client', 'false');
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
      showNotif('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, originFilter, searchTerm, navigate]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  // ============================================================
  // PAGINATION
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
      confirmed: { label: 'Validée', className: 'badge-info', icon: ThumbsUp },
      in_transit: { label: 'En transit', className: 'badge-info', icon: Truck },
      delivered: { label: 'Livré', className: 'badge-success', icon: CheckCircle },
      cancelled: { label: 'Annulé', className: 'badge-ghost', icon: XCircle },
      rejected: { label: 'Rejetée', className: 'badge-error', icon: XCircle },
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

  if (loading && isFirstLoad) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-base font-medium text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU
  // ============================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">

      {notification.show && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent rounded-2xl p-5">
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
                Demandes clients & livraisons administrateur
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

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3">
          <p className="text-xs text-gray-500">En attente</p>
          <p className="text-xl font-bold text-warning">{stats.pending || 0}</p>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <p className="text-xs text-gray-500">Validées</p>
          <p className="text-xl font-bold text-info">{stats.confirmed || 0}</p>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <p className="text-xs text-gray-500">En transit</p>
          <p className="text-xl font-bold text-primary">{stats.in_transit || 0}</p>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <p className="text-xs text-gray-500">Livrées</p>
          <p className="text-xl font-bold text-success">{stats.delivered || 0}</p>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3">
          <p className="text-xs text-gray-500">Rejetées</p>
          <p className="text-xl font-bold text-error">{stats.rejected || 0}</p>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3 border-2 border-amber-300">
          <p className="text-xs text-amber-700 font-semibold">⚠ Demandes client</p>
          <p className="text-xl font-bold text-amber-600">{stats.pending_from_clients || 0}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="input input-bordered w-full pl-9"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <select
            className="select select-bordered w-full"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="confirmed">Validées</option>
            <option value="in_transit">En transit</option>
            <option value="delivered">Livrées</option>
            <option value="cancelled">Annulées</option>
            <option value="rejected">Rejetées</option>
          </select>
          <select
            className="select select-bordered w-full"
            value={originFilter}
            onChange={(e) => { setOriginFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">Toutes les origines</option>
            <option value="client">Demandes clients</option>
            <option value="admin">Créées par admin</option>
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
            <p className="text-gray-500 font-medium">Aucune livraison</p>
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
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Destinataire</th>
                    <th className="py-3 px-4 text-center">Origine</th>
                    <th className="py-3 px-4 text-right">Qté</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDeliveries.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-blue-600">
                          {d.delivery_number}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium">{d.client_name}</p>
                        <p className="text-xs text-gray-500">{d.client_code}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm font-medium">{d.recipient_name}</p>
                        <p className="text-xs text-gray-500">{d.recipient_phone}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {d.created_by_client ? (
                          <span className="badge badge-warning badge-sm gap-1">
                            <User className="w-3 h-3" />
                            Client
                          </span>
                        ) : (
                          <span className="badge badge-ghost badge-sm">Admin</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {d.total_quantity}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(d.status)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => navigate(`/client-deliveries/${d.id}`)}
                          className={`btn btn-ghost btn-sm btn-circle ${
                            d.status === 'pending' ? 'text-warning animate-pulse' : 'text-blue-600'
                          }`}
                          title={d.status === 'pending' ? 'À traiter' : 'Détails'}
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
                {deliveries.length} livraison(s)
              </div>
              <div className="flex items-center gap-3">
                <select
                  className="select select-bordered select-sm"
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
                <div className="join">
                  <button
                    className="join-item btn btn-sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
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