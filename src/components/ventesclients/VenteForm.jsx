// src/components/ventes/VenteForm.jsx
// ============================================================
// VERSION PROFESSIONNELLE - Style AssuranceForm
// ============================================================

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle, ShoppingCart,
  User, Building2, Calendar, Package, Plus, Trash2, Info, Eye,
  DollarSign, Percent, Truck, FileText, Calculator, Box, Sparkles,
  AlertTriangle, X, Tag, Layers, CreditCard, Banknote, Wallet,
  Landmark, Smartphone,
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
    console.error('ErrorBoundary VenteForm:', error, errorInfo);
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
                onClick={() => window.location.href = '/ventes'}
                className="btn btn-ghost"
              >
                Retour aux ventes
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
// MÉTHODES DE PAIEMENT
// ============================================================
const PAYMENT_METHODS = [
  { value: 'cash', label: 'Espèces', icon: Banknote },
  { value: 'card', label: 'Carte', icon: CreditCard },
  { value: 'check', label: 'Chèque', icon: FileText },
  { value: 'transfer', label: 'Virement', icon: Landmark },
  { value: 'mobile_money', label: 'Mobile', icon: Smartphone },
  { value: 'credit', label: 'Crédit', icon: Wallet },
];

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const VenteFormContent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // États
  const [chargementInitial, setChargementInitial] = useState(true);
  const [chargementVente, setChargementVente] = useState(false);
  const [chargementLots, setChargementLots] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  // Données
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [lots, setLots] = useState([]);

  // Formulaire
  const [formData, setFormData] = useState({
    client: '',
    warehouse: '',
    payment_due_date: '',
    discount_type: 'percentage',
    discount_value: 0,
    tax_rate: 0,
    shipping_fee: 0,
    payment_method: '',
    delivery_method: '',
    delivery_address: '',
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
    price_type: 'detail',
    lot: null,
  });

  const getToken = () => localStorage.getItem('Token');

  const normalize = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  };

  // ============================================================
  // CHARGEMENT INITIAL OPTIMISÉ
  // ============================================================
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const token = getToken();
    if (!token) {
      navigate('/login');
      return () => controller.abort();
    }

    const config = {
      headers: { Authorization: `Token ${token}` },
      signal: controller.signal,
    };

    const loadData = async () => {
      setChargementInitial(true);
      setErreur(null);

      // Les données indépendantes sont chargées en parallèle.
      const requests = [
        AxiosInstance.get('/warehouses/?active=true&page_size=200', config),
        AxiosInstance.get('/clients/?page_size=1000', config),
        AxiosInstance.get('/products/brief/', config),
      ];

      if (isEdit) {
        setChargementVente(true);
        requests.push(AxiosInstance.get(`/sales/${id}/`, config));
      }

      try {
        const results = await Promise.allSettled(requests);
        if (!isMounted) return;

        const [whResult, clResult, prResult] = results;

        if (whResult.status === 'fulfilled') {
          const whData = normalize(whResult.value.data);
          setWarehouses(whData);

          if (whData.length === 1 && !isEdit) {
            setFormData((prev) => ({ ...prev, warehouse: whData[0].id }));
          }
        } else {
          setWarehouses([]);
        }

        if (clResult.status === 'fulfilled') {
          setClients(normalize(clResult.value.data));
        } else {
          setClients([]);
        }

        // Le point d'accès brief est privilégié pour éviter de charger
        // toutes les informations détaillées des produits.
        if (prResult.status === 'fulfilled') {
          setProducts(normalize(prResult.value.data));
        } else {
          try {
            const fallback = await AxiosInstance.get(
              '/products/?status=active&page_size=500',
              config
            );
            if (isMounted) setProducts(normalize(fallback.data));
          } catch (error) {
            if (isMounted && error.code !== 'ERR_CANCELED') setProducts([]);
          }
        }

        if (isEdit) {
          const saleResult = results[3];

          if (saleResult.status === 'fulfilled') {
            const d = saleResult.value.data || {};

            setFormData({
              client: d.client?.id || d.client_id || d.client || '',
              warehouse: d.warehouse?.id || d.warehouse_id || d.warehouse || '',
              payment_due_date: d.payment_due_date || '',
              discount_type: d.discount_type || 'percentage',
              discount_value: parseFloat(d.discount_value) || 0,
              tax_rate: parseFloat(d.tax_rate) || 0,
              shipping_fee: parseFloat(d.shipping_fee) || 0,
              payment_method: d.payment_method || '',
              delivery_method: d.delivery_method || '',
              delivery_address: d.delivery_address || '',
              notes: d.notes || '',
              internal_notes: d.internal_notes || '',
              lines: (d.lines || d.items || []).map((line) => ({
                id: line.id,
                product: line.product?.id || line.product_id || line.product,
                product_name: line.product_name || line.product?.name || '',
                product_code: line.product_code || line.product?.code || '',
                lot: line.lot?.id || line.lot_id || line.lot || null,
                lot_number: line.lot_number || line.lot?.lot_number || '',
                quantity: line.quantity || 1,
                unit_price: parseFloat(line.unit_price) || 0,
                discount: parseFloat(line.discount) || 0,
                tax_rate: parseFloat(line.tax_rate) || 0,
                total: parseFloat(line.total) || 0,
                price_type: line.price_type || 'detail',
              })),
            });
          } else {
            const error = saleResult.reason;
            if (error?.response?.status === 401) {
              navigate('/login');
            } else if (error?.response?.status === 404) {
              setErreur('Vente non trouvée');
              setTimeout(() => navigate('/ventes'), 1500);
            } else {
              setErreur('Impossible de charger les informations de la vente.');
            }
          }
        }

        // Signaler les erreurs de données indispensables sans bloquer
        // l'affichage du formulaire si une liste secondaire échoue.
        if (
          whResult.status === 'rejected' &&
          clResult.status === 'rejected' &&
          prResult.status === 'rejected'
        ) {
          setErreur('Impossible de charger les données. Vérifiez votre connexion.');
        }
      } catch (error) {
        if (isMounted && error.code !== 'ERR_CANCELED') {
          if (error.response?.status === 401) navigate('/login');
          else setErreur('Erreur lors du chargement du formulaire.');
        }
      } finally {
        if (isMounted) {
          setChargementInitial(false);
          setChargementVente(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [id, isEdit, navigate]);

  // ============================================================
  // CHARGEMENT DES LOTS
  // ============================================================
  useEffect(() => {
    let isMounted = true;
    if (!formData.warehouse) {
      setLots([]);
      return;
    }

    const fetchLots = async () => {
      setChargementLots(true);
      try {
        const token = getToken();
        const res = await AxiosInstance.get(
          `/lots/?warehouse=${formData.warehouse}&page_size=500`,
          { headers: { Authorization: `Token ${token}` } }
        );
        if (!isMounted) return;
        setLots(normalize(res.data));
      } catch {
        if (isMounted) setLots([]);
      } finally {
        if (isMounted) setChargementLots(false);
      }
    };

    fetchLots();
    return () => { isMounted = false; };
  }, [formData.warehouse]);

  // ============================================================
  // CALCUL DES TOTAUX
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
  // HELPERS PRODUITS
  // ============================================================
  const getProductById = useCallback(
    (productId) => {
      if (!productId) return null;
      const idNum = parseInt(productId, 10);
      return products.find((p) => p.id === idNum) || null;
    },
    [products]
  );

  const getProductPrices = useCallback(
    (productId) => {
      const product = getProductById(productId);
      if (!product) return { selling_price: 0, wholesale_price: 0 };
      return {
        selling_price: parseFloat(product.selling_price) || 0,
        wholesale_price: parseFloat(product.wholesale_price) || 0,
      };
    },
    [getProductById]
  );

  const getPriceByType = useCallback(
    (productId, priceType) => {
      const prices = getProductPrices(productId);
      if (priceType === 'gros') {
        return prices.wholesale_price > 0
          ? prices.wholesale_price
          : prices.selling_price;
      }
      return prices.selling_price;
    },
    [getProductPrices]
  );

  const hasWholesalePrice = useCallback(
    (productId) => getProductPrices(productId).wholesale_price > 0,
    [getProductPrices]
  );

  // ============================================================
  // HELPERS LOTS
  // ============================================================
  const getAvailableLotsForProduct = useCallback(
    (productId) => {
      if (!productId || !formData.warehouse) return [];
      const idNum = parseInt(productId, 10);
      return (lots || []).filter(
        (lot) =>
          lot.product === idNum &&
          (parseFloat(lot.available_quantity) || 0) > 0
      );
    },
    [lots, formData.warehouse]
  );

  const getBestLotForProduct = useCallback(
    (productId, quantity) => {
      const availableLots = getAvailableLotsForProduct(productId);
      if (availableLots.length === 0) return null;

      const sortedLots = [...availableLots].sort((a, b) => {
        if (a.expiry_date && b.expiry_date) {
          return new Date(a.expiry_date) - new Date(b.expiry_date);
        }
        if (a.expiry_date) return -1;
        if (b.expiry_date) return 1;
        return a.id - b.id;
      });

      for (const lot of sortedLots) {
        if ((parseFloat(lot.available_quantity) || 0) >= quantity) return lot;
      }

      return sortedLots.reduce((best, current) =>
        (parseFloat(current.available_quantity) || 0) >
        (parseFloat(best.available_quantity) || 0)
          ? current
          : best
      );
    },
    [getAvailableLotsForProduct]
  );

  const checkStockAvailability = useCallback(
    (productId, quantity) => {
      const product = getProductById(productId);
      if (!product) return { available: false, message: 'Produit non trouvé' };

      const availableStock = parseFloat(product.current_stock) || 0;
      if (availableStock < quantity) {
        return {
          available: false,
          message: `Stock insuffisant pour ${product.name}. Disponible : ${availableStock}, Demandé : ${quantity}`,
        };
      }
      return { available: true };
    },
    [getProductById]
  );

  // ============================================================
  // HANDLERS FORMULAIRE
  // ============================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLineFormChange = (field, value) => {
    setLineForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleProductSelect = (productId) => {
    const idNum = productId ? parseInt(productId, 10) : null;
    let defaultPrice = 0;
    let lotId = null;

    if (idNum) {
      defaultPrice = getPriceByType(idNum, lineForm.price_type);
      const bestLot = getBestLotForProduct(idNum, lineForm.quantity || 1);
      if (bestLot) lotId = bestLot.id;
    }

    setLineForm((prev) => ({
      ...prev,
      product: productId,
      unit_price: defaultPrice,
      lot: lotId,
    }));
  };

  const handlePriceTypeChange = (type) => {
    const productId = lineForm.product ? parseInt(lineForm.product, 10) : null;
    let newUnitPrice = lineForm.unit_price;
    if (productId) newUnitPrice = getPriceByType(productId, type);
    setLineForm((prev) => ({ ...prev, price_type: type, unit_price: newUnitPrice }));
  };

  // ============================================================
  // AJOUT D'UNE LIGNE
  // ============================================================
  const addLine = () => {
    if (!lineForm.product) {
      setErreur('Sélectionnez un produit');
      return;
    }

    const quantity = parseInt(lineForm.quantity, 10) || 0;
    if (quantity <= 0) {
      setErreur('La quantité doit être supérieure à 0');
      return;
    }

    const productId = parseInt(lineForm.product, 10);
    const product = getProductById(productId);
    if (!product) {
      setErreur('Produit non trouvé');
      return;
    }

    const stockCheck = checkStockAvailability(productId, quantity);
    if (!stockCheck.available) {
      setErreur(stockCheck.message);
      return;
    }

    if (formData.lines.some((l) => parseInt(l.product, 10) === productId)) {
      setErreur(`Le produit "${product.name}" est déjà dans la liste`);
      return;
    }

    let lotId = lineForm.lot;
    let lotNumber = '';
    if (!lotId) {
      const bestLot = getBestLotForProduct(productId, quantity);
      lotId = bestLot?.id || null;
      lotNumber = bestLot?.lot_number || '';
    } else {
      const selectedLot = lots.find((l) => l.id === parseInt(lotId, 10));
      lotNumber = selectedLot?.lot_number || '';
    }

    const priceType = lineForm.price_type || 'detail';
    let unitPrice = parseFloat(lineForm.unit_price) || 0;
    if (unitPrice <= 0) unitPrice = getPriceByType(productId, priceType);
    if (unitPrice <= 0) {
      setErreur('Le prix unitaire doit être supérieur à 0');
      return;
    }

    if (priceType === 'gros' && !hasWholesalePrice(productId)) {
      unitPrice = getPriceByType(productId, 'detail');
    }

    const discount = parseFloat(lineForm.discount) || 0;
    const taxRate = parseFloat(lineForm.tax_rate) || 0;
    const total = quantity * unitPrice - discount;

    setFormData((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          product: productId,
          product_name: product.name || 'Produit',
          product_code: product.code || '',
          lot: lotId,
          lot_number: lotNumber,
          quantity,
          unit_price: unitPrice,
          discount,
          tax_rate: taxRate,
          total,
          price_type: priceType,
        },
      ],
    }));

    setLineForm({
      product: '',
      quantity: 1,
      unit_price: 0,
      discount: 0,
      tax_rate: 0,
      price_type: 'detail',
      lot: null,
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
    const line = { ...newLines[index] };

    if (['quantity', 'unit_price', 'discount'].includes(field)) {
      const newValue = parseFloat(value) || 0;
      line[field] = newValue;
      line.total =
        (parseFloat(line.quantity) || 0) * (parseFloat(line.unit_price) || 0) -
        (parseFloat(line.discount) || 0);

      if (field === 'quantity') {
        const availableLots = getAvailableLotsForProduct(line.product);
        const currentLot = availableLots.find((l) => l.id === line.lot);
        if (
          !currentLot ||
          (parseFloat(currentLot.available_quantity) || 0) < newValue
        ) {
          const bestLot = getBestLotForProduct(line.product, newValue);
          if (bestLot) {
            line.lot = bestLot.id;
            line.lot_number = bestLot.lot_number || '';
          }
        }
      }
    } else {
      line[field] = value;
    }

    newLines[index] = line;
    setFormData((prev) => ({ ...prev, lines: newLines }));
  };

  const updateLinePriceType = (index, newPriceType) => {
    const newLines = [...formData.lines];
    const line = { ...newLines[index] };
    const prices = getProductPrices(line.product);

    if (newPriceType === 'gros' && prices.wholesale_price <= 0) {
      setErreur('Ce produit n\'a pas de prix de gros');
      setTimeout(() => setErreur(null), 3000);
      return;
    }

    line.price_type = newPriceType;
    line.unit_price =
      newPriceType === 'gros' ? prices.wholesale_price : prices.selling_price;
    line.total =
      (parseFloat(line.quantity) || 0) * line.unit_price -
      (parseFloat(line.discount) || 0);

    newLines[index] = line;
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

    if (!formData.warehouse) {
      setErreur('Sélectionnez un entrepôt');
      return;
    }
    if (!formData.lines || formData.lines.length === 0) {
      setErreur('Ajoutez au moins un produit');
      return;
    }
    for (const line of formData.lines) {
      const stockCheck = checkStockAvailability(line.product, line.quantity);
      if (!stockCheck.available) {
        setErreur(stockCheck.message);
        return;
      }
    }

    let paymentDueDate = formData.payment_due_date;
    if (!paymentDueDate) {
      const today = new Date();
      today.setDate(today.getDate() + 30);
      paymentDueDate = today.toISOString().split('T')[0];
    }

    setChargement(true);

    try {
      const token = getToken();
      const headers = { Authorization: `Token ${token}` };

      const dataToSend = {
        client: formData.client || null,
        warehouse: formData.warehouse,
        payment_due_date: paymentDueDate,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value) || 0,
        tax_rate: parseFloat(formData.tax_rate) || 0,
        shipping_fee: parseFloat(formData.shipping_fee) || 0,
        payment_method: formData.payment_method || 'credit',
        delivery_method: formData.delivery_method || 'retrait',
        delivery_address: formData.delivery_address || '',
        notes: formData.notes || '',
        internal_notes: formData.internal_notes || '',
        lines: formData.lines.map((line) => ({
          product: line.product,
          lot: line.lot || null,
          quantity: parseInt(line.quantity, 10),
          unit_price: parseFloat(line.unit_price),
          discount: parseFloat(line.discount) || 0,
          tax_rate: parseFloat(line.tax_rate) || 0,
          price_type: line.price_type || 'detail',
        })),
      };

      let response;
      if (isEdit) {
        response = await AxiosInstance.put(`/sales/${id}/`, dataToSend, { headers });
      } else {
        response = await AxiosInstance.post('/sales/', dataToSend, { headers });
      }

      setSucces(true);
      setTimeout(() => navigate(`/ventes/${response.data.id}`), 1200);
    } catch (err) {
      let msg = 'Erreur lors de la sauvegarde';
      if (err.response?.data) {
        const data = err.response.data;
        if (data.lines && Array.isArray(data.lines)) msg = data.lines[0];
        else if (data.detail) msg = data.detail;
        else if (typeof data === 'object') {
          const first = Object.values(data).flat()[0];
          if (first) msg = String(first);
        } else if (typeof data === 'string') msg = data;
      }
      setErreur(msg);
    } finally {
      setChargement(false);
    }
  };

  // ============================================================
  // HELPERS AFFICHAGE
  // ============================================================
  const formaterMontant = (n) =>
    new Intl.NumberFormat('fr-FR').format(Math.round(Number(n || 0))) + ' CFA';

  const getClientName = (clId) => {
    const cl = clients.find((c) => String(c.id) === String(clId));
    return cl ? `${cl.name} (${cl.code})` : '—';
  };

  const getWarehouseName = (whId) => {
    const wh = warehouses.find((w) => String(w.id) === String(whId));
    return wh ? `${wh.name} (${wh.code})` : '—';
  };

  const totalArticles = formData.lines.reduce(
    (sum, l) => sum + (parseInt(l.quantity, 10) || 0),
    0
  );

  const selectedProduct = lineForm.product ? getProductById(lineForm.product) : null;
  const availableLotsInfo = selectedProduct
    ? getAvailableLotsForProduct(selectedProduct.id)
    : [];
  const totalLotsStock = availableLotsInfo.reduce(
    (sum, lot) => sum + (parseFloat(lot.available_quantity) || 0),
    0
  );

  // ============================================================
  // LOADER INITIAL
  // ============================================================
  if (chargementInitial || chargementVente) {
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
            onClick={() => navigate('/ventes')}
            className="btn btn-ghost btn-sm btn-circle"
            type="button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Ventes / <span className="text-primary">{isEdit ? 'Édition' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <ShoppingCart className="w-5 h-5 text-primary" />
              {isEdit ? 'Modifier la vente' : 'Nouvelle vente'}
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
          <span>Vente {isEdit ? 'modifiée' : 'créée'} avec succès !</span>
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
                  <FileText className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Informations générales</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <User className="w-3 h-3 mr-1 inline" /> Client
                        </span>
                      </label>
                      <select
                        name="client"
                        className="select select-bordered w-full"
                        value={formData.client}
                        onChange={handleChange}
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
                          <Calendar className="w-3 h-3 mr-1 inline" /> Date
                          d'échéance
                        </span>
                      </label>
                      <input
                        type="date"
                        name="payment_due_date"
                        className="input input-bordered w-full"
                        value={formData.payment_due_date}
                        onChange={handleChange}
                      />
                      <span className="text-xs text-base-content/40 mt-1">
                        Par défaut : 30 jours
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2 : Produits */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold text-sm">
                      Produits
                      <span className="text-xs text-base-content/50 ml-2 font-normal">
                        ({formData.lines.length} article{formData.lines.length > 1 ? 's' : ''})
                      </span>
                    </h2>
                    {chargementLots && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    )}
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {/* Info produit sélectionné */}
                  {selectedProduct && (
                    <div className="alert alert-info py-2">
                      <Info className="w-4 h-4" />
                      <div className="text-xs flex flex-wrap gap-x-4 gap-y-1">
                        <span>
                          <strong>Stock :</strong>{' '}
                          <span
                            className={`font-mono font-bold ${
                              (selectedProduct.current_stock || 0) > 0
                                ? 'text-success'
                                : 'text-error'
                            }`}
                          >
                            {selectedProduct.current_stock || 0}
                          </span>
                        </span>
                        <span>
                          <strong>Lots :</strong>{' '}
                          <span className="font-mono">
                            {availableLotsInfo.length} ({totalLotsStock} u.)
                          </span>
                        </span>
                      </div>
                    </div>
                  )}

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
                          <option value="">— Choisir ({products.length}) —</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.code})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-1 md:col-span-1 form-control">
                        <label className="label py-0 pb-1">
                          <span className="label-text text-xs font-medium">Qté</span>
                        </label>
                        <input
                          type="number"
                          className="input input-bordered input-sm w-full font-mono"
                          value={lineForm.quantity}
                          onChange={(e) =>
                            handleLineFormChange(
                              'quantity',
                              parseInt(e.target.value, 10) || 1
                            )
                          }
                          min="1"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2 form-control">
                        <label className="label py-0 pb-1">
                          <span className="label-text text-xs font-medium">Type prix</span>
                        </label>
                        <select
                          className="select select-bordered select-sm w-full"
                          value={lineForm.price_type}
                          onChange={(e) => handlePriceTypeChange(e.target.value)}
                        >
                          <option value="detail">Détail</option>
                          <option value="gros">Gros</option>
                        </select>
                      </div>
                      <div className="col-span-1 md:col-span-2 form-control">
                        <label className="label py-0 pb-1">
                          <span className="label-text text-xs font-medium">Prix</span>
                        </label>
                        <input
                          type="number"
                          className="input input-bordered input-sm w-full font-mono"
                          value={lineForm.unit_price}
                          onChange={(e) =>
                            handleLineFormChange(
                              'unit_price',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          step="0.01"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-1 form-control">
                        <label className="label py-0 pb-1">
                          <span className="label-text text-xs font-medium">Rem.</span>
                        </label>
                        <input
                          type="number"
                          className="input input-bordered input-sm w-full font-mono"
                          value={lineForm.discount}
                          onChange={(e) =>
                            handleLineFormChange(
                              'discount',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          step="0.01"
                        />
                      </div>
                      <div className="col-span-2 md:col-span-2">
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

                  {/* Tableau des lignes */}
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
                            <th>Produit</th>
                            <th className="text-center w-20">Lot</th>
                            <th className="text-center w-20">Type</th>
                            <th className="text-center w-16">Qté</th>
                            <th className="text-right w-24">Prix</th>
                            <th className="text-right w-20">Rem.</th>
                            <th className="text-right w-28">Total</th>
                            <th className="w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.lines.map((line, index) => (
                            <tr key={index} className="border-b border-base-200">
                              <td>
                                <p className="font-medium text-sm">
                                  {line.product_name}
                                </p>
                                <p className="text-xs text-base-content/40 font-mono">
                                  {line.product_code}
                                </p>
                              </td>
                              <td className="text-center text-xs font-mono text-base-content/60">
                                {line.lot_number || '—'}
                              </td>
                              <td className="text-center">
                                <button
                                  type="button"
                                  className={`badge badge-sm cursor-pointer ${
                                    line.price_type === 'gros'
                                      ? 'badge-primary'
                                      : 'badge-ghost'
                                  }`}
                                  onClick={() =>
                                    updateLinePriceType(
                                      index,
                                      line.price_type === 'gros' ? 'detail' : 'gros'
                                    )
                                  }
                                >
                                  {line.price_type === 'gros' ? 'Gros' : 'Détail'}
                                </button>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="input input-bordered input-xs w-full font-mono text-center"
                                  value={line.quantity}
                                  onChange={(e) =>
                                    updateLine(index, 'quantity', e.target.value)
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
                                    updateLine(index, 'unit_price', e.target.value)
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
                                    updateLine(index, 'discount', e.target.value)
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
                                  onClick={() => removeLine(index)}
                                  className="btn btn-ghost btn-xs btn-circle text-error"
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
                        <span className="label-text text-sm font-medium">Type remise</span>
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

            {/* SECTION 4 : Livraison & Paiement */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Livraison et paiement</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Méthode de livraison
                        </span>
                      </label>
                      <select
                        name="delivery_method"
                        className="select select-bordered w-full"
                        value={formData.delivery_method}
                        onChange={handleChange}
                      >
                        <option value="">— Sélectionner —</option>
                        <option value="retrait">Retrait en magasin</option>
                        <option value="livraison">Livraison à domicile</option>
                        <option value="transporteur">Transporteur</option>
                      </select>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Adresse de livraison
                        </span>
                      </label>
                      <input
                        type="text"
                        name="delivery_address"
                        className="input input-bordered w-full"
                        value={formData.delivery_address}
                        onChange={handleChange}
                        maxLength="300"
                        placeholder="Adresse complète"
                      />
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        <CreditCard className="w-3 h-3 mr-1 inline" /> Méthode
                        de paiement
                      </span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {PAYMENT_METHODS.map((method) => {
                        const Icon = method.icon;
                        const isSelected = formData.payment_method === method.value;
                        return (
                          <button
                            key={method.value}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                payment_method: method.value,
                              }))
                            }
                            className={`flex items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-base-300 hover:border-base-content/30 text-base-content/60'
                            }`}
                          >
                            <Icon
                              className={`w-4 h-4 ${
                                isSelected ? 'text-primary' : 'text-base-content/40'
                              }`}
                            />
                            <span className="truncate">{method.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 5 : Notes */}
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
                        Notes (visibles sur la vente)
                      </span>
                    </label>
                    <textarea
                      name="notes"
                      className="textarea textarea-bordered w-full"
                      value={formData.notes}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Notes sur la vente..."
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
                      placeholder="Notes pour usage interne..."
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
                      <ShoppingCart className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-base-content/50 truncate">
                        {isEdit ? `VENTE #${id}` : 'NOUVELLE VENTE'}
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {getClientName(formData.client)}
                      </p>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Entrepôt :</span>
                      <span className="font-medium truncate ml-2 max-w-[140px]">
                        {getWarehouseName(formData.warehouse)}
                      </span>
                    </div>
                    {formData.payment_due_date && (
                      <div className="flex justify-between">
                        <span className="text-base-content/60">Échéance :</span>
                        <span className="font-mono text-xs">
                          {new Date(formData.payment_due_date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Articles :</span>
                      <span className="font-mono font-bold">
                        {formData.lines.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Quantité :</span>
                      <span className="font-mono font-bold">{totalArticles}</span>
                    </div>
                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Sous-total :</span>
                      <span className="font-mono">{formaterMontant(totals.subtotal)}</span>
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
                        <span className="font-mono">{formaterMontant(totals.totalTax)}</span>
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
                      Le stock est <strong>débité automatiquement</strong> à la
                      création de la vente. Les lots les plus proches de
                      l'expiration sont utilisés en priorité (FIFO).
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
                      <p className="font-medium text-warning mb-1">Aucun article</p>
                      <p className="text-base-content/70">
                        Ajoutez au moins un produit avant de valider la vente.
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
                      Utilisez le <strong>prix de gros</strong> pour les
                      revendeurs et le <strong>prix de détail</strong> pour les
                      particuliers.
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
              onClick={() => navigate('/ventes')}
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
                  {isEdit ? 'Enregistrer' : 'Créer la vente'}
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
const VenteForm = () => (
  <ErrorBoundary>
    <VenteFormContent />
  </ErrorBoundary>
);

export default VenteForm;