// src/components/logistique/EntrepotForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle, Warehouse,
  Building2, MapPin, Phone, Mail, User, Package, Info, Eye,
  FileText, Percent, Power, Trash2, Boxes, Home, Factory, Store
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const EntrepotForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const estEdition = Boolean(id);
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'warehouse',
    address: '',
    city: '',
    country: 'Sénégal',
    phone: '',
    email: '',
    manager: '',
    capacity: '',
    current_occupancy: 0,
    is_active: true,
    notes: '',
  });

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================
  useEffect(() => {
    const init = async () => {
      if (estEdition) {
        await chargerEntrepot();
      } else {
        setChargementInitial(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const chargerEntrepot = async () => {
    setChargementInitial(true);
    try {
      const res = await AxiosInstance.get(`/warehouses/${id}/`);
      const d = res.data;
      setFormData({
        name: d.name || '',
        code: d.code || '',
        type: d.type || 'warehouse',
        address: d.address || '',
        city: d.city || '',
        country: d.country || 'Sénégal',
        phone: d.phone || '',
        email: d.email || '',
        manager: d.manager || '',
        capacity: d.capacity || '',
        current_occupancy: d.current_occupancy || 0,
        is_active: d.is_active !== undefined ? d.is_active : true,
        notes: d.notes || '',
      });
    } catch (err) {
      setErreur("Impossible de charger l'entrepôt");
    } finally {
      setChargementInitial(false);
    }
  };

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const generateCode = () => {
    const prefix = formData.name ? formData.name.substring(0, 3).toUpperCase() : 'WH';
    const randomNum = Math.floor(Math.random() * 1000);
    setFormData((prev) => ({ ...prev, code: `${prefix}${randomNum}` }));
  };

  // ============================================================
  // VALIDATION
  // ============================================================
  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.code.trim()) newErrors.code = 'Le code est requis';
    if (!formData.address.trim()) newErrors.address = "L'adresse est requise";
    if (!formData.city.trim()) newErrors.city = 'La ville est requise';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================================
  // SUBMIT
  // ============================================================
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
      const dataToSend = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity, 10) : null,
      };

      if (estEdition) {
        await AxiosInstance.patch(`/warehouses/${id}/`, dataToSend);
      } else {
        await AxiosInstance.post('/warehouses/', dataToSend);
      }

      setSucces(true);
      setTimeout(() => navigate('/entrepots'), 1200);
    } catch (err) {
      if (err.response?.data) {
        setErrors(err.response.data);
        const list = Object.values(err.response.data).flat();
        setErreur(list.join(', '));
      } else {
        setErreur("Erreur lors de l'enregistrement");
      }
    } finally {
      setChargement(false);
    }
  };

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    try {
      await AxiosInstance.delete(`/warehouses/${id}/`);
      setSucces(true);
      setTimeout(() => navigate('/entrepots'), 1200);
    } catch (err) {
      setErreur('Erreur lors de la suppression');
    }
    setShowDeleteModal(false);
  };

  // ============================================================
  // UTILS
  // ============================================================
  const getTypeLabel = () => {
    switch (formData.type) {
      case 'main': return 'Principal';
      case 'secondary': return 'Secondaire';
      case 'store': return 'Magasin';
      default: return 'Entrepôt';
    }
  };

  const getTypeIcon = () => {
    switch (formData.type) {
      case 'main': return <Building2 className="w-5 h-5" />;
      case 'secondary': return <Factory className="w-5 h-5" />;
      case 'store': return <Store className="w-5 h-5" />;
      default: return <Warehouse className="w-5 h-5" />;
    }
  };

  // Taux d'occupation
  const tauxOccupation =
    formData.capacity && Number(formData.capacity) > 0
      ? (Number(formData.current_occupancy) / Number(formData.capacity)) * 100
      : 0;

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

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">
      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/entrepots')}
            className="btn btn-ghost btn-sm btn-circle"
            type="button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Stocks / Entrepôts / <span className="text-primary">{estEdition ? 'Édition' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <Warehouse className="w-5 h-5 text-primary" />
              {estEdition ? "Modifier l'entrepôt" : 'Nouvel entrepôt'}
            </h1>
          </div>
          {estEdition && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn btn-error btn-sm gap-2"
              type="button"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Supprimer</span>
            </button>
          )}
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Entrepôt {estEdition ? 'modifié' : 'créé'} avec succès !</span>
        </div>
      )}
      {erreur && (
        <div className="w-full alert alert-error rounded-none py-2">
          <AlertCircle className="w-5 h-5" />
          <span>{erreur}</span>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      {showDeleteModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-base-content/70">Voulez-vous vraiment supprimer cet entrepôt ?</p>
              <p className="font-semibold text-error mt-2">{formData.name}</p>
              {formData.current_occupancy > 0 && (
                <p className="text-warning text-sm mt-2 flex items-center justify-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Stock actuel : {formData.current_occupancy} unités
                </p>
              )}
            </div>
            <div className="flex gap-3 p-4 bg-base-200/40">
              <button
                className="btn btn-ghost flex-1"
                onClick={() => setShowDeleteModal(false)}
              >
                Annuler
              </button>
              <button className="btn btn-error flex-1 gap-2" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            </div>
          </div>
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
                  <Building2 className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Informations générales</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Nom <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                        value={formData.name}
                        onChange={handleChange}
                        required
                        maxLength="100"
                        placeholder="Ex : Entrepôt Principal"
                      />
                      {errors.name && <span className="text-error text-xs mt-1">{errors.name}</span>}
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Code <span className="text-error">*</span>
                        </span>
                      </label>
                      <div className="join w-full">
                        <input
                          type="text"
                          name="code"
                          className={`input input-bordered join-item flex-1 font-mono ${errors.code ? 'input-error' : ''}`}
                          value={formData.code}
                          onChange={handleChange}
                          required
                          maxLength="20"
                          placeholder="Ex : WH001"
                        />
                        <button
                          type="button"
                          onClick={generateCode}
                          className="btn btn-outline join-item gap-1"
                          title="Générer automatiquement"
                        >
                          <RefreshCwIcon />
                          <span className="hidden sm:inline">Auto</span>
                        </button>
                      </div>
                      {errors.code && <span className="text-error text-xs mt-1">{errors.code}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Boxes className="w-3 h-3 mr-1 inline" /> Type d'entrepôt
                        </span>
                      </label>
                      <select
                        name="type"
                        className="select select-bordered w-full"
                        value={formData.type}
                        onChange={handleChange}
                      >
                        <option value="main">Principal</option>
                        <option value="secondary">Secondaire</option>
                        <option value="store">Magasin</option>
                        <option value="warehouse">Entrepôt</option>
                      </select>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <User className="w-3 h-3 mr-1 inline" /> Responsable
                        </span>
                      </label>
                      <input
                        type="text"
                        name="manager"
                        className="input input-bordered w-full"
                        value={formData.manager}
                        onChange={handleChange}
                        maxLength="100"
                        placeholder="Nom du responsable"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2 : Adresse */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Adresse</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Adresse complète <span className="text-error">*</span>
                      </span>
                    </label>
                    <textarea
                      name="address"
                      className={`textarea textarea-bordered w-full ${errors.address ? 'textarea-error' : ''}`}
                      value={formData.address}
                      onChange={handleChange}
                      rows="2"
                      required
                      placeholder="Adresse complète de l'entrepôt"
                    ></textarea>
                    {errors.address && <span className="text-error text-xs mt-1">{errors.address}</span>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Ville <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        className={`input input-bordered w-full ${errors.city ? 'input-error' : ''}`}
                        value={formData.city}
                        onChange={handleChange}
                        required
                        maxLength="100"
                        placeholder="Ex : Dakar"
                      />
                      {errors.city && <span className="text-error text-xs mt-1">{errors.city}</span>}
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Home className="w-3 h-3 mr-1 inline" /> Pays
                        </span>
                      </label>
                      <input
                        type="text"
                        name="country"
                        className="input input-bordered w-full"
                        value={formData.country}
                        onChange={handleChange}
                        maxLength="100"
                        placeholder="Ex : Sénégal"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3 : Contact */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Contact</h2>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Téléphone</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="text"
                          name="phone"
                          className="input input-bordered w-full pl-10 font-mono"
                          value={formData.phone}
                          onChange={handleChange}
                          maxLength="20"
                          placeholder="+221 77 123 45 67"
                        />
                      </div>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">Email</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="email"
                          name="email"
                          className="input input-bordered w-full pl-10"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="contact@entrepot.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4 : Capacité */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Capacité et occupation</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Package className="w-3 h-3 mr-1 inline" /> Capacité maximale
                        </span>
                      </label>
                      <input
                        type="number"
                        name="capacity"
                        className="input input-bordered w-full font-mono"
                        value={formData.capacity}
                        onChange={handleChange}
                        min="0"
                        placeholder="Laissez vide pour illimité"
                      />
                      <span className="text-xs text-base-content/40 mt-1">
                        Nombre maximum d'unités stockables
                      </span>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Boxes className="w-3 h-3 mr-1 inline" /> Occupation actuelle
                        </span>
                      </label>
                      <input
                        type="number"
                        name="current_occupancy"
                        className="input input-bordered w-full font-mono bg-base-200/50"
                        value={formData.current_occupancy}
                        onChange={handleChange}
                        readOnly={!estEdition}
                      />
                      <span className="text-xs text-base-content/40 mt-1">
                        Mise à jour automatique
                      </span>
                    </div>
                  </div>

                  {/* Barre de progression du taux d'occupation */}
                  {formData.capacity && Number(formData.capacity) > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-base-content/60 flex items-center gap-1">
                          <Percent className="w-3 h-3" />
                          Taux d'occupation
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            tauxOccupation >= 90
                              ? 'text-error'
                              : tauxOccupation >= 70
                              ? 'text-warning'
                              : 'text-success'
                          }`}
                        >
                          {tauxOccupation.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-base-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            tauxOccupation >= 90
                              ? 'bg-error'
                              : tauxOccupation >= 70
                              ? 'bg-warning'
                              : 'bg-success'
                          }`}
                          style={{ width: `${Math.min(tauxOccupation, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 5 : Statut et notes */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Power className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Statut & Notes</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="form-control w-full">
                    <label className="label cursor-pointer justify-start gap-3 py-1">
                      <input
                        type="checkbox"
                        name="is_active"
                        className="toggle toggle-primary"
                        checked={formData.is_active}
                        onChange={handleChange}
                      />
                      <span className="label-text text-sm font-medium flex items-center gap-2">
                        <Power className="w-4 h-4 text-primary" />
                        {formData.is_active ? 'Entrepôt actif' : 'Entrepôt inactif'}
                      </span>
                    </label>
                    <span className="text-xs text-base-content/40 mt-1 ml-1">
                      {formData.is_active
                        ? 'Cet entrepôt est disponible pour les stocks'
                        : 'Cet entrepôt ne sera pas disponible'}
                    </span>
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        <FileText className="w-3 h-3 mr-1 inline" /> Notes
                      </span>
                    </label>
                    <textarea
                      name="notes"
                      className="textarea textarea-bordered w-full"
                      value={formData.notes}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Informations supplémentaires..."
                    ></textarea>
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
                      {getTypeIcon()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-base-content/50 truncate">
                        {formData.code || 'CODE'}
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {formData.name || "Nom de l'entrepôt"}
                      </p>
                    </div>
                  </div>
                  <div className="divider my-3"></div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Type :</span>
                      <span className="font-medium">{getTypeLabel()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Responsable :</span>
                      <span className="font-medium truncate ml-2 max-w-[140px]">
                        {formData.manager || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Ville :</span>
                      <span className="font-medium truncate ml-2 max-w-[140px]">
                        {formData.city || '—'}
                      </span>
                    </div>
                  </div>
                  <div className="divider my-3"></div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Capacité :</span>
                      <span className="font-mono">
                        {formData.capacity || '∞'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Occupation :</span>
                      <span className="font-mono font-bold">
                        {formData.current_occupancy || 0}
                      </span>
                    </div>
                    {formData.capacity && Number(formData.capacity) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-base-content/60">Taux :</span>
                        <span
                          className={`font-mono font-bold ${
                            tauxOccupation >= 90
                              ? 'text-error'
                              : tauxOccupation >= 70
                              ? 'text-warning'
                              : 'text-success'
                          }`}
                        >
                          {tauxOccupation.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="divider my-3"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-base-content/60">Statut :</span>
                    <span
                      className={`badge badge-sm ${
                        formData.is_active ? 'badge-success' : 'badge-ghost'
                      }`}
                    >
                      {formData.is_active ? 'Actif' : 'Inactif'}
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
                      L'<strong>occupation actuelle</strong> est calculée automatiquement
                      à partir des stocks. La <strong>capacité maximale</strong> vous permet
                      de définir une limite de stockage.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Alerte capacité */}
            {formData.capacity && Number(formData.capacity) > 0 && tauxOccupation >= 90 && (
              <div className="card bg-error/5 border border-error/20">
                <div className="card-body p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-medium text-error mb-1">Capacité critique</p>
                      <p className="text-base-content/70">
                        Cet entrepôt est occupé à <strong>{tauxOccupation.toFixed(1)}%</strong>.
                        Envisagez un transfert ou une extension.
                      </p>
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
              onClick={() => navigate('/entrepots')}
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
                  <Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : "Créer l'entrepôt"}
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
// Petit composant icône RefreshCw pour éviter l'import manquant
// ============================================================
const RefreshCwIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);

export default EntrepotForm;