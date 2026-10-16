// src/components/ventesclients/ClientDeliveryDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Truck, Package, User, Phone, MapPin, Mail,
  CheckCircle, Clock, XCircle, Play, AlertCircle, Loader2,
  Hash, Car, UserCheck, Calendar, FileText, MessageSquare,
  RefreshCw
} from 'lucide-react';

const ClientDeliveryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Modal Démarrer
  const [showStartModal, setShowStartModal] = useState(false);
  const [startForm, setStartForm] = useState({
    carrier: '',
    tracking_number: '',
    vehicle_plate: '',
    driver_name: '',
    driver_phone: '',
    delivery_method: '',
  });

  // Modal Confirmer
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Modal Annuler
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const getToken = () => localStorage.getItem('Token');
  const showNotif = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatCurrency = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;

  // ============================================================
  // CHARGEMENT
  // ============================================================
  const fetchDelivery = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotif('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const res = await AxiosInstance.get(
        `/client-delivery/${id}/detail/`,
        { headers: { 'Authorization': `Token ${token}` } }
      );

      setDelivery(res.data);

      // Pré-remplir le formulaire de démarrage
      setStartForm({
        carrier: res.data.carrier || '',
        tracking_number: res.data.tracking_number || '',
        vehicle_plate: res.data.vehicle_plate || '',
        driver_name: res.data.driver_name || '',
        driver_phone: res.data.driver_phone || '',
        delivery_method: res.data.delivery_method || '',
      });
    } catch (e) {
      console.error(e);
      if (e.response?.status === 401) {
        showNotif('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (e.response?.status === 404) {
        showNotif('Livraison non trouvée', 'error');
        setTimeout(() => navigate('/client-deliveries'), 2000);
      } else {
        showNotif('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchDelivery();
  }, [fetchDelivery]);

  // ============================================================
  // ACTIONS
  // ============================================================
  const handleStartDelivery = async () => {
    setActionLoading(true);
    try {
      const token = getToken();
      await AxiosInstance.post(
        `/client-delivery/${id}/start-delivery/`,
        startForm,
        { headers: { 'Authorization': `Token ${token}` } }
      );
      showNotif('Livraison démarrée', 'success');
      setShowStartModal(false);
      fetchDelivery();
    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.error || 'Erreur lors du démarrage';
      showNotif(Array.isArray(msg) ? msg[0] : msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelivery = async () => {
    setActionLoading(true);
    try {
      const token = getToken();
      await AxiosInstance.post(
        `/client-delivery/${id}/confirm-delivery/`,
        {},
        { headers: { 'Authorization': `Token ${token}` } }
      );
      showNotif('Livraison confirmée. Stock client mis à jour.', 'success');
      setShowConfirmModal(false);
      fetchDelivery();
    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.error || 'Erreur lors de la confirmation';
      showNotif(Array.isArray(msg) ? msg[0] : msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelDelivery = async () => {
    setActionLoading(true);
    try {
      const token = getToken();
      await AxiosInstance.post(
        `/client-delivery/${id}/cancel/`,
        { notes: cancelReason },
        { headers: { 'Authorization': `Token ${token}` } }
      );
      showNotif('Livraison annulée', 'success');
      setShowCancelModal(false);
      setCancelReason('');
      fetchDelivery();
    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.error || 'Erreur lors de l\'annulation';
      showNotif(Array.isArray(msg) ? msg[0] : msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

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
      <span className={`badge ${config.className} badge-lg gap-2`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  // ============================================================
  // CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <p className="text-gray-500">Livraison introuvable</p>
        <button onClick={() => navigate('/client-deliveries')} className="btn btn-primary mt-4">
          Retour à la liste
        </button>
      </div>
    );
  }

  // ============================================================
  // RENDU
  // ============================================================
  return (
    <div className="w-full min-h-screen bg-gray-50">

      {/* Notification */}
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
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/client-deliveries')}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Truck className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 font-mono">
                    {delivery.delivery_number}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Créée le {formatDate(delivery.request_date)}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchDelivery} className="btn btn-ghost btn-sm btn-circle" disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {getStatusBadge(delivery.status)}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">

        {/* ============ ACTIONS ============ */}
        {delivery.status !== 'delivered' && delivery.status !== 'cancelled' && (
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="font-semibold mb-3 text-gray-700 flex items-center gap-2">
              <Play className="w-5 h-5 text-blue-500" />
              Actions disponibles
            </h3>
            <div className="flex flex-wrap gap-3">
              {delivery.status === 'pending' && (
                <button
                  onClick={() => setShowStartModal(true)}
                  className="btn bg-blue-600 hover:bg-blue-700 text-white gap-2"
                >
                  <Play className="w-4 h-4" />
                  Démarrer la livraison
                </button>
              )}

              {(delivery.status === 'pending' || delivery.status === 'in_transit') && (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="btn bg-success hover:bg-success/90 text-white gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirmer la livraison (déduit le stock)
                </button>
              )}

              <button
                onClick={() => setShowCancelModal(true)}
                className="btn btn-outline btn-error gap-2"
              >
                <XCircle className="w-4 h-4" />
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* ============ TIMELINE ============ */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold mb-4 text-gray-700 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Progression
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <div>
                <p className="font-medium text-sm">Créée</p>
                <p className="text-xs text-gray-500">{formatDate(delivery.request_date)}</p>
              </div>
            </div>
            {delivery.shipped_date && (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-info" />
                <div>
                  <p className="font-medium text-sm">Expédiée</p>
                  <p className="text-xs text-gray-500">{formatDate(delivery.shipped_date)}</p>
                </div>
              </div>
            )}
            {delivery.delivered_date && (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-success" />
                <div>
                  <p className="font-medium text-sm">Livrée</p>
                  <p className="text-xs text-gray-500">{formatDate(delivery.delivered_date)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ============ CLIENT SOURCE ============ */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="font-semibold mb-3 text-gray-700 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              Client source
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Nom :</span>
                <span className="font-medium">{delivery.client_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Code :</span>
                <span className="font-mono text-xs">{delivery.client_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Téléphone :</span>
                <span className="font-medium">{delivery.client_phone}</span>
              </div>
            </div>
          </div>

          {/* ============ DESTINATAIRE ============ */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 p-5">
            <h3 className="font-semibold mb-3 text-gray-700 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Destinataire
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Nom :</span>
                <span className="font-medium">{delivery.recipient_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Téléphone :</span>
                <span className="font-medium">{delivery.recipient_phone}</span>
              </div>
              {delivery.recipient_email && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Email :</span>
                  <span className="font-medium">{delivery.recipient_email}</span>
                </div>
              )}
              {delivery.recipient_address && (
                <div>
                  <span className="text-gray-500">Adresse :</span>
                  <p className="font-medium mt-1">{delivery.recipient_address}</p>
                </div>
              )}
              {delivery.recipient_notes && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                  <strong>Note :</strong> {delivery.recipient_notes}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============ TRANSPORT ============ */}
        {(delivery.carrier || delivery.tracking_number || delivery.vehicle_plate || delivery.driver_name) && (
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="font-semibold mb-3 text-gray-700 flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-500" />
              Transport
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {delivery.carrier && (
                <div>
                  <span className="text-gray-500">Transporteur :</span>
                  <p className="font-medium">{delivery.carrier}</p>
                </div>
              )}
              {delivery.tracking_number && (
                <div>
                  <span className="text-gray-500">N° de suivi :</span>
                  <p className="font-mono font-medium">{delivery.tracking_number}</p>
                </div>
              )}
              {delivery.vehicle_plate && (
                <div>
                  <span className="text-gray-500">Immatriculation :</span>
                  <p className="font-mono font-medium">{delivery.vehicle_plate}</p>
                </div>
              )}
              {delivery.driver_name && (
                <div>
                  <span className="text-gray-500">Chauffeur :</span>
                  <p className="font-medium">{delivery.driver_name}</p>
                </div>
              )}
              {delivery.driver_phone && (
                <div>
                  <span className="text-gray-500">Téléphone chauffeur :</span>
                  <p className="font-medium">{delivery.driver_phone}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============ PRODUITS ============ */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-gray-50 px-5 py-3 border-b">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-500" />
              Produits livrés ({delivery.lignes?.length || 0})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-4 text-xs">Produit</th>
                  <th className="py-2 px-4 text-xs text-right">Qté</th>
                  <th className="py-2 px-4 text-xs text-right">Prix unitaire</th>
                  <th className="py-2 px-4 text-xs text-right">Total</th>
                  {delivery.status === 'delivered' && (
                    <th className="py-2 px-4 text-xs text-center">Avant/Après</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {delivery.lignes?.map((l, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-2 px-4">
                      <p className="font-medium text-sm">{l.product_name}</p>
                      <p className="text-xs text-gray-500">{l.product_code}</p>
                    </td>
                    <td className="py-2 px-4 text-right font-medium">{l.quantity}</td>
                    <td className="py-2 px-4 text-right">{formatCurrency(l.unit_price)}</td>
                    <td className="py-2 px-4 text-right font-bold text-blue-600">
                      {formatCurrency(l.total_value)}
                    </td>
                    {delivery.status === 'delivered' && (
                      <td className="py-2 px-4 text-center text-xs text-gray-500">
                        {l.quantity_before} → {l.quantity_after}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="py-2 px-4 font-semibold">TOTAL</td>
                  <td className="py-2 px-4 text-right font-bold">{delivery.total_quantity}</td>
                  <td className="py-2 px-4"></td>
                  <td className="py-2 px-4 text-right font-bold text-blue-600">
                    {formatCurrency(delivery.total_value)}
                  </td>
                  {delivery.status === 'delivered' && <td></td>}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ============ NOTES ============ */}
        {(delivery.notes || delivery.client_notes) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {delivery.notes && (
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <h3 className="font-semibold mb-2 text-gray-700 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  Notes internes
                </h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{delivery.notes}</p>
              </div>
            )}
            {delivery.client_notes && (
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <h3 className="font-semibold mb-2 text-gray-700 text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  Message au client
                </h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{delivery.client_notes}</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ============================================================ */}
      {/* MODAL : DÉMARRER */}
      {/* ============================================================ */}
      {showStartModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Play className="w-5 h-5 text-blue-500" />
              Démarrer la livraison
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Mode de livraison (ex: Camion)"
                value={startForm.delivery_method}
                onChange={(e) => setStartForm({ ...startForm, delivery_method: e.target.value })}
                className="input input-bordered w-full"
              />
              <input
                type="text"
                placeholder="Transporteur"
                value={startForm.carrier}
                onChange={(e) => setStartForm({ ...startForm, carrier: e.target.value })}
                className="input input-bordered w-full"
              />
              <input
                type="text"
                placeholder="N° de suivi"
                value={startForm.tracking_number}
                onChange={(e) => setStartForm({ ...startForm, tracking_number: e.target.value })}
                className="input input-bordered w-full"
              />
              <input
                type="text"
                placeholder="Immatriculation véhicule"
                value={startForm.vehicle_plate}
                onChange={(e) => setStartForm({ ...startForm, vehicle_plate: e.target.value })}
                className="input input-bordered w-full"
              />
              <input
                type="text"
                placeholder="Nom du chauffeur"
                value={startForm.driver_name}
                onChange={(e) => setStartForm({ ...startForm, driver_name: e.target.value })}
                className="input input-bordered w-full"
              />
              <input
                type="tel"
                placeholder="Téléphone du chauffeur"
                value={startForm.driver_phone}
                onChange={(e) => setStartForm({ ...startForm, driver_phone: e.target.value })}
                className="input input-bordered w-full"
              />
            </div>
            <div className="modal-action">
              <button onClick={() => setShowStartModal(false)} className="btn btn-ghost" disabled={actionLoading}>
                Annuler
              </button>
              <button onClick={handleStartDelivery} className="btn btn-primary gap-2" disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Démarrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL : CONFIRMER */}
      {/* ============================================================ */}
      {showConfirmModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              Confirmer la livraison
            </h3>
            <div className="alert alert-warning mb-4">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="font-semibold">Attention !</p>
                <p className="text-sm">
                  Cette action va <strong>déduire définitivement</strong> les quantités du stock du client <strong>{delivery.client_name}</strong>.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 rounded p-3 text-sm space-y-1">
              <p><strong>Quantité totale :</strong> {delivery.total_quantity} unités</p>
              <p><strong>Valeur :</strong> {formatCurrency(delivery.total_value)}</p>
              <p><strong>Destinataire :</strong> {delivery.recipient_name}</p>
            </div>
            <div className="modal-action">
              <button onClick={() => setShowConfirmModal(false)} className="btn btn-ghost" disabled={actionLoading}>
                Annuler
              </button>
              <button onClick={handleConfirmDelivery} className="btn btn-success gap-2" disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL : ANNULER */}
      {/* ============================================================ */}
      {showCancelModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-error">
              <XCircle className="w-5 h-5" />
              Annuler la livraison
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Voulez-vous vraiment annuler la livraison <strong>{delivery.delivery_number}</strong> ?
            </p>
            <textarea
              placeholder="Raison de l'annulation (optionnel)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="textarea textarea-bordered w-full"
              rows="3"
            />
            <div className="modal-action">
              <button onClick={() => setShowCancelModal(false)} className="btn btn-ghost" disabled={actionLoading}>
                Annuler
              </button>
              <button onClick={handleCancelDelivery} className="btn btn-error gap-2" disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Confirmer l'annulation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClientDeliveryDetail;