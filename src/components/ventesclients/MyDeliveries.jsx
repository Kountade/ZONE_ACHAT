// src/components/ventesclients/MyDeliveries.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Truck, Clock, CheckCircle, XCircle, Package, RefreshCw,
  Loader2, ChevronDown, ChevronUp, Search, MapPin, Phone,
  Car, User, Calendar, AlertTriangle
} from 'lucide-react';

const MyDeliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState(null);

  const getToken = () => localStorage.getItem('Token');

  // ============================================================
  // FORMATAGE
  // ============================================================
  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  const formatCurrency = (n) => {
    const num = Number(n || 0);
    return `${num.toLocaleString('fr-FR')} FCFA`;
  };

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================
  const fetchDeliveries = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();

      if (!token) {
        setError('Session expirée. Veuillez vous reconnecter.');
        setDeliveries([]);
        setIsFirstLoad(false);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await AxiosInstance.get(
        `/client-space/my-deliveries/?${params.toString()}`,
        { headers: { 'Authorization': `Token ${token}` } }
      );

      console.log('✅ Livraisons reçues:', res.data);

      // ✅ SÉCURITÉ : s'assurer que c'est toujours un tableau
      let deliveriesData = [];

      if (res.data && Array.isArray(res.data.results)) {
        // Cas normal : {stats, client_id, client_name, results: [...]}
        deliveriesData = res.data.results;
      } else if (Array.isArray(res.data)) {
        // Cas alternatif : directement un tableau
        deliveriesData = res.data;
      } else {
        console.warn('⚠️ Format inattendu:', res.data);
        deliveriesData = [];
      }

      setDeliveries(deliveriesData);
      setStats(res.data?.stats || {});
      setIsFirstLoad(false);

    } catch (e) {
      console.error('❌ Erreur chargement livraisons:', e);

      let errorMessage = 'Erreur de chargement';

      if (e.response?.status === 401) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      } else if (e.response?.status === 404) {
        errorMessage = 'Service de livraisons introuvable.';
      } else if (e.response?.data?.error) {
        errorMessage = e.response.data.error;
      } else if (e.response?.data?.detail) {
        errorMessage = e.response.data.detail;
      } else if (e.message) {
        errorMessage = e.message;
      }

      setError(errorMessage);
      setDeliveries([]);   // ✅ SÉCURITÉ : toujours un tableau
      setIsFirstLoad(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [statusFilter]);

  // ============================================================
  // FILTRAGE LOCAL (recherche)
  // ============================================================
  const filteredDeliveries = Array.isArray(deliveries)
    ? deliveries.filter((d) => {
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
      pending: { label: 'En préparation', className: 'badge-warning', icon: Clock },
      in_transit: { label: 'En cours de livraison', className: 'badge-info', icon: Truck },
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
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-fuchsia-500 animate-spin mx-auto" />
          <p className="text-gray-500">Chargement de mes livraisons...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU : ERREUR
  // ============================================================
  if (error && deliveries.length === 0) {
    return (
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <div className="alert alert-error shadow-lg">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <h3 className="font-bold">Erreur</h3>
              <p className="text-sm">{error}</p>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={fetchDeliveries}
              className="btn btn-primary btn-sm gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </button>
            <Link
              to="/client/dashboard"
              className="btn btn-ghost btn-sm"
            >
              Retour au tableau de bord
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU : PRINCIPAL
  // ============================================================
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="bg-gradient-to-r from-fuchsia-500/10 via-fuchsia-500/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-fuchsia-500/10 rounded-xl">
              <Truck className="w-7 h-7 text-fuchsia-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-fuchsia-600">
                Suivi de mes Livraisons
              </h1>
              <p className="text-sm text-gray-500">
                Suivez l'acheminement de vos produits vers leurs destinataires
              </p>
            </div>
          </div>
          <button
            onClick={fetchDeliveries}
            className="btn btn-sm btn-outline gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">En préparation</p>
              <p className="text-2xl font-bold text-warning">{stats.pending || 0}</p>
            </div>
            <Clock className="w-6 h-6 text-warning/40" />
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">En transit</p>
              <p className="text-2xl font-bold text-info">{stats.in_transit || 0}</p>
            </div>
            <Truck className="w-6 h-6 text-info/40" />
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Livrées</p>
              <p className="text-2xl font-bold text-success">{stats.delivered || 0}</p>
            </div>
            <CheckCircle className="w-6 h-6 text-success/40" />
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-2xl font-bold text-fuchsia-600">{stats.total || 0}</p>
            </div>
            <Package className="w-6 h-6 text-fuchsia-500/40" />
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
              placeholder="Rechercher n° livraison, destinataire, transporteur..."
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
            <option value="pending">En préparation</option>
            <option value="in_transit">En transit</option>
            <option value="delivered">Livrées</option>
            <option value="cancelled">Annulées</option>
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
            <p className="text-gray-500 font-medium">Aucune livraison trouvée</p>
            <p className="text-sm text-gray-400 mt-1">
              Les livraisons de vos produits apparaîtront ici
            </p>
          </div>
        ) : (
          filteredDeliveries.map((d) => (
            <div key={d.id} className="bg-white rounded-xl shadow-md overflow-hidden">

              {/* En-tête livraison */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
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
                  {expandedId === d.id
                    ? <ChevronUp className="w-5 h-5 text-gray-400" />
                    : <ChevronDown className="w-5 h-5 text-gray-400" />
                  }
                </div>
              </div>

              {/* Détails dépliés */}
              {expandedId === d.id && (
                <div className="border-t bg-gray-50 p-4 space-y-4">

                  {/* Timeline */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">
                      Progression
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <div>
                          <p className="text-sm font-medium">Créée</p>
                          <p className="text-xs text-gray-500">{formatDate(d.request_date)}</p>
                        </div>
                      </div>
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
                            <p className="text-sm font-medium">Livrée au destinataire</p>
                            <p className="text-xs text-gray-500">{formatDate(d.delivered_date)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Destinataire */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">
                      Destinataire
                    </h4>
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
                  {(d.carrier || d.tracking_number || d.vehicle_plate || d.driver_name) && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">
                        Transport
                      </h4>
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
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">
                        Produits livrés
                      </h4>
                      <div className="space-y-2">
                        {d.lignes.map((l) => (
                          <div
                            key={l.id}
                            className="bg-white rounded-lg p-2 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Package className="w-4 h-4 text-fuchsia-600 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {l.product_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {l.product_code}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              <p className="font-bold text-sm text-fuchsia-600">
                                {l.quantity}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatCurrency(l.total_value)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message client */}
                  {d.client_notes && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <h4 className="text-xs font-bold text-blue-700 uppercase mb-1">
                        Message
                      </h4>
                      <p className="text-sm text-blue-800">{d.client_notes}</p>
                    </div>
                  )}

                </div>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default MyDeliveries;