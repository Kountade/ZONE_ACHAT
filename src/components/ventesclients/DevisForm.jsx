// src/components/devis/DevisForm.jsx
// ============================================================
// VERSION OPTIMISÉE - Chargement rapide (inspiré de ClientForm)
// ============================================================

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle, FileText,
  User, Building2, Calendar, Package, Plus, Trash2, Info, Eye,
  Percent, Truck, Receipt, Calculator, Box, Sparkles,
  AlertTriangle, X,
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
    console.error('ErrorBoundary DevisForm:', error, errorInfo);
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
                onClick={() => window.location.href = '/devis'}
                className="btn btn-ghost"
              >
                Retour aux devis
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
const DevisFormContent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // États
  const [chargementInitial, setChargementInitial] = useState(true);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  // Données
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  // Formulaire
  const [formData, setFormData] = useState({
    client: '',
    warehouse: '',
    valid_until: '',
    discount_type: 'percentage',
    discount_value: 0,
    tax_rate: 0,
    shipping_fee: 0,
    notes: '',
    internal_notes: '',
    lines: [],
  });

  // Ligne en cours d'ajout
  const [lineForm, setLineForm] = useState({
    product: '',
    quantity: 1,
    unit_price: 0,
    discount: 0,
    tax_rate: 0,
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
  // - Le formulaire s'affiche dès que les données essentielles sont là
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
        // ✅ CHARGEMENT EN PARALLÈLE (beaucoup plus rapide)
        const [whResult, clResult, prResult] = await Promise.allSettled([
          // 1. Warehouses (rapide)
          AxiosInstance.get('/warehouses/?active=true&page_size=200', {
            headers,
            signal: controller.signal,
          }),
          // 2. Clients
          AxiosInstance.get('/clients/?page_size=500', {
            headers,
            signal: controller.signal,
          }),
          // 3. Products (essai brief/, sinon fallback)
          AxiosInstance.get('/products/brief/', {
            headers,
            signal: controller.signal,
          }),
        ]);

        if (!isMounted) return;

        // Traitement des résultats (même si certains échouent)
        let warehousesData = [];
        let clientsData = [];
        let productsData = [];

        if (whResult.status === 'fulfilled') {
          warehousesData = normalizeData(whResult.value.data);
          setWarehouses(warehousesData);
        }

        if (clResult.status === 'fulfilled') {
          clientsData = normalizeData(clResult.value.data);
          setClients(clientsData);
        }

        if (prResult.status === 'fulfilled') {
          productsData = normalizeData(prResult.value.data);
          setProducts(productsData);
        } else {
          // Fallback si /brief/ n'existe pas
          try {
            const fallbackRes = await AxiosInstance.get(
              '/products/?status=active&page_size=500',
              { headers, signal: controller.signal }
            );
            if (isMounted) {
              productsData = normalizeData(fallbackRes.data);
              setProducts(productsData);
            }
          } catch (fallbackErr) {
            if (fallbackErr.name === 'CanceledError') return;
            if (isMounted) setProducts([]);
          }
        }

        // 4. Devis en édition (après les données de base)
        if (isEdit && isMounted) {
          const dRes = await AxiosInstance.get(`/devis/${id}/`, {
            headers,
            signal: controller.signal,
          });

          if (!isMounted) return;

          const d = dRes.data || {};
          const lignesData = normalizeData(d.lignes);

          setFormData({
            client: d.client?.id || d.client || '',
            warehouse: d.warehouse || '',
            valid_until: d.valid_until || '',
            discount_type: d.discount_type || 'percentage',
            discount_value: parseFloat(d.discount_value) || 0,
            tax_rate: parseFloat(d.tax_rate) || 0,
            shipping_fee: parseFloat(d.shipping_fee) || 0,
            notes: d.notes || '',
            internal_notes: d.internal_notes || '',
            lines: lignesData.map((line) => ({
              id: line.id,
              product: line.product,
              product_name: line.product_name || '',
              quantity: parseInt(line.quantity, 10) || 0,
              unit_price: parseFloat(line.unit_price) || 0,
              discount: parseFloat(line.discount) || 0,
              tax_rate: parseFloat(line.tax_rate) || 0,
              total: parseFloat(line.total) || 0,
            })),
          });
        } else if (!isEdit && warehousesData.length === 1) {
          // Sélection automatique si un seul entrepôt
          setFormData((prev) => ({ ...prev, warehouse: warehousesData[0].id }));
        }
      } catch (err) {
        if (!isMounted || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
          return;
        }

        if (err.response?.status === 401) {
          navigate('/login');
        } else if (err.response?.status === 404 && isEdit) {
          setErreur('Devis non trouvé');
          window.setTimeout(() => navigate('/devis'), 1500);
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
  }, [id, isEdit, navigate]);

  // ============================================================
  // CALCUL DES TOTAUX (mémoïsé)
  // ============================================================
  const totals = useMemo(() => {
    let subtotal = 0;
    (formData.lines || []).forEach((line) => {
      const qty = parseFloat(line.quantity) || 0;
      const price = parseFloat(line.unit_price) || 0;
      const disc = parseFloat(line.discount) || 0;
      subtotal += qty * price - disc;
    });

    const discountValue = parseFloat(formData.discount_value) || 0;
    const discountAmount =
      formData.discount_type === 'percentage'
        ? subtotal * (discountValue / 100)
        : discountValue;

    const afterDiscount = subtotal - discountAmount;
    const taxRate = parseFloat(formData.tax_rate) || 0;
    const totalTax = afterDiscount * (taxRate / 100);
    const shippingFee = parseFloat(formData.shipping_fee) || 0;
    const total = afterDiscount + totalTax + shippingFee;

    return {
      subtotal: isFinite(subtotal) ? subtotal : 0,
      discountAmount: isFinite(discountAmount) ? discountAmount : 0,
      totalTax: isFinite(totalTax) ? totalTax : 0,
      total: isFinite(total) ? total : 0,
    };
  }, [
    formData.lines,
    formData.discount_type,
    formData.discount_value,
    formData.tax_rate,
    formData.shipping_fee,
  ]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (erreur) setErreur(null);
  };

  const handleLineFormChange = (field, value) => {
    setLineForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleProductSelect = (productId) => {
    const product = products.find((p) => String(p.id) === String(productId));
    setLineForm((prev) => ({
      ...prev,
      product: productId,
      unit_price: product ? parseFloat(product.selling_price) || 0 : 0,
    }));
  };

  // ============================================================
  // AJOUT D'UNE LIGNE
  // ============================================================
  const addLine = () => {
    if (!lineForm.product) {
      setErreur('Sélectionnez un produit');
      return;
    }
    if (lineForm.quantity <= 0) {
      setErreur('La quantité doit être supérieure à 0');
      return;
    }

    const productId = parseInt(lineForm.product, 10);
    const product = products.find((p) => p.id === productId);
    if (!product) {
      setErreur('Produit non trouvé');
      return;
    }

    if (formData.lines.some((l) => parseInt(l.product, 10) === productId)) {
      setErreur(`Le produit "${product.name}" est déjà dans la liste`);
      return;
    }

    const quantity = parseInt(lineForm.quantity, 10) || 0;
    const unitPrice = parseFloat(lineForm.unit_price) || 0;
    const discount = parseFloat(lineForm.discount) || 0;
    const taxRate = parseFloat(lineForm.tax_rate) || 0;
    const total = quantity * unitPrice - discount;

    setFormData((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          product: productId,
          product_name: product.name,
          quantity,
          unit_price: unitPrice,
          discount,
          tax_rate: taxRate,
          total,
        },
      ],
    }));

    setLineForm({
      product: '',
      quantity: 1,
      unit_price: 0,
      discount: 0,
      tax_rate: 0,
    });
    setErreur(null);
  };

  const removeLine = (index) => {
    setFormData((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }));
  };

  const updateLine = (index, field, value) => {
    const newLines = [...formData.lines];
    const numericFields = ['quantity', 'unit_price', 'discount', 'tax_rate'];
    const newValue = numericFields.includes(field)
      ? parseFloat(value) || 0
      : value;

    newLines[index][field] = newValue;
    newLines[index].total =
      (parseFloat(newLines[index].quantity) || 0) *
        (parseFloat(newLines[index].unit_price) || 0) -
      (parseFloat(newLines[index].discount) || 0);

    setFormData((prev) => ({ ...prev, lines: newLines }));
  };

  // ============================================================
  // SUBMIT
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (chargement) return;

    setErreur(null);
    setSucces(false);

    if (!formData.client) {
      setErreur('Sélectionnez un client');
      return;
    }
    if (!formData.warehouse) {
      setErreur('Sélectionnez un entrepôt');
      return;
    }
    if (!formData.valid_until) {
      setErreur('Définissez la date de validité');
      return;
    }
    if (!formData.lines || formData.lines.length === 0) {
      setErreur('Ajoutez au moins un produit');
      return;
    }

    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }

    setChargement(true);

    try {
      const headers = { Authorization: `Token ${token}` };

      const dataToSend = {
        client: formData.client || null,
        warehouse: formData.warehouse,
        valid_until: formData.valid_until,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value) || 0,
        tax_rate: parseFloat(formData.tax_rate) || 0,
        shipping_fee: parseFloat(formData.shipping_fee) || 0,
        notes: formData.notes || '',
        internal_notes: formData.internal_notes || '',
        lignes: formData.lines.map((line) => ({
          product: line.product,
          quantity: line.quantity,
          unit_price: line.unit_price,
          discount: line.discount,
          tax_rate: line.tax_rate,
        })),
      };

      let response;
      if (isEdit) {
        response = await AxiosInstance.put(`/devis/${id}/`, dataToSend, { headers });
      } else {
        response = await AxiosInstance.post('/devis/', dataToSend, { headers });
      }

      setSucces(true);
      const devisId = response.data?.id || id;
      window.setTimeout(() => navigate(`/devis/${devisId}`), 1200);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
        return;
      }

      let msg = 'Erreur lors de la sauvegarde';
      const data = err.response?.data;

      if (typeof data === 'string') {
        msg = data;
      } else if (data?.lignes && Array.isArray(data.lignes)) {
        msg = data.lignes[0];
      } else if (data?.detail) {
        msg = data.detail;
      } else if (data && typeof data === 'object') {
        msg = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ');
      }

      setErreur(msg);
    } finally {
      setChargement(false);
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================
  const formaterMontant = (n) =>
    new Intl.NumberFormat('fr-FR').format(Math.round(Number(n || 0))) + ' CFA';

  const getWarehouseName = (whId) => {
    const wh = warehouses.find((w) => String(w.id) === String(whId));
    return wh ? `${wh.name} (${wh.code})` : '—';
  };

  const getClientName = (clId) => {
    const cl = clients.find((c) => String(c.id) === String(clId));
    return cl ? `${cl.name} (${cl.code})` : '—';
  };

  const totalArticles = formData.lines.reduce(
    (sum, l) => sum + (parseInt(l.quantity, 10) || 0),
    0
  );

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
            onClick={() => navigate('/devis')}
            className="btn btn-ghost btn-sm btn-circle"
            type="button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Devis / <span className="text-primary">{isEdit ? 'Édition' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <FileText className="w-5 h-5 text-primary" />
              {isEdit ? 'Modifier le devis' : 'Nouveau devis'}
            </h1>
          </div>
          <div className="badge badge-primary hidden sm:flex">
            {isEdit ? 'Édition' : 'Création'}
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Devis {isEdit ? 'modifié' : 'créé'} avec succès !</span>
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
            {/* SECTION 1 : Informations générales */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Informations générales</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <User className="w-3 h-3 mr-1 inline" /> Client{' '}
                          <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="client"
                        className="select select-bordered w-full"
                        value={formData.client}
                        onChange={handleChange}
                        required
                      >
                        <option value="">— Sélectionner ({clients.length}) —</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.code} - {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Building2 className="w-3 h-3 mr-1 inline" /> Entrepôt{' '}
                          <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="warehouse"
                        className="select select-bordered w-full"
                        value={formData.warehouse}
                        onChange={handleChange}
                        required
                      >
                        <option value="">— Sélectionner ({warehouses.length}) —</option>
                        {warehouses.map((wh) => (
                          <option key={wh.id} value={wh.id}>
                            {wh.name} ({wh.code})
                          </option>
                        ))}
                      </select>
                      {warehouses.length === 1 && (
                        <span className="text-xs text-success mt-1">
                          Sélectionné automatiquement
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Calendar className="w-3 h-3 mr-1 inline" /> Valable
                          jusqu'au <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="date"
                        name="valid_until"
                        className="input input-bordered w-full"
                        value={formData.valid_until}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2 : Lignes produits */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">
                    Produits
                    <span className="text-xs text-base-content/50 ml-2 font-normal">
                      ({formData.lines.length} article{formData.lines.length > 1 ? 's' : ''})
                    </span>
                  </h2>
                </div>
                <div className="p-5 space-y-4">
                  {/* Formulaire d'ajout */}
                  <div className="bg-base-200/30 rounded-lg p-3 border border-base-300">
                    <div className="grid grid-cols-2 md:grid-cols-12 gap-2 items-end">
                      <div className="col-span-2 md:col-span-4 form-control">
                        <label className="label py-0 pb-1">
                          <span className="label-text text-xs font-medium">Produit</span>
                        </label>
                        <select
                          className="select select-bordered select-sm w-full"
                          value={lineForm.product}
                          onChange={(e) => handleProductSelect(e.target.value)}
                        >
                          <option value="">— Choisir —</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.code} - {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-1 md:col-span-2 form-control">
                        <label className="label py-0 pb-1">
                          <span className="label-text text-xs font-medium">Qté</span>
                        </label>
                        <input
                          type="number"
                          className="input input-bordered input-sm w-full font-mono"
                          value={lineForm.quantity}
                          onChange={(e) => handleLineFormChange('quantity', parseInt(e.target.value, 10) || 1)}
                          min="1"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2 form-control">
                        <label className="label py-0 pb-1">
                          <span className="label-text text-xs font-medium">Prix</span>
                        </label>
                        <input
                          type="number"
                          className="input input-bordered input-sm w-full font-mono"
                          value={lineForm.unit_price}
                          onChange={(e) => handleLineFormChange('unit_price', parseFloat(e.target.value) || 0)}
                          step="0.01"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2 form-control">
                        <label className="label py-0 pb-1">
                          <span className="label-text text-xs font-medium">Remise</span>
                        </label>
                        <input
                          type="number"
                          className="input input-bordered input-sm w-full font-mono"
                          value={lineForm.discount}
                          onChange={(e) => handleLineFormChange('discount', parseFloat(e.target.value) || 0)}
                          step="0.01"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <button
                          type="button"
                          onClick={addLine}
                          className="btn btn-primary btn-sm w-full gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="hidden md:inline">Ajouter</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Liste des lignes */}
                  {formData.lines.length === 0 ? (
                    <div className="text-center py-8 text-base-content/40">
                      <Box className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Aucun produit ajouté</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="table table-sm w-full">
                        <thead className="bg-base-200/50">
                          <tr>
                            <th className="text-left">Produit</th>
                            <th className="text-center w-20">Qté</th>
                            <th className="text-right w-28">Prix unit.</th>
                            <th className="text-right w-24">Remise</th>
                            <th className="text-right w-32">Total</th>
                            <th className="text-center w-12"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.lines.map((line, idx) => (
                            <tr key={idx} className="border-b border-base-200">
                              <td className="font-medium text-sm">
                                {line.product_name}
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="input input-bordered input-xs w-full font-mono text-center"
                                  value={line.quantity}
                                  onChange={(e) =>
                                    updateLine(idx, 'quantity', e.target.value)
                                  }
                                  min="1"
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="input input-bordered input-xs w-full font-mono text-right"
                                  value={line.unit_price}
                                  onChange={(e) =>
                                    updateLine(idx, 'unit_price', e.target.value)
                                  }
                                  step="0.01"
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="input input-bordered input-xs w-full font-mono text-right"
                                  value={line.discount}
                                  onChange={(e) =>
                                    updateLine(idx, 'discount', e.target.value)
                                  }
                                  step="0.01"
                                />
                              </td>
                              <td className="text-right font-mono font-semibold text-primary text-sm">
                                {formaterMontant(line.total)}
                              </td>
                              <td className="text-center">
                                <button
                                  type="button"
                                  onClick={() => removeLine(idx)}
                                  className="btn btn-ghost btn-xs btn-circle text-error"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 3 : Remises et taxes */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Remises et taxes</h2>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Type de remise
                        </span>
                      </label>
                      <select
                        name="discount_type"
                        className="select select-bordered w-full"
                        value={formData.discount_type}
                        onChange={handleChange}
                      >
                        <option value="percentage">Pourcentage</option>
                        <option value="amount">Montant</option>
                      </select>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Percent className="w-3 h-3 mr-1 inline" /> Valeur
                        </span>
                      </label>
                      <input
                        type="number"
                        name="discount_value"
                        className="input input-bordered w-full font-mono"
                        value={formData.discount_value}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Percent className="w-3 h-3 mr-1 inline" /> TVA (%)
                        </span>
                      </label>
                      <input
                        type="number"
                        name="tax_rate"
                        className="input input-bordered w-full font-mono"
                        value={formData.tax_rate}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        max="100"
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Truck className="w-3 h-3 mr-1 inline" /> Livraison
                        </span>
                      </label>
                      <input
                        type="number"
                        name="shipping_fee"
                        className="input input-bordered w-full font-mono"
                        value={formData.shipping_fee}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4 : Notes */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Notes</h2>
                </div>
                <div className="p-5 space-y-4">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Notes (visibles sur le devis)
                      </span>
                    </label>
                    <textarea
                      name="notes"
                      className="textarea textarea-bordered w-full"
                      value={formData.notes}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Conditions de paiement, délais de livraison..."
                    ></textarea>
                  </div>
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Notes internes
                      </span>
                    </label>
                    <textarea
                      name="internal_notes"
                      className="textarea textarea-bordered w-full"
                      value={formData.internal_notes}
                      onChange={handleChange}
                      rows="2"
                      placeholder="Notes pour usage interne uniquement"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLONNE APERÇU (1/3) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm sticky top-20">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Aperçu</h3>
                </div>
                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-base-content/50 truncate">
                        DEVIS
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {isEdit ? `Devis #${id}` : 'Nouveau devis'}
                      </p>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Client :</span>
                      <span className="font-medium truncate ml-2 max-w-[140px]">
                        {getClientName(formData.client)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Entrepôt :</span>
                      <span className="font-medium truncate ml-2 max-w-[140px]">
                        {getWarehouseName(formData.warehouse)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Valide :</span>
                      <span className="font-mono text-xs">
                        {formData.valid_until
                          ? new Date(formData.valid_until).toLocaleDateString('fr-FR')
                          : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Articles :</span>
                      <span className="font-mono font-bold">{formData.lines.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Quantité totale :</span>
                      <span className="font-mono font-bold">{totalArticles}</span>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Sous-total :</span>
                      <span className="font-mono">
                        {formaterMontant(totals.subtotal)}
                      </span>
                    </div>
                    {totals.discountAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-base-content/60">Remise :</span>
                        <span className="font-mono text-error">
                          -{formaterMontant(totals.discountAmount)}
                        </span>
                      </div>
                    )}
                    {totals.totalTax > 0 && (
                      <div className="flex justify-between">
                        <span className="text-base-content/60">TVA :</span>
                        <span className="font-mono">
                          {formaterMontant(totals.totalTax)}
                        </span>
                      </div>
                    )}
                    {parseFloat(formData.shipping_fee) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-base-content/60">Livraison :</span>
                        <span className="font-mono">
                          {formaterMontant(formData.shipping_fee)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="divider my-3"></div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Total TTC :</span>
                    <span className="font-mono font-bold text-primary text-base">
                      {formaterMontant(totals.total)}
                    </span>
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
                      Un devis n'affecte <strong>pas le stock</strong>. Il sert
                      uniquement de proposition commerciale jusqu'à sa
                      conversion en vente.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Alerte lignes vides */}
            {formData.lines.length === 0 && (
              <div className="card bg-warning/5 border border-warning/20">
                <div className="card-body p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-medium text-warning mb-1">
                        Aucun article
                      </p>
                      <p className="text-base-content/70">
                        Ajoutez au moins un produit avant de valider le devis.
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
                  <Sparkles className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-success mb-1">Conseil</p>
                    <p className="text-base-content/70">
                      Définissez une <strong>date de validité</strong> réaliste
                      (15-30 jours) pour inciter le client à valider rapidement.
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
              <span className="text-base-content/60">Total TTC : </span>
              <span className="font-mono font-bold text-primary">
                {formaterMontant(totals.total)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/devis')}
              className="btn btn-ghost"
              disabled={chargement}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary gap-2 min-w-[180px]"
              disabled={chargement || formData.lines.length === 0}
            >
              {chargement ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />{' '}
                  {isEdit ? 'Enregistrer' : 'Créer le devis'}
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
const DevisForm = () => (
  <ErrorBoundary>
    <DevisFormContent />
  </ErrorBoundary>
);

export default DevisForm;