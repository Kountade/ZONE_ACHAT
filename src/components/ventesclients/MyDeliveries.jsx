// src/components/ventesclients/MyDeliveries.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Truck, Clock, CheckCircle, XCircle, Package, RefreshCw,
  Loader2, ChevronDown, ChevronUp, Search, MapPin, Phone,
  User, Calendar, AlertTriangle, Plus, Edit, Trash2
} from 'lucide-react';

const MyDeliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);   // ID en cours d'action
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const getToken = () => localStorage.getItem('Token');
  const showNotif = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return '-'; }
  };

  const formatCurrency = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;

  // ============================================================
  // CHARGEMENT
  // ============================================================
  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await AxiosInstance.get(
        `/client-space/my-deliveries/?${params.toString()}`,
        { headers: { 'Authorization': `Token ${token}` } }
      );

      const data = res.data?.results;
      if (Array.isArray(data)) {
        setDeliveries(data);
      } else {
        setDeliveries([]);
      }
      setStats(res.data?.stats || {});
      setIsFirstLoad(false);
    } catch (e) {
      console.error(e);
      setDeliveries([]);
      showNotif('Erreur de chargement', 'error');
      setIsFirstLoad(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [statusFilter]);

  // ============================================================
  // ACTIONS
  // ============================================================
  const handleCancel = async (deliveryId) => {
    const reason = window.prompt(
      'Raison de l\'annulation (optionnel) :',
      ''
    );
    if (reason === null) return;   // Annulé par l'utilisateur

    setActionLoading(deliveryId);
    try {
      const token = getToken();
      await AxiosInstance.post(
        `/client-space/${deliveryId}/my-deliveries/cancel/`,
        { reason: reason || '' },
        { headers: { 'Authorization': `Token ${token}` } }
      );
      showNotif('Demande annulée', 'success');
      fetchDeliveries();
    } catch (e) {
      const msg = e.response?.data?.error || 'Erreur lors de l\'annulation';
      showNotif(Array.isArray(msg) ? msg[0] : msg, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================================
  // FILTRAGE LOCAL
  // ============================================================
  const filteredDeliveries = Array.isArray(deliveries)
    ? deliveries.filter(d => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
          d.delivery_number?.toLowerCase().includes(q) ||
          d.recipient_name?.toLowerCase().includes(q) ||
          d.recipient_phone?.toLowerCase().includes(q) ||
          d.carrier?.toLowerCase().includes(q) ||
          d.tracking_number?.toLowerCase().includes(q)
        );
      })
    : [];

  // ============================================================
  // BADGE STATUT
  // ============================================================
  const getStatusBadge = (status) => {
    const configs = {
      pending: { label: 'En attente', className: 'badge-warning', icon: Clock },
      confirmed: { label: 'Validée', className: 'badge-info', icon: CheckCircle },
      in_transit: { label: 'En transit', className: 'badge-info', icon: Truck },
      delivered: { label: 'Livrée', className: 'badge-success', icon: CheckCircle },
      cancelled: { label: 'Annulée', className: 'badge-ghost', icon: XCircle },
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

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================
  if (loading && isFirstLoad) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-fuchsia-500 animate-spin mx-auto" />
          <p className="text-gray-500">Chargement...</p>
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

      {/* Header */}
      <div className="bg-gradient-to-r from-fuchsia-500/10 via-fuchsia-500/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-fuchsia-500/10 rounded-xl">
              <Truck className="w-7 h-7 text-fuchsia-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-fuchsia-600">
                Mes Livraisons
              </h1>
              <p className="text-sm text-gray-500">
                Créez et suivez vos demandes de livraison
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchDeliveries}
              className="btn btn-sm btn-outline gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <Link
              to="/client/deliveries/nouvelle"
              className="btn btn-sm bg-fuchsia-600 hover:bg-fuchsia-700 text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouvelle demande
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
        <div className="bg-white shadow-md rounded-xl p-3">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-xl font-bold text-fuchsia-600">{stats.total || 0}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="input input-bordered w-full pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="select select-bordered w-full"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="confirmed">Validées</option>
            <option value="in_transit">En transit</option>
            <option value="delivered">Livrées</option>
            <option value="cancelled">Annulées</option>
            <option value="rejected">Rejetées</option>
          </select>
        </div>
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {loading && !isFirstLoad ? (
          <div className="bg-white rounded-xl p-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-fuchsia-500 animate-spin" />
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucune demande</p>
            <p className="text-sm text-gray-400 mt-1">
              Créez votre première demande de livraison
            </p>
            <Link
              to="/client/deliveries/nouvelle"
              className="btn btn-primary btn-sm mt-4 gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouvelle demande
            </Link>
          </div>
        ) : (
          filteredDeliveries.map((d) => {
            const canEdit = d.can_be_edited_by_client;
            const canCancel = d.can_be_cancelled_by_client;
            const isActionLoading = actionLoading === d.id;

            return (
              <div key={d.id} className="bg-white rounded-xl shadow-md overflow-hidden">

                {/* En-tête */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-lg bg-fuchsia-500/10 flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5 text-fuchsia-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono font-semibold text-fuchsia-600">
                        {d.delivery_number}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {formatDate(d.request_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-bold">{d.total_quantity} unités</p>
                      <p className="text-xs text-gray-500">{formatCurrency(d.total_value)}</p>
                    </div>
                    {getStatusBadge(d.status)}
                    {expandedId === d.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </div>

                {/* Détails */}
                {expandedId === d.id && (
                  <div className="border-t bg-gray-50 p-4 space-y-4">

                    {/* Actions */}
                    {(canEdit || canCancel) && (
                      <div className="flex flex-wrap gap-2">
                        {canEdit && (
                          <Link
                            to={`/client/deliveries/${d.id}/modifier`}
                            className="btn btn-warning btn-sm gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Modifier
                          </Link>
                        )}
                        {canCancel && (
                          <button
                            onClick={() => handleCancel(d.id)}
                            disabled={isActionLoading}
                            className="btn btn-error btn-sm gap-2"
                          >
                            {isActionLoading
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />
                            }
                            Annuler la demande
                          </button>
                        )}
                      </div>
                    )}

                    {/* Rejet */}
                    {d.status === 'rejected' && d.rejection_reason && (
                      <div className="alert alert-error">
                        <AlertTriangle className="w-5 h-5" />
                        <div>
                          <p className="font-semibold">Rejetée par l'administrateur</p>
                          <p className="text-sm">{d.rejection_reason}</p>
                        </div>
                      </div>
                    )}

                    {/* Timeline */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Progression</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <div>
                            <p className="text-sm font-medium">Créée</p>
                            <p className="text-xs text-gray-500">{formatDate(d.request_date)}</p>
                          </div>
                        </div>
                        {d.confirmed_date && (
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-success" />
                            <div>
                              <p className="text-sm font-medium">Validée</p>
                              <p className="text-xs text-gray-500">{formatDate(d.confirmed_date)}</p>
                            </div>
                          </div>
                        )}
                        {d.shipped_date && (
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-info" />
                            <div>
                              <p className="text-sm font-medium">Expédiée</p>
                              <p className="text-xs text-gray-500">{formatDate(d.shipped_date)}</p>
                            </div>
                          </div>
                        )}
                        {d.delivered_date && (
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-success" />
                            <div>
                              <p className="text-sm font-medium">Livrée</p>
                              <p className="text-xs text-gray-500">{formatDate(d.delivered_date)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Destinataire */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Destinataire</h4>
                      <div className="bg-white rounded-lg p-3 space-y-1 text-sm">
                        <p className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">{d.recipient_name}</span>
                        </p>
                        <p className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          {d.recipient_phone}
                        </p>
                        {d.recipient_address && (
                          <p className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            {d.recipient_address}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Transport */}
                    {(d.carrier || d.tracking_number || d.vehicle_plate) && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Transport</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          {d.carrier && (
                            <div className="bg-white rounded-lg p-2">
                              <p className="text-xs text-gray-500">Transporteur</p>
                              <p className="font-medium">{d.carrier}</p>
                            </div>
                          )}
                          {d.tracking_number && (
                            <div className="bg-white rounded-lg p-2">
                              <p className="text-xs text-gray-500">N° de suivi</p>
                              <p className="font-mono font-medium">{d.tracking_number}</p>
                            </div>
                          )}
                          {d.vehicle_plate && (
                            <div className="bg-white rounded-lg p-2">
                              <p className="text-xs text-gray-500">Immatriculation</p>
                              <p className="font-mono font-medium">{d.vehicle_plate}</p>
                            </div>
                          )}
                          {d.driver_name && (
                            <div className="bg-white rounded-lg p-2">
                              <p className="text-xs text-gray-500">Chauffeur</p>
                              <p className="font-medium">{d.driver_name}</p>
                            </div>
                          )}
                          {d.driver_phone && (
                            <div className="bg-white rounded-lg p-2">
                              <p className="text-xs text-gray-500">Tél. chauffeur</p>
                              <p className="font-medium">{d.driver_phone}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Produits */}
                    {Array.isArray(d.lignes) && d.lignes.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Produits</h4>
                        <div className="space-y-2">
                          {d.lignes.map((l) => (
                            <div key={l.id} className="bg-white rounded-lg p-2 flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <Package className="w-4 h-4 text-fuchsia-600 shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{l.product_name}</p>
                                  <p className="text-xs text-gray-500">{l.product_code}</p>
                                </div>
                              </div>
                              <div className="text-right shrink-0 ml-2">
                                <p className="font-bold text-sm text-fuchsia-600">{l.quantity}</p>
                                <p className="text-xs text-gray-500">{formatCurrency(l.total_value)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Message client */}
                    {d.client_notes && (
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <h4 className="text-xs font-bold text-blue-700 uppercase mb-1">Mon message</h4>
                        <p className="text-sm text-blue-800">{d.client_notes}</p>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default MyDeliveries;