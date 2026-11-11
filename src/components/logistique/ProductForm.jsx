// src/components/stock/ProductForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle, Package,
  Building2, DollarSign, Calendar, FileText, Info, Eye,
  Box, RefreshCw, Barcode, Ruler, Tag, Boxes, Clock,
  AlertTriangle, Timer, Star, TrendingUp, TrendingDown,
  Settings, Calculator, XCircle, Layers, Repeat, Check
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const estEdition = Boolean(id);
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);
  const [errors, setErrors] = useState({});

  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);

  const [formData, setFormData] = useState({
    code: '',
    barcode: '',
    name: '',
    description: '',
    category: '',
    unit: '',
    type: 'standard',
    purchase_price: '',
    selling_price: '',
    wholesale_price: '',
    promo_price: '',
    tax_rate: 0,
    has_expiry: false,
    shelf_life_days: '',
    alert_days: 30,
    min_stock: 0,
    max_stock: 0,
    reorder_point: 0,
    reorder_quantity: 0,
    status: 'active',
    is_featured: false,
  });

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================
  useEffect(() => {
    const init = async () => {
      await Promise.all([chargerCategories(), chargerUnits()]);
      if (estEdition) {
        await chargerProduit();
      } else {
        setChargementInitial(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const chargerCategories = async () => {
    try {
      const res = await AxiosInstance.get('/categories/?page_size=500').catch(() => ({ data: [] }));
      const data = res.data.results || res.data || [];
      setCategories(data.filter(c => c.is_active));
    } catch (err) {
      console.error('Erreur chargement catégories:', err);
    }
  };

  const chargerUnits = async () => {
    try {
      const res = await AxiosInstance.get('/unit-measures/?page_size=500').catch(() => ({ data: [] }));
      const data = res.data.results || res.data || [];
      setUnits(data.filter(u => u.is_active));
    } catch (err) {
      console.error('Erreur chargement unités:', err);
    }
  };

  const chargerProduit = async () => {
    setChargementInitial(true);
    try {
      const res = await AxiosInstance.get(`/products/${id}/`);
      const d = res.data;
      setFormData({
        code: d.code || '',
        barcode: d.barcode || '',
        name: d.name || '',
        description: d.description || '',
        category: d.category || '',
        unit: d.unit || '',
        type: d.type || 'standard',
        purchase_price: d.purchase_price || '',
        selling_price: d.selling_price || '',
        wholesale_price: d.wholesale_price || '',
        promo_price: d.promo_price || '',
        tax_rate: d.tax_rate || 0,
        has_expiry: d.has_expiry || false,
        shelf_life_days: d.shelf_life_days || '',
        alert_days: d.alert_days || 30,
        min_stock: d.min_stock || 0,
        max_stock: d.max_stock || 0,
        reorder_point: d.reorder_point || 0,
        reorder_quantity: d.reorder_quantity || 0,
        status: d.status || 'active',
        is_featured: d.is_featured || false,
      });
    } catch (err) {
      setErreur('Impossible de charger le produit');
    } finally {
      setChargementInitial(false);
    }
  };

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const generateCode = () => {
    const prefix = formData.name ? formData.name.substring(0, 3).toUpperCase() : 'PRD';
    const randomNum = Math.floor(Math.random() * 1000);
    setFormData(prev => ({ ...prev, code: `${prefix}${randomNum}` }));
  };

  const generateBarcode = () => {
    let digits = '20';
    for (let i = 0; i < 10; i++) {
      digits += Math.floor(Math.random() * 10).toString();
    }
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(digits[i], 10);
      sum += (i % 2 === 0) ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    setFormData(prev => ({ ...prev, barcode: digits + checkDigit.toString() }));
  };

  // ============================================================
  // VALIDATION
  // ============================================================
  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.code.trim()) newErrors.code = 'Le code est requis';
    if (!formData.purchase_price) newErrors.purchase_price = "Le prix d'achat est requis";
    if (!formData.selling_price) newErrors.selling_price = 'Le prix de vente est requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const marge = (Number(formData.selling_price || 0) - Number(formData.purchase_price || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      setErreur('Veuillez corriger les champs en rouge.');
      return;
    }

    setChargement(true);
    setErreur(null);
    setSucces(false);

    try {
      const dataToSend = { ...formData };

      if (!dataToSend.category) dataToSend.category = null;
      if (!dataToSend.unit) dataToSend.unit = null;
      if (!dataToSend.barcode) dataToSend.barcode = null;
      if (!dataToSend.wholesale_price) dataToSend.wholesale_price = null;
      if (!dataToSend.promo_price) dataToSend.promo_price = null;

      if (!dataToSend.shelf_life_days && dataToSend.shelf_life_days !== 0) {
        dataToSend.shelf_life_days = null;
      } else if (dataToSend.shelf_life_days !== null) {
        dataToSend.shelf_life_days = parseInt(dataToSend.shelf_life_days, 10);
      }
      if (!dataToSend.alert_days && dataToSend.alert_days !== 0) {
        dataToSend.alert_days = 30;
      } else if (dataToSend.alert_days !== null) {
        dataToSend.alert_days = parseInt(dataToSend.alert_days, 10);
      }

      if (dataToSend.tax_rate) dataToSend.tax_rate = parseFloat(dataToSend.tax_rate);
      if (dataToSend.min_stock) dataToSend.min_stock = parseInt(dataToSend.min_stock, 10);
      if (dataToSend.max_stock) dataToSend.max_stock = parseInt(dataToSend.max_stock, 10);
      if (dataToSend.reorder_point) dataToSend.reorder_point = parseInt(dataToSend.reorder_point, 10);
      if (dataToSend.reorder_quantity) dataToSend.reorder_quantity = parseInt(dataToSend.reorder_quantity, 10);

      if (estEdition) {
        await AxiosInstance.patch(`/products/${id}/`, dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/produits'), 1200);
      } else {
        await AxiosInstance.post('/products/', dataToSend);
        setSucces(true);
        setTimeout(() => navigate('/produits'), 1200);
      }
    } catch (err) {
      if (err.response?.data) {
        setErrors(err.response.data);
        const errorList = Object.values(err.response.data).flat();
        setErreur(errorList.join(', '));
      } else {
        setErreur("Erreur lors de l'enregistrement");
      }
    } finally {
      setChargement(false);
    }
  };

  // ============================================================
  // UTILS
  // ============================================================
  // ✅ CFA au lieu de GNF
  const formaterMontant = (m) =>
    new Intl.NumberFormat('fr-FR').format(Math.round(Number(m || 0))) + ' CFA';

  const categorieSelectionnee = categories.find(c => String(c.id) === String(formData.category));
  const uniteSelectionnee = units.find(u => String(u.id) === String(formData.unit));

  // ============================================================
  // LOADING
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

  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">
      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/produits')}
            className="btn btn-ghost btn-sm btn-circle"
            type="button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Produits / Stocks / <span className="text-primary">{estEdition ? 'Édition' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <Package className="w-5 h-5 text-primary" />
              {estEdition ? 'Modifier le produit' : 'Nouveau produit'}
            </h1>
          </div>
          <div className="badge badge-primary hidden sm:flex">
            {estEdition ? 'Édition' : 'Création'}
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Produit {estEdition ? 'modifié' : 'créé'} avec succès !</span>
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
          {/* ============================================================ */}
          {/* COLONNE PRINCIPALE (2/3) */}
          {/* ============================================================ */}
          <div className="lg:col-span-2 space-y-6">
            {/* SECTION 1 : Informations générales */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Informations générales</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Nom du produit <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                        value={formData.name}
                        onChange={handleChange}
                        required
                        maxLength="200"
                        placeholder="Ex : Smartphone XYZ Pro"
                      />
                      {errors.name && <span className="text-error text-xs mt-1">{errors.name}</span>}
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Tag className="w-3 h-3 mr-1 inline" /> Catégorie
                        </span>
                      </label>
                      <select
                        name="category"
                        className="select select-bordered w-full"
                        value={formData.category || ''}
                        onChange={handleChange}
                      >
                        <option value="">— Sélectionner —</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Code produit <span className="text-error">*</span>
                        </span>
                      </label>
                      <div className="join w-full">
                        <input
                          type="text"
                          name="code"
                          className={`input input-bordered join-item flex-1 ${errors.code ? 'input-error' : ''}`}
                          value={formData.code}
                          onChange={handleChange}
                          required
                          maxLength="50"
                          placeholder="Ex : PRD001"
                        />
                        <button
                          type="button"
                          onClick={generateCode}
                          className="btn btn-outline join-item gap-1"
                          title="Générer automatiquement"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span className="hidden sm:inline">Auto</span>
                        </button>
                      </div>
                      {errors.code && <span className="text-error text-xs mt-1">{errors.code}</span>}
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Barcode className="w-3 h-3 mr-1 inline" /> Code-barres (EAN-13)
                        </span>
                      </label>
                      <div className="join w-full">
                        <input
                          type="text"
                          name="barcode"
                          className={`input input-bordered join-item flex-1 font-mono ${errors.barcode ? 'input-error' : ''}`}
                          value={formData.barcode}
                          onChange={handleChange}
                          maxLength="13"
                          placeholder="2001234567893"
                        />
                        <button
                          type="button"
                          onClick={generateBarcode}
                          className="btn btn-outline join-item gap-1"
                          title="Générer un EAN-13 valide"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span className="hidden sm:inline">Auto</span>
                        </button>
                      </div>
                      {errors.barcode && <span className="text-error text-xs mt-1">{errors.barcode}</span>}
                      <span className="text-xs text-base-content/40 mt-1">
                        Génération automatique avec clé de contrôle valide
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Ruler className="w-3 h-3 mr-1 inline" /> Unité de mesure
                        </span>
                      </label>
                      <select
                        name="unit"
                        className="select select-bordered w-full"
                        value={formData.unit || ''}
                        onChange={handleChange}
                      >
                        <option value="">— Sélectionner —</option>
                        {units.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Box className="w-3 h-3 mr-1 inline" /> Type de produit
                        </span>
                      </label>
                      <select
                        name="type"
                        className="select select-bordered w-full"
                        value={formData.type}
                        onChange={handleChange}
                      >
                        <option value="standard">Standard</option>
                        <option value="consignable">Consignable</option>
                        <option value="expirable">À durée limitée</option>
                        <option value="service">Service</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">Description</span>
                    </label>
                    <textarea
                      name="description"
                      className="textarea textarea-bordered w-full"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Description détaillée du produit..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2 : Prix */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Prix & TVA</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <DollarSign className="w-3 h-3 mr-1 inline text-error" /> Prix d'achat (CFA) <span className="text-error">*</span>
                        </span>
                      </label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="number"
                          name="purchase_price"
                          className={`input input-bordered w-full pl-10 font-mono ${errors.purchase_price ? 'input-error' : ''}`}
                          value={formData.purchase_price}
                          onChange={handleChange}
                          required
                          min="0"
                          step="100"
                          placeholder="0"
                        />
                      </div>
                      {errors.purchase_price && <span className="text-error text-xs mt-1">{errors.purchase_price}</span>}
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <DollarSign className="w-3 h-3 mr-1 inline text-success" /> Prix de vente (CFA) <span className="text-error">*</span>
                        </span>
                      </label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="number"
                          name="selling_price"
                          className={`input input-bordered w-full pl-10 font-mono ${errors.selling_price ? 'input-error' : ''}`}
                          value={formData.selling_price}
                          onChange={handleChange}
                          required
                          min="0"
                          step="100"
                          placeholder="0"
                        />
                      </div>
                      {errors.selling_price && <span className="text-error text-xs mt-1">{errors.selling_price}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Prix de gros (CFA)</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="number"
                          name="wholesale_price"
                          className="input input-bordered w-full pl-10 font-mono"
                          value={formData.wholesale_price}
                          onChange={handleChange}
                          min="0"
                          step="100"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Tag className="w-3 h-3 mr-1 inline" /> Prix promo (CFA)
                        </span>
                      </label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="number"
                          name="promo_price"
                          className="input input-bordered w-full pl-10 font-mono"
                          value={formData.promo_price}
                          onChange={handleChange}
                          min="0"
                          step="100"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Calculator className="w-3 h-3 mr-1 inline" /> TVA (%)
                        </span>
                      </label>
                      <input
                        type="number"
                        name="tax_rate"
                        className="input input-bordered w-full font-mono"
                        value={formData.tax_rate}
                        onChange={handleChange}
                        min="0"
                        step="0.1"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Affichage marge */}
                  {formData.purchase_price && formData.selling_price && (
                    <div className={`alert py-2 ${marge >= 0 ? 'alert-success' : 'alert-error'}`}>
                      {marge >= 0 ? (
                        <>
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-xs">
                            Marge unitaire : <strong>{formaterMontant(marge)}</strong>
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-4 h-4" />
                          <span className="text-xs">
                            Marge négative : <strong>{formaterMontant(marge)}</strong> (perte par unité)
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 3 : Seuils de stock */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Seuils de stock</h2>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-xs font-medium">
                          <TrendingDown className="w-3 h-3 mr-1 inline text-warning" /> Stock min
                        </span>
                      </label>
                      <input
                        type="number"
                        name="min_stock"
                        className="input input-bordered w-full font-mono"
                        value={formData.min_stock}
                        onChange={handleChange}
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-xs font-medium">
                          <TrendingUp className="w-3 h-3 mr-1 inline text-success" /> Stock max
                        </span>
                      </label>
                      <input
                        type="number"
                        name="max_stock"
                        className="input input-bordered w-full font-mono"
                        value={formData.max_stock}
                        onChange={handleChange}
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-xs font-medium">
                          <AlertCircle className="w-3 h-3 mr-1 inline text-info" /> Pt cmd
                        </span>
                      </label>
                      <input
                        type="number"
                        name="reorder_point"
                        className="input input-bordered w-full font-mono"
                        value={formData.reorder_point}
                        onChange={handleChange}
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-xs font-medium">
                          <Boxes className="w-3 h-3 mr-1 inline" /> Qté réap.
                        </span>
                      </label>
                      <input
                        type="number"
                        name="reorder_quantity"
                        className="input input-bordered w-full font-mono"
                        value={formData.reorder_quantity}
                        onChange={handleChange}
                        min="0"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4 : Date d'expiration */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Date d'expiration</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="form-control w-full">
                    <label className="label cursor-pointer justify-start gap-3 py-1">
                      <input
                        type="checkbox"
                        name="has_expiry"
                        className="checkbox checkbox-primary"
                        checked={formData.has_expiry}
                        onChange={handleChange}
                      />
                      <span className="label-text text-sm font-medium flex items-center gap-2">
                        <Timer className="w-4 h-4 text-primary" />
                        Ce produit a une date d'expiration
                      </span>
                    </label>
                  </div>

                  {formData.has_expiry && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-base-200">
                      <div className="form-control w-full">
                        <label className="label py-0 pb-1.5">
                          <span className="label-text text-sm font-medium">
                            <Calendar className="w-3 h-3 mr-1 inline" /> Durée de conservation (jours)
                            <span className="text-xs text-base-content/40 ml-1">(optionnel)</span>
                          </span>
                        </label>
                        <input
                          type="number"
                          name="shelf_life_days"
                          className="input input-bordered w-full font-mono"
                          value={formData.shelf_life_days}
                          onChange={handleChange}
                          min="0"
                          placeholder="Ex : 365 (facultatif)"
                        />
                        <span className="text-xs text-base-content/40 mt-1">
                          Laissez vide si pas de durée automatique
                        </span>
                      </div>
                      <div className="form-control w-full">
                        <label className="label py-0 pb-1.5">
                          <span className="label-text text-sm font-medium">
                            <AlertTriangle className="w-3 h-3 mr-1 inline text-warning" /> Jours d'alerte
                            <span className="text-xs text-base-content/40 ml-1">(optionnel)</span>
                          </span>
                        </label>
                        <input
                          type="number"
                          name="alert_days"
                          className="input input-bordered w-full font-mono"
                          value={formData.alert_days}
                          onChange={handleChange}
                          min="0"
                          placeholder="30"
                        />
                        <span className="text-xs text-base-content/40 mt-1">
                          Alerte X jours avant expiration (défaut : 30)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 5 : Statut */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Statut & visibilité</h2>
                </div>
                <div className="p-5 space-y-4">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        <CheckCircle className="w-3 h-3 mr-1 inline" /> Statut du produit
                      </span>
                    </label>
                    <select
                      name="status"
                      className="select select-bordered w-full"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="active">Actif — Visible dans le catalogue</option>
                      <option value="inactive">Inactif — Masqué du catalogue</option>
                    </select>
                  </div>
                  <div className="form-control w-full">
                    <label className="label cursor-pointer justify-start gap-3 py-1">
                      <input
                        type="checkbox"
                        name="is_featured"
                        className="checkbox checkbox-warning"
                        checked={formData.is_featured}
                        onChange={handleChange}
                      />
                      <span className="label-text text-sm font-medium flex items-center gap-2">
                        <Star className="w-4 h-4 text-warning" />
                        Produit vedette (mis en avant)
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* COLONNE APERÇU (1/3) */}
          {/* ============================================================ */}
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
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-base-content/50 truncate">
                        {formData.code || 'CODE'}
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {formData.name || 'Nom du produit'}
                      </p>
                    </div>
                  </div>
                  <div className="divider my-3"></div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Catégorie :</span>
                      <span className="font-medium truncate ml-2 max-w-[140px]">
                        {categorieSelectionnee?.name || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Unité :</span>
                      <span className="font-medium">
                        {uniteSelectionnee?.symbol || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Code-barres :</span>
                      <span className="font-mono text-[10px] truncate ml-2 max-w-[140px]">
                        {formData.barcode || '—'}
                      </span>
                    </div>
                  </div>
                  <div className="divider my-3"></div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Achat :</span>
                      <span className="font-mono">
                        {formaterMontant(formData.purchase_price)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Vente :</span>
                      <span className="font-mono font-bold text-success">
                        {formaterMontant(formData.selling_price)}
                      </span>
                    </div>
                    {formData.promo_price && (
                      <div className="flex justify-between">
                        <span className="text-base-content/60">Promo :</span>
                        <span className="font-mono text-warning">
                          {formaterMontant(formData.promo_price)}
                        </span>
                      </div>
                    )}
                  </div>

                  {formData.has_expiry && (
                    <>
                      <div className="divider my-3"></div>
                      <div className="flex items-center gap-2 text-xs">
                        <Timer className="w-3 h-3 text-primary" />
                        <span className="text-base-content/60">
                          Durée de conservation :
                        </span>
                        <span className="font-mono font-bold">
                          {formData.shelf_life_days || '?'} j
                        </span>
                      </div>
                    </>
                  )}

                  <div className="divider my-3"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-base-content/60">Statut :</span>
                    <span className={`badge badge-sm ${formData.status === 'active' ? 'badge-success' : 'badge-ghost'}`}>
                      {formData.status === 'active' ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  {formData.is_featured && (
                    <div className="flex items-center gap-1 mt-2 text-warning text-xs">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="font-medium">Produit vedette</span>
                    </div>
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
                      Le <strong>code-barres EAN-13</strong> est généré automatiquement avec
                      une clé de contrôle valide. Le <strong>stock actuel</strong> est calculé
                      à partir des lots (FIFO).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Aide marge */}
            {formData.purchase_price && formData.selling_price && (
              <div className={`card border ${marge >= 0 ? 'bg-success/5 border-success/20' : 'bg-error/5 border-error/20'}`}>
                <div className="card-body p-4">
                  <div className="flex items-start gap-2">
                    {marge >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
                    )}
                    <div className="text-xs">
                      <p className={`font-medium mb-1 ${marge >= 0 ? 'text-success' : 'text-error'}`}>
                        {marge >= 0 ? 'Marge bénéficiaire' : 'Marge négative'}
                      </p>
                      <p className="text-base-content/70 font-mono text-base font-bold">
                        {formaterMontant(marge)}
                      </p>
                      {marge > 0 && formData.purchase_price && (
                        <p className="text-base-content/60 mt-1">
                          ({((marge / Number(formData.purchase_price)) * 100).toFixed(1)}% du prix d'achat)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BARRE STICKY */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-base-100 border-t border-base-300 shadow-lg lg:pl-72">
          <div className="flex items-center justify-end gap-3 px-6 py-3">
            <button
              type="button"
              onClick={() => navigate('/produits')}
              className="btn btn-ghost"
              disabled={chargement}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary gap-2 min-w-[160px]"
              disabled={chargement}
            >
              {chargement ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer le produit'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;