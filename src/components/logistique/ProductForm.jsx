// src/components/stock/ProductForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Save, X, Package, RefreshCw, ArrowLeft, DollarSign,
  CheckCircle, AlertCircle, Boxes, Clock, AlertTriangle,
  Barcode, Ruler, TrendingUp, TrendingDown, Calendar,
  Wrench, Repeat, Timer, Star, Info
} from 'lucide-react';

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

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
    is_featured: false
  });

  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const loadCategories = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/categories/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setCategories(response.data.filter(c => c.is_active));
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    }
  };

  const loadUnits = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/unit-measures/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setUnits(response.data.filter(u => u.is_active));
    } catch (error) {
      console.error('Erreur chargement unités:', error);
    }
  };

  const loadProduct = async () => {
    if (!isEditMode) {
      setFetching(false);
      return;
    }

    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/products/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const product = response.data;
      setFormData({
        code: product.code || '',
        barcode: product.barcode || '',
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        unit: product.unit || '',
        type: product.type || 'standard',
        purchase_price: product.purchase_price || '',
        selling_price: product.selling_price || '',
        wholesale_price: product.wholesale_price || '',
        promo_price: product.promo_price || '',
        tax_rate: product.tax_rate || 0,
        has_expiry: product.has_expiry || false,
        shelf_life_days: product.shelf_life_days || '',
        alert_days: product.alert_days || 30,
        min_stock: product.min_stock || 0,
        max_stock: product.max_stock || 0,
        reorder_point: product.reorder_point || 0,
        reorder_quantity: product.reorder_quantity || 0,
        status: product.status || 'active',
        is_featured: product.is_featured || false
      });
    } catch (error) {
      console.error('Erreur chargement produit:', error);
      showNotification('Impossible de charger le produit', 'error');
      navigate('/produits');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadCategories();
      await loadUnits();
      await loadProduct();
    };
    init();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const generateCode = () => {
    const prefix = formData.name ? formData.name.substring(0, 3).toUpperCase() : 'PRD';
    const randomNum = Math.floor(Math.random() * 1000);
    const code = `${prefix}${randomNum}`;
    setFormData(prev => ({ ...prev, code }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.code.trim()) newErrors.code = 'Le code est requis';
    if (!formData.purchase_price) newErrors.purchase_price = 'Le prix d\'achat est requis';
    if (!formData.selling_price) newErrors.selling_price = 'Le prix de vente est requis';
    if (formData.has_expiry && !formData.shelf_life_days) {
      newErrors.shelf_life_days = 'La durée de conservation est requise';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const token = getToken();
      const headers = { 'Authorization': `Token ${token}` };

      // Nettoyage complet avant envoi
      const dataToSend = { ...formData };

      // 1. Code-barres → null si vide (NON OBLIGATOIRE)
      if (!dataToSend.barcode || dataToSend.barcode.trim() === '') {
        dataToSend.barcode = null;
      }

      // 2. Champs FK → null si vide
      if (!dataToSend.category) dataToSend.category = null;
      if (!dataToSend.unit) dataToSend.unit = null;

      // 3. Champs numériques optionnels → null si vide
      ['wholesale_price', 'promo_price'].forEach(f => {
        if (dataToSend[f] === '' || dataToSend[f] === null || dataToSend[f] === undefined) {
          dataToSend[f] = null;
        }
      });

      // 4. shelf_life_days → null si pas d'expiration
      if (!dataToSend.has_expiry || dataToSend.shelf_life_days === '') {
        dataToSend.shelf_life_days = null;
      }

      // 5. tax_rate → 0 si vide
      if (dataToSend.tax_rate === '' || dataToSend.tax_rate === null) {
        dataToSend.tax_rate = 0;
      }

      // 6. Champs entiers → 0 si vide
      ['min_stock', 'max_stock', 'reorder_point', 'reorder_quantity', 'alert_days'].forEach(f => {
        if (dataToSend[f] === '' || dataToSend[f] === null || dataToSend[f] === undefined) {
          dataToSend[f] = 0;
        }
      });

      // 7. Description → '' si vide
      if (!dataToSend.description) dataToSend.description = '';

      console.log('Données envoyées:', dataToSend);

      if (isEditMode) {
        await AxiosInstance.patch(`/products/${id}/`, dataToSend, { headers });
        showNotification('Produit modifié avec succès', 'success');
      } else {
        await AxiosInstance.post('/products/', dataToSend, { headers });
        showNotification('Produit créé avec succès', 'success');
      }

      setTimeout(() => navigate('/produits'), 1500);
    } catch (error) {
      console.error('Erreur:', error);
      console.error('Réponse serveur:', error.response?.data);

      if (error.response?.data) {
        const serverErrors = error.response.data;
        setErrors(serverErrors);

        // Message lisible
        let errorMsg = 'Veuillez vérifier les champs';
        if (typeof serverErrors === 'object') {
          const firstKey = Object.keys(serverErrors)[0];
          if (firstKey) {
            const firstError = Array.isArray(serverErrors[firstKey])
              ? serverErrors[firstKey][0]
              : serverErrors[firstKey];
            errorMsg = `${firstKey}: ${firstError}`;
          }
        }
        showNotification(errorMsg, 'error');
      } else {
        showNotification('Une erreur est survenue', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = () => {
    switch (formData.type) {
      case 'consignable': return <Repeat className="w-4 h-4" />;
      case 'expirable': return <Timer className="w-4 h-4" />;
      case 'service': return <Wrench className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-lg rounded-lg`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Conteneur pleine largeur */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/produits')}
              className="btn btn-ghost btn-sm gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {isEditMode ? 'Modifier le produit' : 'Nouveau produit'}
                </h1>
              </div>
              <p className="text-sm text-gray-500 mt-1 ml-11">
                {isEditMode
                  ? 'Modifiez les informations du produit'
                  : 'Créez un nouveau produit dans le catalogue'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* SECTION 1: Informations générales */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                Informations générales
              </h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="text-sm font-medium text-gray-700">
                      Nom du produit <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                    placeholder="Ex: Smartphone XYZ Pro"
                  />
                  {errors.name && (
                    <span className="text-red-500 text-xs mt-1">{errors.name}</span>
                  )}
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="text-sm font-medium text-gray-700">
                      Code produit <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      className={`input input-bordered flex-1 ${errors.code ? 'input-error' : ''}`}
                      placeholder="Ex: PRD001"
                    />
                    <button
                      type="button"
                      onClick={generateCode}
                      className="btn btn-outline"
                      title="Générer un code automatique"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  {errors.code && (
                    <span className="text-red-500 text-xs mt-1">{errors.code}</span>
                  )}
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="text-sm font-medium text-gray-700">
                      Code-barres (EAN-13)
                    </span>
                  </label>
                  <div className="relative">
                    <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleChange}
                      className="input input-bordered w-full pl-10"
                      placeholder="Optionnel"
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="text-sm font-medium text-gray-700">Catégorie</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="text-sm font-medium text-gray-700">
                      Unité de mesure
                    </span>
                  </label>
                  <div className="relative">
                    <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      className="select select-bordered w-full pl-10"
                    >
                      <option value="">Sélectionner une unité</option>
                      {units.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="text-sm font-medium text-gray-700">Type de produit</span>
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    <option value="standard">Standard</option>
                    <option value="consignable">Consignable</option>
                    <option value="expirable">À durée limitée</option>
                    <option value="service">Service</option>
                  </select>
                </div>
              </div>

              <div className="form-control mt-4">
                <label className="label py-1">
                  <span className="text-sm font-medium text-gray-700">Description</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="textarea textarea-bordered w-full"
                  rows="2"
                  placeholder="Description détaillée du produit..."
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Prix et stocks */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Prix et stocks
              </h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Colonne gauche - Prix */}
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                    Prix
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label py-1">
                        <span className="text-sm font-medium text-gray-700">
                          Prix d'achat <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">F</span>
                        <input
                          type="number"
                          name="purchase_price"
                          value={formData.purchase_price}
                          onChange={handleChange}
                          className={`input input-bordered w-full pl-8 ${errors.purchase_price ? 'input-error' : ''}`}
                          placeholder="0"
                        />
                      </div>
                      {errors.purchase_price && (
                        <span className="text-red-500 text-xs mt-1">{errors.purchase_price}</span>
                      )}
                    </div>
                    <div className="form-control">
                      <label className="label py-1">
                        <span className="text-sm font-medium text-gray-700">
                          Prix de vente <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">F</span>
                        <input
                          type="number"
                          name="selling_price"
                          value={formData.selling_price}
                          onChange={handleChange}
                          className={`input input-bordered w-full pl-8 ${errors.selling_price ? 'input-error' : ''}`}
                          placeholder="0"
                        />
                      </div>
                      {errors.selling_price && (
                        <span className="text-red-500 text-xs mt-1">{errors.selling_price}</span>
                      )}
                    </div>
                    <div className="form-control">
                      <label className="label py-1">
                        <span className="text-sm font-medium text-gray-700">Prix de gros</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">F</span>
                        <input
                          type="number"
                          name="wholesale_price"
                          value={formData.wholesale_price}
                          onChange={handleChange}
                          className="input input-bordered w-full pl-8"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="form-control">
                      <label className="label py-1">
                        <span className="text-sm font-medium text-gray-700">Prix promotionnel</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">F</span>
                        <input
                          type="number"
                          name="promo_price"
                          value={formData.promo_price}
                          onChange={handleChange}
                          className="input input-bordered w-full pl-8"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="form-control col-span-2">
                      <label className="label py-1">
                        <span className="text-sm font-medium text-gray-700">Taux de TVA (%)</span>
                      </label>
                      <input
                        type="number"
                        name="tax_rate"
                        value={formData.tax_rate}
                        onChange={handleChange}
                        className="input input-bordered w-full"
                        placeholder="0"
                        step="0.1"
                      />
                    </div>
                  </div>

                  {/* Marge bénéficiaire calculée */}
                  {formData.purchase_price && formData.selling_price && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Marge bénéficiaire</span>
                        <span className="font-medium text-gray-900">
                          {(
                            ((parseFloat(formData.selling_price) - parseFloat(formData.purchase_price)) /
                              parseFloat(formData.purchase_price)) * 100
                          ).toFixed(1)} %
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-gray-500">Bénéfice par unité</span>
                        <span className="font-medium text-green-600">
                          {(
                            parseFloat(formData.selling_price) - parseFloat(formData.purchase_price)
                          ).toFixed(2)} F
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Colonne droite - Seuils de stock */}
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                    Seuils de stock
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label py-1">
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3 text-amber-500" />
                          Stock minimum
                        </span>
                      </label>
                      <input
                        type="number"
                        name="min_stock"
                        value={formData.min_stock}
                        onChange={handleChange}
                        className="input input-bordered w-full"
                        placeholder="0"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label py-1">
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-green-500" />
                          Stock maximum
                        </span>
                      </label>
                      <input
                        type="number"
                        name="max_stock"
                        value={formData.max_stock}
                        onChange={handleChange}
                        className="input input-bordered w-full"
                        placeholder="0"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label py-1">
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-blue-500" />
                          Point de commande
                        </span>
                      </label>
                      <input
                        type="number"
                        name="reorder_point"
                        value={formData.reorder_point}
                        onChange={handleChange}
                        className="input input-bordered w-full"
                        placeholder="0"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label py-1">
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          <Boxes className="w-3 h-3 text-gray-500" />
                          Qté de réappro
                        </span>
                      </label>
                      <input
                        type="number"
                        name="reorder_quantity"
                        value={formData.reorder_quantity}
                        onChange={handleChange}
                        className="input input-bordered w-full"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3 + 4 : Expiration + Statut sur 2 colonnes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Date d'expiration */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Date d'expiration
                </h3>
              </div>
              <div className="p-5">
                <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    name="has_expiry"
                    checked={formData.has_expiry}
                    onChange={handleChange}
                    className="checkbox checkbox-primary checkbox-sm mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700 block">
                      Ce produit a une date d'expiration
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Activez pour définir une durée de conservation
                    </p>
                  </div>
                </label>

                {formData.has_expiry && (
                  <div className="space-y-4 mt-4 pt-4 border-t border-gray-100">
                    <div className="form-control">
                      <label className="label py-1">
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-500" />
                          Durée de conservation (jours)
                        </span>
                      </label>
                      <input
                        type="number"
                        name="shelf_life_days"
                        value={formData.shelf_life_days}
                        onChange={handleChange}
                        className={`input input-bordered w-full ${errors.shelf_life_days ? 'input-error' : ''}`}
                        placeholder="Ex: 365"
                      />
                      {errors.shelf_life_days && (
                        <span className="text-red-500 text-xs mt-1">{errors.shelf_life_days}</span>
                      )}
                    </div>
                    <div className="form-control">
                      <label className="label py-1">
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          Jours d'alerte avant expiration
                        </span>
                      </label>
                      <input
                        type="number"
                        name="alert_days"
                        value={formData.alert_days}
                        onChange={handleChange}
                        className="input input-bordered w-full"
                        placeholder="30"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Une alerte sera déclenchée X jours avant l'expiration
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Statut */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-primary" />
                  Statut et visibilité
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="text-sm font-medium text-gray-700">Statut du produit</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                  >
                    <option value="active">Actif - Visible dans le catalogue</option>
                    <option value="inactive">Inactif - Masqué du catalogue</option>
                  </select>
                </div>
                <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-200">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleChange}
                    className="checkbox checkbox-primary checkbox-sm mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500" />
                      Produit vedette
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Mis en avant sur la page d'accueil
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/produits')}
              className="btn btn-ghost gap-2"
              disabled={loading}
            >
              <X className="w-4 h-4" />
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary gap-2 min-w-[130px]"
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditMode ? 'Enregistrer' : 'Créer'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;