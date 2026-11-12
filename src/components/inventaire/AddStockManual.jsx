// src/components/inventaire/AddStockManual.jsx
// ============================================================
// VERSION OPTIMISÉE - Chargement rapide (inspiré de ClientForm/DevisForm)
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle, PackagePlus,
  Package, Building2, Calendar, DollarSign, FileText, Info, Eye,
  Tag, Hash, Box, Layers, Clock, Shield, Check, PlusCircle,
  BadgeDollarSign, PenLine, AlertTriangle, X,
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
    console.error('ErrorBoundary AddStockManual:', error, errorInfo);
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
                onClick={() => window.location.href = '/stocks'}
                className="btn btn-ghost"
              >
                Retour aux stocks
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
const AddStockManualContent = () => {
  const navigate = useNavigate();

  // États
  const [chargementInitial, setChargementInitial] = useState(true);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);
  const [errors, setErrors] = useState({});

  // Données
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Formulaire
  const [formData, setFormData] = useState({
    product_id: '',
    warehouse_id: '',
    quantity: '',
    lot_number: '',
    batch_number: '',
    expiry_date: '',
    purchase_price: '',
    selling_price: '',
    notes: '',
    reason: 'Ajout manuel',
  });

  const getToken = () => localStorage.getItem('Token');

  const normalizeData = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  };

  // ============================================================
  // CHARGEMENT INITIAL OPTIMISÉ
  // - Pas de useRef : évite le blocage du second effet en StrictMode
  // - AbortController : annule les requêtes si le composant est démonté
  // - Chargement PARALLÈLE au lieu de séquentiel
  // ============================================================
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const init = async () => {
      setChargementInitial(true);
      setErreur(null);

      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const headers = { Authorization: `Token ${token}` };

      try {
        // ✅ CHARGEMENT EN PARALLÈLE
        const [whResult, prResult] = await Promise.allSettled([
          // 1. Warehouses (rapide)
          AxiosInstance.get('/warehouses/?active=true&page_size=200', {
            headers,
            signal: controller.signal,
          }),
          // 2. Products (essai brief/, sinon fallback)
          AxiosInstance.get('/products/brief/', {
            headers,
            signal: controller.signal,
          }),
        ]);

        if (!isMounted) return;

        // Traitement des résultats
        if (whResult.status === 'fulfilled') {
          setWarehouses(normalizeData(whResult.value.data));
        }

        if (prResult.status === 'fulfilled') {
          setProducts(normalizeData(prResult.value.data));
        } else {
          // Fallback si /brief/ n'existe pas
          try {
            const fallbackRes = await AxiosInstance.get(
              '/products/?status=active&page_size=500',
              { headers, signal: controller.signal }
            );
            if (isMounted) {
              setProducts(normalizeData(fallbackRes.data));
            }
          } catch (fallbackErr) {
            if (fallbackErr.name === 'CanceledError') return;
            if (isMounted) setProducts([]);
          }
        }
      } catch (err) {
        if (!isMounted || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
          return;
        }

        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setErreur('Erreur de chargement des données. Veuillez réessayer.');
        }
      } finally {
        if (isMounted) setChargementInitial(false);
      }
    };

    init();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [navigate]);

  // ============================================================
  // MISE À JOUR DU PRODUIT SÉLECTIONNÉ
  // ============================================================
  useEffect(() => {
    if (!formData.product_id) {
      setSelectedProduct(null);
      return;
    }
    const productId = parseInt(formData.product_id, 10);
    const product = products.find((p) => p.id === productId);
    setSelectedProduct(product || null);

    if (product) {
      setFormData((prev) => ({
        ...prev,
        purchase_price: prev.purchase_price || product.purchase_price || '',
        selling_price: prev.selling_price || product.selling_price || '',
      }));
    }
  }, [formData.product_id, products]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (erreur) setErreur(null);
  };

  // ============================================================
  // VALIDATION
  // ============================================================
  const validate = () => {
    const newErrors = {};
    if (!formData.product_id) newErrors.product_id = 'Sélectionnez un produit';
    if (!formData.warehouse_id) newErrors.warehouse_id = 'Sélectionnez un entrepôt';
    if (!formData.quantity || parseInt(formData.quantity, 10) <= 0) {
      newErrors.quantity = 'La quantité doit être supérieure à 0';
    }
    if (selectedProduct?.has_expiry && !formData.expiry_date) {
      newErrors.expiry_date = "Date d'expiration requise pour ce produit";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================================
  // SUBMIT
  // ============================================================
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (chargement) return;

    if (!validate()) {
      setErreur('Veuillez corriger les champs en rouge.');
      return;
    }

    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }

    setChargement(true);
    setErreur(null);
    setSucces(false);

    try {
      const headers = { Authorization: `Token ${token}` };

      const payload = {
        product_id: parseInt(formData.product_id, 10),
        warehouse_id: parseInt(formData.warehouse_id, 10),
        quantity: parseInt(formData.quantity, 10),
        reason: formData.reason || 'Ajout manuel',
      };

      if (formData.lot_number?.trim()) payload.lot_number = formData.lot_number.trim();
      if (formData.batch_number?.trim()) payload.batch_number = formData.batch_number.trim();
      if (formData.expiry_date) payload.expiry_date = formData.expiry_date;
      if (formData.purchase_price) payload.purchase_price = parseFloat(formData.purchase_price);
      if (formData.selling_price) payload.selling_price = parseFloat(formData.selling_price);
      if (formData.notes?.trim()) payload.notes = formData.notes.trim();

      await AxiosInstance.post('/products/add_stock_manual/', payload, { headers });

      setSucces(true);
      window.setTimeout(() => navigate('/stocks'), 1200);
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/login');
        return;
      }

      let msg = "Erreur lors de l'ajout";
      const data = error.response?.data;

      if (typeof data === 'string') {
        msg = data;
      } else if (data?.detail) {
        msg = data.detail;
      } else if (data?.error) {
        msg = data.error;
      } else if (data && typeof data === 'object') {
        const newErrors = {};
        const messages = [];
        Object.keys(data).forEach((key) => {
          const val = Array.isArray(data[key]) ? data[key][0] : data[key];
          newErrors[key] = val;
          messages.push(`${key}: ${val}`);
        });
        setErrors(newErrors);
        if (messages.length > 0) msg = messages.join(' | ');
      }

      setErreur(msg);
    } finally {
      setChargement(false);
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================
  const formaterMontant = (m) =>
    new Intl.NumberFormat('fr-FR').format(Math.round(Number(m || 0))) + ' CFA';

  const getWarehouseName = (id) => {
    const wh = warehouses.find((w) => String(w.id) === String(id));
    return wh ? `${wh.name} (${wh.code})` : '—';
  };

  const quantite = parseInt(formData.quantity, 10) || 0;
  const prixAchat = parseFloat(formData.purchase_price) || 0;
  const valeurTotale = quantite * prixAchat;

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
            onClick={() => navigate('/stocks')}
            className="btn btn-ghost btn-sm btn-circle"
            type="button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Stocks / Ajout manuel / <span className="text-primary">Création</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <PackagePlus className="w-5 h-5 text-primary" />
              Ajout manuel de stock
            </h1>
          </div>
          <div className="badge badge-primary hidden sm:flex">Ajout direct</div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Stock ajouté avec succès !</span>
        </div>
      )}
      {erreur && (
        <div className="w-full alert alert-error rounded-none py-2">
          <AlertCircle className="w-5 h-5" />
          <span>{erreur}</span>
          <button
            className="btn btn-ghost btn-xs btn-circle ml-auto"
            onClick={() => setErreur(null)}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* COLONNE PRINCIPALE (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* SECTION 1 : Produit & Entrepôt */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Produit & Entrepôt</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Package className="w-3 h-3 mr-1 inline" /> Produit{' '}
                          <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="product_id"
                        className={`select select-bordered w-full ${errors.product_id ? 'select-error' : ''}`}
                        value={formData.product_id}
                        onChange={handleChange}
                        required
                      >
                        <option value="">
                          — Sélectionner ({products.length} produits) —
                        </option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code} - {p.name}
                          </option>
                        ))}
                      </select>
                      {errors.product_id && (
                        <span className="text-error text-xs mt-1">{errors.product_id}</span>
                      )}
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Building2 className="w-3 h-3 mr-1 inline" /> Entrepôt{' '}
                          <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="warehouse_id"
                        className={`select select-bordered w-full ${errors.warehouse_id ? 'select-error' : ''}`}
                        value={formData.warehouse_id}
                        onChange={handleChange}
                        required
                      >
                        <option value="">
                          — Sélectionner ({warehouses.length} entrepôts) —
                        </option>
                        {warehouses.map((wh) => (
                          <option key={wh.id} value={wh.id}>
                            {wh.name} ({wh.code})
                          </option>
                        ))}
                      </select>
                      {errors.warehouse_id && (
                        <span className="text-error text-xs mt-1">{errors.warehouse_id}</span>
                      )}
                    </div>
                  </div>

                  {/* Info produit sélectionné */}
                  {selectedProduct && (
                    <div className="alert alert-info py-2">
                      <Info className="w-4 h-4" />
                      <div className="text-xs flex-1">
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          <span>
                            <strong>Code :</strong> {selectedProduct.code}
                          </span>
                          <span>
                            <strong>Expiration :</strong>{' '}
                            {selectedProduct.has_expiry ? 'Oui' : 'Non'}
                          </span>
                          <span>
                            <strong>Prix achat :</strong>{' '}
                            {formaterMontant(selectedProduct.purchase_price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 2 : Quantité & Lot */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Quantité & Lot</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Box className="w-3 h-3 mr-1 inline" /> Quantité{' '}
                          <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        className={`input input-bordered w-full font-mono ${errors.quantity ? 'input-error' : ''}`}
                        value={formData.quantity}
                        onChange={handleChange}
                        min="1"
                        placeholder="0"
                        required
                      />
                      {errors.quantity ? (
                        <span className="text-error text-xs mt-1">{errors.quantity}</span>
                      ) : selectedProduct ? (
                        <span className="text-xs text-base-content/40 mt-1">
                          Stock actuel : {selectedProduct.current_stock || 0} unités
                        </span>
                      ) : null}
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Hash className="w-3 h-3 mr-1 inline" /> N° de lot
                        </span>
                      </label>
                      <input
                        type="text"
                        name="lot_number"
                        className="input input-bordered w-full font-mono"
                        value={formData.lot_number}
                        onChange={handleChange}
                        maxLength="100"
                        placeholder="Auto-généré si vide"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Layers className="w-3 h-3 mr-1 inline" /> N° de batch
                        </span>
                      </label>
                      <input
                        type="text"
                        name="batch_number"
                        className="input input-bordered w-full font-mono"
                        value={formData.batch_number}
                        onChange={handleChange}
                        maxLength="100"
                        placeholder="BATCH-001"
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Calendar className="w-3 h-3 mr-1 inline" /> Date
                          d'expiration
                          {selectedProduct?.has_expiry && (
                            <span className="text-error ml-1">*</span>
                          )}
                        </span>
                      </label>
                      <input
                        type="date"
                        name="expiry_date"
                        className={`input input-bordered w-full ${errors.expiry_date ? 'input-error' : ''}`}
                        value={formData.expiry_date}
                        onChange={handleChange}
                      />
                      {errors.expiry_date && (
                        <span className="text-error text-xs mt-1">{errors.expiry_date}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3 : Prix */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Prix</h2>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <BadgeDollarSign className="w-3 h-3 mr-1 inline text-error" />{' '}
                          Prix d'achat (CFA)
                        </span>
                      </label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="number"
                          name="purchase_price"
                          className="input input-bordered w-full pl-10 font-mono"
                          value={formData.purchase_price}
                          onChange={handleChange}
                          min="0"
                          step="0.01"
                          placeholder="0"
                        />
                      </div>
                      <span className="text-xs text-base-content/40 mt-1">
                        Vide = prix du produit
                      </span>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <DollarSign className="w-3 h-3 mr-1 inline text-success" />{' '}
                          Prix de vente (CFA)
                        </span>
                      </label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="number"
                          name="selling_price"
                          className="input input-bordered w-full pl-10 font-mono"
                          value={formData.selling_price}
                          onChange={handleChange}
                          min="0"
                          step="0.01"
                          placeholder="0"
                        />
                      </div>
                      <span className="text-xs text-base-content/40 mt-1">
                        Vide = prix du produit
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4 : Motif & Notes */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <PenLine className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Motif & Notes</h2>
                </div>
                <div className="p-5 space-y-4">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        <FileText className="w-3 h-3 mr-1 inline" /> Raison de
                        l'ajout
                      </span>
                    </label>
                    <input
                      type="text"
                      name="reason"
                      className="input input-bordered w-full"
                      value={formData.reason}
                      onChange={handleChange}
                      maxLength="200"
                      placeholder="Ajout manuel, retour, ajustement..."
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        <PenLine className="w-3 h-3 mr-1 inline" /> Notes
                        <span className="text-xs text-base-content/40 ml-1">
                          (observations)
                        </span>
                      </span>
                    </label>
                    <textarea
                      name="notes"
                      className="textarea textarea-bordered w-full"
                      value={formData.notes}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Informations sur le lot, qualité, fournisseur..."
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
                  <h3 className="font-semibold text-sm">Aperçu de l'opération</h3>
                </div>
                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <PackagePlus className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-base-content/50 truncate">
                        {selectedProduct?.code || 'CODE'}
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {selectedProduct?.name || 'Nom du produit'}
                      </p>
                    </div>
                  </div>
                  <div className="divider my-3"></div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Entrepôt :</span>
                      <span className="font-medium truncate ml-2 max-w-[140px]">
                        {formData.warehouse_id
                          ? getWarehouseName(formData.warehouse_id)
                          : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Quantité :</span>
                      <span className="font-mono font-bold text-success">
                        +{quantite}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Lot :</span>
                      <span className="font-mono text-[10px] truncate ml-2 max-w-[120px]">
                        {formData.lot_number || 'Auto-généré'}
                      </span>
                    </div>
                  </div>

                  {(prixAchat > 0 || quantite > 0) && (
                    <>
                      <div className="divider my-3"></div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-base-content/60">Prix achat :</span>
                          <span className="font-mono">
                            {formaterMontant(prixAchat)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-base-content/60">Valeur totale :</span>
                          <span className="font-mono font-bold text-primary">
                            {formaterMontant(valeurTotale)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {formData.expiry_date && (
                    <>
                      <div className="divider my-3"></div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-base-content/60 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Expire le :
                        </span>
                        <span className="font-mono font-bold">
                          {new Date(formData.expiry_date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </>
                  )}
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
                      L'ajout manuel crée un <strong>nouveau lot</strong> dans
                      l'entrepôt. Un <strong>mouvement</strong> de type
                      "Entrée par achat" est automatiquement enregistré.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Alerte expiration */}
            {selectedProduct?.has_expiry && !formData.expiry_date && (
              <div className="card bg-warning/5 border border-warning/20">
                <div className="card-body p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-medium text-warning mb-1">
                        Date d'expiration requise
                      </p>
                      <p className="text-base-content/70">
                        Ce produit a une date d'expiration obligatoire.
                        Remplissez le champ correspondant.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conseil */}
            <div className="card bg-success/5 border border-success/20">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-success mb-1">Traçabilité</p>
                    <p className="text-base-content/70">
                      Utilisez un <strong>numéro de lot unique</strong> pour
                      faciliter le suivi et les retours.
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
            <button
              type="button"
              onClick={() => navigate('/stocks')}
              className="btn btn-ghost"
              disabled={chargement}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary gap-2 min-w-[180px]"
              disabled={
                chargement ||
                products.length === 0 ||
                warehouses.length === 0
              }
            >
              {chargement ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Ajouter au stock
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
const AddStockManual = () => (
  <ErrorBoundary>
    <AddStockManualContent />
  </ErrorBoundary>
);

export default AddStockManual;