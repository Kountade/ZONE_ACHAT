// src/components/ventesclients/ClientDeliveryForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, Truck, Loader2, Package, User,
  AlertCircle, CheckCircle, MapPin, Phone, Mail, MessageSquare,
  Hash, Car, UserCheck
} from 'lucide-react';

const ClientDeliveryForm = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [errors, setErrors] = useState({});

  const [clients, setClients] = useState([]);
  const [stockLines, setStockLines] = useState([]);
  const [lignes, setLignes] = useState([]);

  const [formData, setFormData] = useState({
    client_id: '',
    // Destinataire (obligatoire)
    recipient_name: '',
    recipient_phone: '',
    recipient_address: '',
    recipient_email: '',
    recipient_notes: '',
    // Transport
    delivery_method: '',
    carrier: '',
    tracking_number: '',
    vehicle_plate: '',
    driver_name: '',
    driver_phone: '',
    // Notes
    notes: '',
    client_notes: '',
  });

  const getToken = () => localStorage.getItem('Token');
  const showNotif = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ============================================================
  // CHARGEMENT CLIENTS
  // ============================================================
  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const token = getToken();
        const res = await AxiosInstance.get('/clients/?page_size=1000', {
          headers: { 'Authorization': `Token ${token}` }
        });
        const data = res.data.results || res.data || [];
        data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setClients(data);
      } catch (e) {
        console.error('Erreur clients:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  // ============================================================
  // CHARGEMENT STOCK DU CLIENT SÉLECTIONNÉ
  // ============================================================
  useEffect(() => {
    if (!formData.client_id) {
      setStockLines([]);
      setLignes([]);
      return;
    }
    const fetchStock = async () => {
      try {
        const token = getToken();
        const res = await AxiosInstance.get(
          `/client-stock/${formData.client_id}/client-stock/`,
          { headers: { 'Authorization': `Token ${token}` } }
        );
        const lines = res.data.lignes || [];
        setStockLines(lines);
        setLignes(lines.map(l => ({
          product: l.product,
          product_name: l.product_name,
          product_code: l.product_code,
          unit_price: l.unit_price,
          available: parseFloat(l.quantity),
          quantity: 0,
          notes: '',
          error: '',
        })));
      } catch (e) {
        console.error('Erreur stock:', e);
        setStockLines([]);
        setLignes([]);
      }
    };
    fetchStock();
  }, [formData.client_id]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleLigneChange = (idx, field, value) => {
    const newLignes = [...lignes];
    newLignes[idx][field] = value;
    if (field === 'quantity') {
      const qty = parseFloat(value) || 0;
      if (qty > newLignes[idx].available) {
        newLignes[idx].error = `Max: ${newLignes[idx].available}`;
      } else {
        newLignes[idx].error = '';
      }
    }
    setLignes(newLignes);
  };

  // ============================================================
  // VALIDATION
  // ============================================================
  const validate = () => {
    const errs = {};

    if (!formData.client_id) {
      errs.client_id = 'Veuillez sélectionner un client';
    }
    if (!formData.recipient_name.trim()) {
      errs.recipient_name = 'Nom du destinataire requis';
    }
    if (!formData.recipient_phone.trim()) {
      errs.recipient_phone = 'Téléphone du destinataire requis';
    }

    const lignesValides = lignes.filter(l => parseFloat(l.quantity) > 0);
    if (lignesValides.length === 0) {
      errs.lignes = 'Ajoutez au moins un produit à livrer';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ============================================================
  // SOUMISSION
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      showNotif('Veuillez corriger les erreurs', 'error');
      return;
    }

    const lignesValides = lignes.filter(l => parseFloat(l.quantity) > 0);

    setSubmitting(true);
    try {
      const token = getToken();
      await AxiosInstance.post('/client-delivery/create/', {
        client_id: parseInt(formData.client_id),
        recipient_name: formData.recipient_name.trim(),
        recipient_phone: formData.recipient_phone.trim(),
        recipient_address: formData.recipient_address.trim(),
        recipient_email: formData.recipient_email.trim(),
        recipient_notes: formData.recipient_notes.trim(),
        delivery_method: formData.delivery_method,
        carrier: formData.carrier,
        tracking_number: formData.tracking_number,
        vehicle_plate: formData.vehicle_plate,
        driver_name: formData.driver_name,
        driver_phone: formData.driver_phone,
        notes: formData.notes,
        client_notes: formData.client_notes,
        lignes: lignesValides.map(l => ({
          product: l.product,
          quantity: parseFloat(l.quantity),
          unit_price: parseFloat(l.unit_price) || 0,
          notes: l.notes,
        })),
      }, {
        headers: { 'Authorization': `Token ${token}` }
      });

      showNotif('Livraison créée avec succès', 'success');
      setTimeout(() => navigate('/client-deliveries'), 1500);
    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.error
        || (e.response?.data && Object.values(e.response.data)[0]?.[0])
        || 'Erreur lors de la création';
      showNotif(Array.isArray(msg) ? msg[0] : msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;

  const totalGeneral = lignes.reduce(
    (sum, l) => sum + (parseFloat(l.quantity) || 0) * (parseFloat(l.unit_price) || 0),
    0
  );

  // ============================================================
  // ÉCRAN DE CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // ============================================================
  // RENDU
  // ============================================================
  return (
    <div className="w-full min-h-screen bg-gray-50">

      {/* Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification(null)}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/client-deliveries')}
              className="btn btn-ghost btn-sm gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Truck className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Nouvelle Livraison</h1>
                <p className="text-sm text-gray-500">
                  Enregistrer la livraison des produits vers un destinataire
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">

        {/* ============ 1. CLIENT SOURCE ============ */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-700">
            <User className="w-5 h-5 text-blue-500" />
            1. Client (source du stock)
          </h3>
          <select
            value={formData.client_id}
            onChange={handleChange}
            name="client_id"
            className={`select select-bordered w-full ${errors.client_id ? 'select-error' : ''}`}
            required
          >
            <option value="">-- Choisir le client --</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code}) — {c.phone}
              </option>
            ))}
          </select>
          {errors.client_id && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {errors.client_id}
            </p>
          )}
        </div>

        {/* ============ 2. DESTINATAIRE ============ */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-700">
            <MapPin className="w-5 h-5 text-blue-600" />
            2. Destinataire (la personne qui reçoit les produits)
            <span className="text-red-500">*</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                <span className="label-text font-medium">
                  Nom complet <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="text"
                name="recipient_name"
                value={formData.recipient_name}
                onChange={handleChange}
                placeholder="Ex: Amadou Diallo"
                className={`input input-bordered w-full ${errors.recipient_name ? 'input-error' : ''}`}
                required
              />
              {errors.recipient_name && (
                <p className="text-red-500 text-sm mt-1">{errors.recipient_name}</p>
              )}
            </div>

            <div>
              <label className="label">
                <span className="label-text font-medium">
                  Téléphone <span className="text-red-500">*</span>
                </span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  name="recipient_phone"
                  value={formData.recipient_phone}
                  onChange={handleChange}
                  placeholder="Ex: 621234567"
                  className={`input input-bordered w-full pl-10 ${errors.recipient_phone ? 'input-error' : ''}`}
                  required
                />
              </div>
              {errors.recipient_phone && (
                <p className="text-red-500 text-sm mt-1">{errors.recipient_phone}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="label">
                <span className="label-text font-medium">Adresse de livraison</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea
                  name="recipient_address"
                  value={formData.recipient_address}
                  onChange={handleChange}
                  placeholder="Quartier, rue, ville..."
                  className="textarea textarea-bordered w-full pl-10"
                  rows="2"
                />
              </div>
            </div>

            <div>
              <label className="label">
                <span className="label-text font-medium">Email (optionnel)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  name="recipient_email"
                  value={formData.recipient_email}
                  onChange={handleChange}
                  placeholder="destinataire@email.com"
                  className="input input-bordered w-full pl-10"
                />
              </div>
            </div>

            <div>
              <label className="label">
                <span className="label-text font-medium">Notes sur le destinataire</span>
              </label>
              <input
                type="text"
                name="recipient_notes"
                value={formData.recipient_notes}
                onChange={handleChange}
                placeholder="Ex: Livrer avant 18h"
                className="input input-bordered w-full"
              />
            </div>
          </div>
        </div>

        {/* ============ 3. PRODUITS ============ */}
        {formData.client_id && (
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-700">
              <Package className="w-5 h-5 text-blue-500" />
              3. Produits à livrer
              <span className="text-sm text-gray-500 font-normal">
                ({stockLines.length} disponible(s))
              </span>
            </h3>

            {errors.lignes && (
              <div className="alert alert-warning mb-3">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.lignes}</span>
              </div>
            )}

            {stockLines.length === 0 ? (
              <div className="alert alert-warning">
                <AlertCircle className="w-4 h-4" />
                <span>Ce client n'a aucun stock disponible</span>
              </div>
            ) : (
              <div className="space-y-3">
                {lignes.map((ligne, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50 rounded-lg">
                    <div className="col-span-12 md:col-span-4">
                      <p className="font-medium text-sm">{ligne.product_name}</p>
                      <p className="text-xs text-gray-500">{ligne.product_code}</p>
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <p className="text-xs text-gray-500">Disponible</p>
                      <p className="font-bold text-blue-600">{ligne.available}</p>
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <p className="text-xs text-gray-500">Prix unitaire</p>
                      <p className="text-sm">{formatCurrency(ligne.unit_price)}</p>
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <p className="text-xs text-gray-500">Quantité</p>
                      <input
                        type="number"
                        min="0"
                        max={ligne.available}
                        step="0.01"
                        value={ligne.quantity}
                        onChange={(e) => handleLigneChange(idx, 'quantity', e.target.value)}
                        placeholder="0"
                        className={`input input-bordered input-sm w-full ${ligne.error ? 'input-error' : ''}`}
                      />
                      {ligne.error && (
                        <p className="text-red-500 text-xs mt-1">{ligne.error}</p>
                      )}
                    </div>
                    <div className="col-span-12 md:col-span-2 text-right">
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="font-bold text-blue-600">
                        {formatCurrency((parseFloat(ligne.quantity) || 0) * (parseFloat(ligne.unit_price) || 0))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============ 4. TRANSPORT ============ */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-700">
            <Car className="w-5 h-5 text-blue-500" />
            4. Informations de transport (optionnel)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="delivery_method"
              value={formData.delivery_method}
              onChange={handleChange}
              placeholder="Mode de livraison (ex: Camion, Moto)"
              className="input input-bordered w-full"
            />
            <input
              type="text"
              name="carrier"
              value={formData.carrier}
              onChange={handleChange}
              placeholder="Transporteur / Société"
              className="input input-bordered w-full"
            />
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="tracking_number"
                value={formData.tracking_number}
                onChange={handleChange}
                placeholder="N° de suivi"
                className="input input-bordered w-full pl-10"
              />
            </div>
            <input
              type="text"
              name="vehicle_plate"
              value={formData.vehicle_plate}
              onChange={handleChange}
              placeholder="Immatriculation véhicule"
              className="input input-bordered w-full"
            />
            <div className="relative">
              <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="driver_name"
                value={formData.driver_name}
                onChange={handleChange}
                placeholder="Nom du chauffeur"
                className="input input-bordered w-full pl-10"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                name="driver_phone"
                value={formData.driver_phone}
                onChange={handleChange}
                placeholder="Téléphone du chauffeur"
                className="input input-bordered w-full pl-10"
              />
            </div>
          </div>
        </div>

        {/* ============ 5. NOTES ============ */}
        <div className="bg-white rounded-xl shadow-sm border p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">
              <span className="label-text font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                Notes internes
              </span>
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Notes pour l'équipe interne..."
              className="textarea textarea-bordered w-full"
              rows="3"
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                Message au client
              </span>
            </label>
            <textarea
              name="client_notes"
              value={formData.client_notes}
              onChange={handleChange}
              placeholder="Message visible par le client..."
              className="textarea textarea-bordered w-full"
              rows="3"
            />
          </div>
        </div>

        {/* ============ TOTAL + BOUTONS ============ */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <p className="text-sm text-gray-500">Total de la livraison</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalGeneral)}</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/client-deliveries')}
                className="btn btn-ghost gap-2"
                disabled={submitting}
              >
                <X className="w-4 h-4" /> Annuler
              </button>
              <button
                type="submit"
                className="btn bg-blue-600 hover:bg-blue-700 text-white gap-2 min-w-[200px]"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Créer la livraison
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};

export default ClientDeliveryForm;