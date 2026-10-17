// src/components/ventesclients/ClientDeliveryRequest.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, Truck, Loader2, Package, User,
  AlertCircle, CheckCircle, MapPin, Phone, Mail,
  MessageSquare, Info
} from 'lucide-react';

const ClientDeliveryRequest = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [errors, setErrors] = useState({});

  const [stockLines, setStockLines] = useState([]);
  const [lignes, setLignes] = useState([]);

  const [formData, setFormData] = useState({
    recipient_name: '',
    recipient_phone: '',
    recipient_address: '',
    recipient_email: '',
    recipient_notes: '',
    client_notes: '',
  });

  const getToken = () => localStorage.getItem('Token');
  const showNotif = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ============================================================
  // CHARGEMENT DU STOCK CLIENT
  // ============================================================
  useEffect(() => {
    const fetchStock = async () => {
      setLoading(true);
      try {
        const token = getToken();
        const res = await AxiosInstance.get('/client-space/my-stock/', {
          headers: { 'Authorization': `Token ${token}` }
        });

        const lines = res.data.results || [];
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
        showNotif('Erreur de chargement du stock', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchStock();
  }, []);

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

    if (!formData.recipient_name.trim()) {
      errs.recipient_name = 'Nom du destinataire requis';
    }
    if (!formData.recipient_phone.trim()) {
      errs.recipient_phone = 'Téléphone du destinataire requis';
    }

    const lignesValides = lignes.filter(l => parseFloat(l.quantity) > 0);
    if (lignesValides.length === 0) {
      errs.lignes = 'Sélectionnez au moins un produit';
    }

    // Vérifier qu'aucune ligne n'a d'erreur
    const lignesEnErreur = lignes.filter(l => l.error);
    if (lignesEnErreur.length > 0) {
      errs.lignes = 'Certaines quantités dépassent le stock disponible';
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
      await AxiosInstance.post('/client-space/my-deliveries/create/', {
        recipient_name: formData.recipient_name.trim(),
        recipient_phone: formData.recipient_phone.trim(),
        recipient_address: formData.recipient_address.trim(),
        recipient_email: formData.recipient_email.trim(),
        recipient_notes: formData.recipient_notes.trim(),
        client_notes: formData.client_notes.trim(),
        lignes: lignesValides.map(l => ({
          product: l.product,
          quantity: parseFloat(l.quantity),
          notes: l.notes,
        })),
      }, {
        headers: { 'Authorization': `Token ${token}` }
      });

      showNotif('Demande envoyée ! En attente de validation.', 'success');
      setTimeout(() => navigate('/client/deliveries'), 2000);
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

  const totalQuantity = lignes.reduce(
    (sum, l) => sum + (parseFloat(l.quantity) || 0),
    0
  );

  // ============================================================
  // CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-fuchsia-500 mx-auto" />
          <p className="text-gray-500">Chargement...</p>
        </div>
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
              {notification.type === 'success'
                ? <CheckCircle className="w-5 h-5" />
                : <AlertCircle className="w-5 h-5" />}
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-5 flex items-center gap-4">
          <button
            onClick={() => navigate('/client/deliveries')}
            className="btn btn-ghost btn-sm gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-fuchsia-500/10 rounded-xl">
              <Truck className="w-7 h-7 text-fuchsia-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Nouvelle Demande de Livraison
              </h1>
              <p className="text-sm text-gray-500">
                Sélectionnez vos produits et indiquez le destinataire
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">

        {/* Info */}
        <div className="alert alert-info">
          <Info className="w-5 h-5" />
          <div>
            <p className="font-semibold">Comment ça marche ?</p>
            <p className="text-sm">
              Votre demande sera examinée par un administrateur.
              Une fois validée, elle sera livrée au destinataire indiqué.
            </p>
          </div>
        </div>

        {/* ============ DESTINATAIRE ============ */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-fuchsia-200 p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-700">
            <MapPin className="w-5 h-5 text-fuchsia-600" />
            Destinataire (la personne qui reçoit les produits)
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

            <div className="md:col-span-2">
              <label className="label">
                <span className="label-text font-medium">Message à l'administrateur</span>
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea
                  name="client_notes"
                  value={formData.client_notes}
                  onChange={handleChange}
                  placeholder="Information complémentaire..."
                  className="textarea textarea-bordered w-full pl-10"
                  rows="2"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ============ PRODUITS ============ */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-700">
            <Package className="w-5 h-5 text-fuchsia-500" />
            Produits à livrer
            <span className="text-sm text-gray-500 font-normal">
              ({stockLines.length} disponible(s) dans votre stock)
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
              <div>
                <p className="font-semibold">Vous n'avez aucun stock</p>
                <p className="text-sm">
                  Contactez l'administrateur pour un dépôt de marchandises.
                </p>
              </div>
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
                    <p className="font-bold text-fuchsia-600">{ligne.available}</p>
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <p className="text-xs text-gray-500">Prix</p>
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
                    <p className="font-bold text-fuchsia-600">
                      {formatCurrency((parseFloat(ligne.quantity) || 0) * (parseFloat(ligne.unit_price) || 0))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ============ TOTAL + BOUTONS ============ */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <p className="text-sm text-gray-500">
                Total de la demande ({totalQuantity.toLocaleString('fr-FR')} unités)
              </p>
              <p className="text-2xl font-bold text-fuchsia-600">
                {formatCurrency(totalGeneral)}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/client/deliveries')}
                className="btn btn-ghost gap-2"
                disabled={submitting}
              >
                <X className="w-4 h-4" /> Annuler
              </button>
              <button
                type="submit"
                className="btn bg-fuchsia-600 hover:bg-fuchsia-700 text-white gap-2 min-w-[200px]"
                disabled={submitting || stockLines.length === 0}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Envoyer ma demande
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

export default ClientDeliveryRequest;