// src/components/ventesclients/ClientDeliveryForm.jsx
// ============================================================
// VERSION PROFESSIONNELLE - Style AssuranceForm
// ============================================================

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle, Truck,
  Package, User, MapPin, Phone, Mail, MessageSquare, Info, Eye,
  Hash, Car, UserCheck, Building2, FileText, Box, Layers,
  Calculator, Sparkles, AlertTriangle,
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// ERROR BOUNDARY
// ============================================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary ClientDeliveryForm:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-base-200/40 p-6 flex items-center justify-center">
          <div className="bg-base-100 rounded-2xl shadow-lg p-8 max-w-2xl w-full border border-base-300">
            <div className="flex items-center gap-3 mb-4 text-error">
              <AlertCircle className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Erreur dans le formulaire</h2>
            </div>
            <pre className="bg-base-200 p-4 rounded-lg text-sm overflow-auto max-h-64 text-error">
              {this.state.error?.toString()}
            </pre>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary"
              >
                Recharger
              </button>
              <button
                onClick={() => window.location.href = '/client-deliveries'}
                className="btn btn-ghost"
              >
                Retour aux livraisons
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const ClientDeliveryFormContent = () => {
  const navigate = useNavigate();
  const hasFetchedRef = useRef(false);

  // États
  const [chargementInitial, setChargementInitial] = useState(true);
  const [chargementStock, setChargementStock] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);
  const [errors, setErrors] = useState({});

  // Données
  const [clients, setClients] = useState([]);
  const [stockLines, setStockLines] = useState([]);
  const [lignes, setLignes] = useState([]);

  // Formulaire
  const [formData, setFormData] = useState({
    client_id: '',
    recipient_name: '',
    recipient_phone: '',
    recipient_address: '',
    recipient_email: '',
    recipient_notes: '',
    delivery_method: '',
    carrier: '',
    tracking_number: '',
    vehicle_plate: '',
    driver_name: '',
    driver_phone: '',
    notes: '',
    client_notes: '',
  });

  const getToken = () => localStorage.getItem('Token');

  const normalizeData = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  };

  // ============================================================
  // CHARGEMENT CLIENTS
  // ============================================================
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    let isMounted = true;
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }
    const headers = { Authorization: `Token ${token}` };

    const loadClients = async () => {
      setChargementInitial(true);
      try {
        const res = await AxiosInstance.get('/clients/?page_size=1000', { headers })
          .catch(() => ({ data: [] }));
        if (!isMounted) return;
        const data = normalizeData(res.data);
        data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setClients(data);
      } catch (err) {
        if (isMounted) {
          if (err.response?.status === 401) navigate('/login');
        }
      } finally {
        if (isMounted) setChargementInitial(false);
      }
    };

    loadClients();
    return () => { isMounted = false; };
  }, [navigate]);

  // ============================================================
  // CHARGEMENT STOCK DU CLIENT
  // ============================================================
  useEffect(() => {
    let isMounted = true;

    if (!formData.client_id) {
      setStockLines([]);
      setLignes([]);
      return;
    }

    const fetchStock = async () => {
      setChargementStock(true);
      try {
        const token = getToken();
        const res = await AxiosInstance.get(
          `/client-stock/${formData.client_id}/client-stock/`,
          { headers: { Authorization: `Token ${token}` } }
        );

        if (!isMounted) return;

        const lines = res.data.lignes || [];
        setStockLines(lines);
        setLignes(
          lines.map((l) => ({
            product: l.product,
            product_name: l.product_name,
            product_code: l.product_code,
            unit_price: l.unit_price,
            available: parseFloat(l.quantity),
            quantity: 0,
            notes: '',
            error: '',
          }))
        );
      } catch (err) {
        if (isMounted) {
          setStockLines([]);
          setLignes([]);
        }
      } finally {
        if (isMounted) setChargementStock(false);
      }
    };

    fetchStock();
    return () => { isMounted = false; };
  }, [formData.client_id]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleLigneChange = (idx, field, value) => {
    const newLignes = [...lignes];
    newLignes[idx][field] = value;
    if (field === 'quantity') {
      const qty = parseFloat(value) || 0;
      if (qty > newLignes[idx].available) {
        newLignes[idx].error = `Max : ${newLignes[idx].available}`;
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

    if (!formData.client_id) errs.client_id = 'Sélectionnez un client';
    if (!formData.recipient_name.trim()) errs.recipient_name = 'Nom du destinataire requis';
    if (!formData.recipient_phone.trim()) errs.recipient_phone = 'Téléphone du destinataire requis';

    const lignesValides = lignes.filter((l) => parseFloat(l.quantity) > 0);
    if (lignesValides.length === 0) {
      errs.lignes = 'Ajoutez au moins un produit à livrer';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ============================================================
  // SUBMIT
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (chargement) return;

    if (!validate()) {
      setErreur('Veuillez corriger les champs en rouge.');
      return;
    }

    const lignesValides = lignes.filter((l) => parseFloat(l.quantity) > 0);

    setChargement(true);
    setErreur(null);
    setSucces(false);

    try {
      const token = getToken();
      await AxiosInstance.post(
        '/client-delivery/create/',
        {
          client_id: parseInt(formData.client_id, 10),
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
          lignes: lignesValides.map((l) => ({
            product: l.product,
            quantity: parseFloat(l.quantity),
            unit_price: parseFloat(l.unit_price) || 0,
            notes: l.notes,
          })),
        },
        { headers: { Authorization: `Token ${token}` } }
      );

      setSucces(true);
      setTimeout(() => navigate('/client-deliveries'), 1500);
    } catch (err) {
      let msg = 'Erreur lors de la création';
      if (err.response?.data) {
        const data = err.response.data;
        if (data.error) msg = data.error;
        else if (typeof data === 'string') msg = data;
        else if (typeof data === 'object') {
          msg = Object.entries(data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
            .join(' | ');
        }
      }
      setErreur(msg);
    } finally {
      setChargement(false);
    }
  };

  // ============================================================
  // HELPERS MÉMOÏSÉS
  // ============================================================
  const formaterMontant = (n) =>
    new Intl.NumberFormat('fr-FR').format(Math.round(Number(n || 0))) + ' CFA';

  const totalGeneral = useMemo(
    () =>
      lignes.reduce(
        (sum, l) =>
          sum +
          (parseFloat(l.quantity) || 0) * (parseFloat(l.unit_price) || 0),
        0
      ),
    [lignes]
  );

  const totalArticles = useMemo(
    () =>
      lignes.reduce((sum, l) => sum + (parseFloat(l.quantity) || 0), 0),
    [lignes]
  );

  const clientSelectionne = useMemo(
    () => clients.find((c) => String(c.id) === String(formData.client_id)),
    [clients, formData.client_id]
  );

  const lignesActives = lignes.filter((l) => parseFloat(l.quantity) > 0);

  // ============================================================
  // LOADER INITIAL
  // ============================================================
  if (chargementInitial) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-base-content/60">Chargement du formulaire...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">
      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/client-deliveries')}
            className="btn btn-ghost btn-sm btn-circle"
            type="button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Livraisons / <span className="text-primary">Création</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <Truck className="w-5 h-5 text-primary" />
              Nouvelle livraison
            </h1>
          </div>
          <div className="badge badge-primary hidden sm:flex">Création</div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Livraison créée avec succès !</span>
        </div>
      )}
      {erreur && (
        <div className="w-full alert alert-error rounded-none py-2">
          <AlertCircle className="w-5 h-5" />
          <span>{erreur}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* COLONNE PRINCIPALE (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* SECTION 1 : Client source */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Client source</h2>
                </div>
                <div className="p-5">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        <User className="w-3 h-3 mr-1 inline" /> Client{' '}
                        <span className="text-error">*</span>
                      </span>
                    </label>
                    <select
                      name="client_id"
                      className={`select select-bordered w-full ${errors.client_id ? 'select-error' : ''}`}
                      value={formData.client_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">
                        — Sélectionner ({clients.length} clients) —
                      </option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code}) — {c.phone}
                        </option>
                      ))}
                    </select>
                    {errors.client_id && (
                      <span className="text-error text-xs mt-1">{errors.client_id}</span>
                    )}
                  </div>

                  {clientSelectionne && (
                    <div className="alert alert-info py-2 mt-4">
                      <Info className="w-4 h-4" />
                      <div className="text-xs">
                        <strong>{clientSelectionne.name}</strong>
                        {clientSelectionne.phone && (
                          <span className="ml-2">— {clientSelectionne.phone}</span>
                        )}
                        {clientSelectionne.address && (
                          <div className="mt-1 text-base-content/70">
                            {clientSelectionne.address}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 2 : Destinataire */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Destinataire</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <User className="w-3 h-3 mr-1 inline" /> Nom complet{' '}
                          <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        name="recipient_name"
                        className={`input input-bordered w-full ${errors.recipient_name ? 'input-error' : ''}`}
                        value={formData.recipient_name}
                        onChange={handleChange}
                        maxLength="200"
                        placeholder="Ex : Amadou Diallo"
                        required
                      />
                      {errors.recipient_name && (
                        <span className="text-error text-xs mt-1">{errors.recipient_name}</span>
                      )}
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Phone className="w-3 h-3 mr-1 inline" /> Téléphone{' '}
                          <span className="text-error">*</span>
                        </span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="tel"
                          name="recipient_phone"
                          className={`input input-bordered w-full pl-10 font-mono ${errors.recipient_phone ? 'input-error' : ''}`}
                          value={formData.recipient_phone}
                          onChange={handleChange}
                          maxLength="20"
                          placeholder="621234567"
                          required
                        />
                      </div>
                      {errors.recipient_phone && (
                        <span className="text-error text-xs mt-1">{errors.recipient_phone}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        <MapPin className="w-3 h-3 mr-1 inline" /> Adresse de
                        livraison
                      </span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-3 text-base-content/40" />
                      <textarea
                        name="recipient_address"
                        className="textarea textarea-bordered w-full pl-10"
                        value={formData.recipient_address}
                        onChange={handleChange}
                        rows="2"
                        placeholder="Quartier, rue, ville..."
                      ></textarea>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Mail className="w-3 h-3 mr-1 inline" /> Email
                          <span className="text-xs text-base-content/40 ml-1">(optionnel)</span>
                        </span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="email"
                          name="recipient_email"
                          className="input input-bordered w-full pl-10"
                          value={formData.recipient_email}
                          onChange={handleChange}
                          maxLength="100"
                          placeholder="destinataire@email.com"
                        />
                      </div>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <MessageSquare className="w-3 h-3 mr-1 inline" /> Notes
                          destinataire
                        </span>
                      </label>
                      <input
                        type="text"
                        name="recipient_notes"
                        className="input input-bordered w-full"
                        value={formData.recipient_notes}
                        onChange={handleChange}
                        maxLength="200"
                        placeholder="Ex : Livrer avant 18h"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3 : Produits */}
            {formData.client_id && (
              <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body p-0">
                  <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold text-sm">
                      Produits à livrer
                      <span className="text-xs text-base-content/50 ml-2 font-normal">
                        ({stockLines.length} disponible(s))
                      </span>
                    </h2>
                    {chargementStock && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    )}
                  </div>
                  <div className="p-5 space-y-3">
                    {errors.lignes && (
                      <div className="alert alert-warning py-2">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs">{errors.lignes}</span>
                      </div>
                    )}

                    {chargementStock && (
                      <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                        <p className="text-sm text-base-content/60 mt-2">
                          Chargement du stock...
                        </p>
                      </div>
                    )}

                    {!chargementStock && stockLines.length === 0 && (
                      <div className="alert alert-warning py-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs">
                          Ce client n'a aucun stock disponible.
                        </span>
                      </div>
                    )}

                    {!chargementStock &&
                      lignes.map((ligne, idx) => (
                        <div
                          key={idx}
                          className="card bg-base-200/30 border border-base-300"
                        >
                          <div className="card-body p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-sm truncate">
                                  {ligne.product_name}
                                </p>
                                <p className="text-xs text-base-content/60 font-mono">
                                  {ligne.product_code}
                                </p>
                              </div>
                              <div className="badge badge-info badge-sm">
                                Dispo : {ligne.available}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 items-end">
                              <div className="form-control">
                                <label className="label py-0 pb-1">
                                  <span className="label-text text-xs font-medium">
                                    <Calculator className="w-3 h-3 mr-1 inline" /> Quantité
                                  </span>
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max={ligne.available}
                                  step="0.01"
                                  value={ligne.quantity}
                                  onChange={(e) =>
                                    handleLigneChange(idx, 'quantity', e.target.value)
                                  }
                                  placeholder="0"
                                  className={`input input-bordered input-sm w-full font-mono ${ligne.error ? 'input-error' : ''}`}
                                />
                                {ligne.error && (
                                  <span className="text-error text-xs mt-1">
                                    {ligne.error}
                                  </span>
                                )}
                              </div>
                              <div className="form-control">
                                <label className="label py-0 pb-1">
                                  <span className="label-text text-xs font-medium">
                                    Total
                                  </span>
                                </label>
                                <div className="input input-bordered input-sm bg-base-200/50 font-mono flex items-center">
                                  {formaterMontant(
                                    (parseFloat(ligne.quantity) || 0) *
                                      (parseFloat(ligne.unit_price) || 0)
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-base-content/50 mt-2">
                              Prix unitaire : {formaterMontant(ligne.unit_price)}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 4 : Transport */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Car className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">
                    Informations de transport
                    <span className="text-xs text-base-content/40 ml-2 font-normal">
                      (optionnel)
                    </span>
                  </h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Mode de livraison
                        </span>
                      </label>
                      <input
                        type="text"
                        name="delivery_method"
                        className="input input-bordered w-full"
                        value={formData.delivery_method}
                        onChange={handleChange}
                        maxLength="100"
                        placeholder="Ex : Camion, Moto"
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Building2 className="w-3 h-3 mr-1 inline" /> Transporteur
                        </span>
                      </label>
                      <input
                        type="text"
                        name="carrier"
                        className="input input-bordered w-full"
                        value={formData.carrier}
                        onChange={handleChange}
                        maxLength="100"
                        placeholder="Société de transport"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Hash className="w-3 h-3 mr-1 inline" /> N° de suivi
                        </span>
                      </label>
                      <div className="relative">
                        <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="text"
                          name="tracking_number"
                          className="input input-bordered w-full pl-10 font-mono"
                          value={formData.tracking_number}
                          onChange={handleChange}
                          maxLength="100"
                          placeholder="TRK-20241112-001"
                        />
                      </div>
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Car className="w-3 h-3 mr-1 inline" /> Immatriculation
                        </span>
                      </label>
                      <input
                        type="text"
                        name="vehicle_plate"
                        className="input input-bordered w-full font-mono"
                        value={formData.vehicle_plate}
                        onChange={handleChange}
                        maxLength="20"
                        placeholder="AA-123-BB"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <UserCheck className="w-3 h-3 mr-1 inline" /> Chauffeur
                        </span>
                      </label>
                      <div className="relative">
                        <UserCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="text"
                          name="driver_name"
                          className="input input-bordered w-full pl-10"
                          value={formData.driver_name}
                          onChange={handleChange}
                          maxLength="100"
                          placeholder="Nom du chauffeur"
                        />
                      </div>
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Phone className="w-3 h-3 mr-1 inline" /> Téléphone
                          chauffeur
                        </span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="tel"
                          name="driver_phone"
                          className="input input-bordered w-full pl-10 font-mono"
                          value={formData.driver_phone}
                          onChange={handleChange}
                          maxLength="20"
                          placeholder="771234567"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 5 : Notes */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Notes</h2>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        <FileText className="w-3 h-3 mr-1 inline" /> Notes internes
                      </span>
                    </label>
                    <textarea
                      name="notes"
                      className="textarea textarea-bordered w-full"
                      value={formData.notes}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Notes pour l'équipe interne..."
                    ></textarea>
                  </div>
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        <MessageSquare className="w-3 h-3 mr-1 inline" /> Message
                        au client
                      </span>
                    </label>
                    <textarea
                      name="client_notes"
                      className="textarea textarea-bordered w-full"
                      value={formData.client_notes}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Message visible par le client..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLONNE APERÇU (1/3) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Aperçu</h3>
                </div>
                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Truck className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-base-content/50 truncate">
                        {formData.tracking_number || 'LIVRAISON'}
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {formData.recipient_name || 'Destinataire'}
                      </p>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Client source :</span>
                      <span className="font-medium truncate ml-2 max-w-[140px]">
                        {clientSelectionne?.name || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Téléphone :</span>
                      <span className="font-mono text-[10px]">
                        {formData.recipient_phone || '—'}
                      </span>
                    </div>
                    {formData.recipient_address && (
                      <div className="flex justify-between">
                        <span className="text-base-content/60">Adresse :</span>
                        <span className="text-xs truncate ml-2 max-w-[140px]">
                          {formData.recipient_address}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Articles :</span>
                      <span className="font-mono font-bold">{lignesActives.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Quantité totale :</span>
                      <span className="font-mono font-bold text-primary">
                        {totalArticles}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Total :</span>
                      <span className="font-mono font-bold text-success">
                        {formaterMontant(totalGeneral)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info box */}
            <div className="card bg-info/5 border border-info/20">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-info mb-1">À savoir</p>
                    <p className="text-base-content/70">
                      Le stock du client sera <strong>débité</strong> automatiquement
                      à la création de la livraison. Une notification est envoyée
                      au destinataire si l'email est fourni.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Aperçu produits */}
            {lignesActives.length > 0 && (
              <div className="card bg-success/5 border border-success/20">
                <div className="card-body p-4">
                  <div className="flex items-start gap-2">
                    <Layers className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <div className="text-xs flex-1">
                      <p className="font-medium text-success mb-2">
                        Produits à livrer ({lignesActives.length})
                      </p>
                      <ul className="space-y-1">
                        {lignesActives.slice(0, 5).map((l, i) => (
                          <li key={i} className="flex justify-between text-base-content/70">
                            <span className="truncate">{l.product_name}</span>
                            <span className="font-mono font-bold ml-2">
                              ×{l.quantity}
                            </span>
                          </li>
                        ))}
                        {lignesActives.length > 5 && (
                          <li className="text-base-content/50 italic">
                            +{lignesActives.length - 5} autres...
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conseil */}
            <div className="card bg-warning/5 border border-warning/20">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-warning mb-1">Conseil</p>
                    <p className="text-base-content/70">
                      Vérifiez le <strong>nom et téléphone du destinataire</strong>
                      avant validation. Ces informations sont essentielles pour
                      la livraison.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BARRE STICKY */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-base-100 border-t border-base-300 shadow-lg lg:pl-72">
          <div className="flex items-center justify-end gap-3 px-6 py-3">
            <div className="hidden md:block mr-auto text-sm">
              <span className="text-base-content/60">Total : </span>
              <span className="font-mono font-bold text-primary">
                {formaterMontant(totalGeneral)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/client-deliveries')}
              className="btn btn-ghost"
              disabled={chargement}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary gap-2 min-w-[180px]"
              disabled={chargement || clients.length === 0}
            >
              {chargement ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Créer la livraison
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

// ============================================================
// WRAPPER AVEC ERROR BOUNDARY
// ============================================================
const ClientDeliveryForm = () => (
  <ErrorBoundary>
    <ClientDeliveryFormContent />
  </ErrorBoundary>
);

export default ClientDeliveryForm;