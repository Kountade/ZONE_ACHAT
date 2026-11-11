// src/components/BrandForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle, Building2,
  Globe, FileText, Info, Eye, Upload, Image as ImageIcon,
  Trash2, Power, Link2, X, Star, Sparkles
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const BrandForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const estEdition = Boolean(id);
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);
  const [errors, setErrors] = useState({});
  const [dragActive, setDragActive] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo: null,
    website: '',
    is_active: true,
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState(null);

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================
  useEffect(() => {
    const init = async () => {
      if (estEdition) {
        await chargerMarque();
      } else {
        setChargementInitial(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const chargerMarque = async () => {
    setChargementInitial(true);
    try {
      const res = await AxiosInstance.get(`/brands/${id}/`);
      const d = res.data;
      setFormData({
        name: d.name || '',
        description: d.description || '',
        logo: null,
        website: d.website || '',
        is_active: d.is_active !== undefined ? d.is_active : true,
      });
      if (d.logo) {
        setExistingLogoUrl(d.logo);
        setLogoPreview(d.logo);
      }
    } catch (err) {
      setErreur('Impossible de charger la marque');
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

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // ============================================================
  // DRAG & DROP LOGO
  // ============================================================
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const handleFile = (file) => {
    if (!file.type.match('image.*')) {
      setErreur('Veuillez sélectionner une image (JPG, PNG, GIF, WebP)');
      setTimeout(() => setErreur(null), 3000);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErreur("L'image ne doit pas dépasser 5 MB");
      setTimeout(() => setErreur(null), 3000);
      return;
    }
    setFormData((prev) => ({ ...prev, logo: file }));
    setLogoPreview(URL.createObjectURL(file));
    setExistingLogoUrl(null);
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logo: null }));
    setLogoPreview(null);
    setExistingLogoUrl(null);
  };

  // ============================================================
  // VALIDATION
  // ============================================================
  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom de la marque est obligatoire';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Le nom ne doit pas dépasser 100 caractères';
    }

    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Veuillez entrer une URL valide (ex : https://www.exemple.com)';
    }

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
      const payload = new FormData();
      payload.append('name', formData.name.trim());
      if (formData.description) payload.append('description', formData.description.trim());
      if (formData.website) payload.append('website', formData.website.trim());
      payload.append('is_active', formData.is_active);

      if (formData.logo instanceof File) {
        payload.append('logo', formData.logo);
      } else if (estEdition && !existingLogoUrl && !formData.logo) {
        payload.append('logo', '');
      }

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (estEdition) {
        await AxiosInstance.put(`/brands/${id}/`, payload, config);
      } else {
        await AxiosInstance.post('/brands/', payload, config);
      }

      setSucces(true);
      setTimeout(() => navigate('/brands'), 1200);
    } catch (err) {
      if (err.response?.data) {
        let errorMsg = '';
        if (typeof err.response.data === 'object') {
          errorMsg = Object.entries(err.response.data)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join(' | ');
        } else {
          errorMsg = err.response.data;
        }
        setErreur(errorMsg);
      } else {
        setErreur("Erreur lors de l'enregistrement");
      }
    } finally {
      setChargement(false);
    }
  };

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
            onClick={() => navigate('/brands')}
            className="btn btn-ghost btn-sm btn-circle"
            type="button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Produits / Marques / <span className="text-primary">{estEdition ? 'Édition' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <Building2 className="w-5 h-5 text-primary" />
              {estEdition ? 'Modifier la marque' : 'Nouvelle marque'}
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
          <span>Marque {estEdition ? 'modifiée' : 'créée'} avec succès !</span>
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
                  <Building2 className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Informations générales</h2>
                </div>
                <div className="p-5 space-y-5">
                  {/* Nom */}
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Nom de la marque <span className="text-error">*</span>
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
                      placeholder="Ex : Apple, Samsung, Nike..."
                      autoFocus
                    />
                    {errors.name ? (
                      <span className="text-error text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.name}
                      </span>
                    ) : (
                      <span className="text-xs text-base-content/40 mt-1">
                        Le nom doit être unique et reconnaissable
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        <FileText className="w-3 h-3 mr-1 inline" /> Description
                        <span className="text-xs text-base-content/40 ml-1">(optionnel)</span>
                      </span>
                    </label>
                    <textarea
                      name="description"
                      className="textarea textarea-bordered w-full"
                      value={formData.description}
                      onChange={handleChange}
                      rows="4"
                      maxLength="500"
                      placeholder="Décrivez la marque, son histoire, ses valeurs..."
                    ></textarea>
                    <span className="text-xs text-base-content/40 mt-1 text-right">
                      {formData.description.length} / 500 caractères
                    </span>
                  </div>

                  {/* Site web */}
                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        <Globe className="w-3 h-3 mr-1 inline" /> Site web
                        <span className="text-xs text-base-content/40 ml-1">(optionnel)</span>
                      </span>
                    </label>
                    <div className="relative">
                      <Link2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                      <input
                        type="url"
                        name="website"
                        className={`input input-bordered w-full pl-10 ${errors.website ? 'input-error' : ''}`}
                        value={formData.website}
                        onChange={handleChange}
                        maxLength="200"
                        placeholder="https://www.exemple.com"
                      />
                    </div>
                    {errors.website ? (
                      <span className="text-error text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.website}
                      </span>
                    ) : (
                      <span className="text-xs text-base-content/40 mt-1">
                        L'URL complète du site officiel de la marque
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2 : Statut */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Power className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Statut & visibilité</h2>
                </div>
                <div className="p-5">
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
                        {formData.is_active ? 'Marque active' : 'Marque inactive'}
                      </span>
                    </label>
                    <span className="text-xs text-base-content/40 mt-1 ml-1">
                      {formData.is_active
                        ? 'Cette marque sera disponible dans les sélections'
                        : "Cette marque n'apparaîtra pas dans les sélections"}
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
                    <p className="font-medium text-info mb-1">Information</p>
                    <p className="text-base-content/70">
                      Les marques permettent d'organiser vos produits et d'améliorer la recherche.
                      Une bonne description et un logo professionnel renforcent la crédibilité de votre catalogue.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* COLONNE APERÇU + LOGO (1/3) */}
          {/* ============================================================ */}
          <div className="lg:col-span-1 space-y-6">
            {/* Card upload logo */}
            <div className="card bg-base-100 shadow-sm border border-base-300 sticky top-20">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Logo de la marque</h2>
                </div>
                <div className="p-5">
                  {/* Zone drop */}
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
                      dragActive
                        ? 'border-primary bg-primary/5 scale-[1.02]'
                        : 'border-base-300 hover:border-primary/50 bg-base-200/30'
                    } ${logoPreview ? 'pb-4' : 'py-8'}`}
                  >
                    {logoPreview ? (
                      <div className="space-y-4">
                        <div className="relative">
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="w-full h-40 object-contain rounded-lg bg-base-200/50"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="absolute -top-2 -right-2 btn btn-error btn-circle btn-sm"
                            title="Supprimer le logo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-xs text-base-content/60">
                          Cliquez ou déposez pour changer
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                          <Building2 className="w-8 h-8 text-primary" />
                        </div>
                        <p className="text-sm font-semibold mb-1">Ajouter un logo</p>
                        <p className="text-xs text-base-content/60 mb-3">
                          Glissez-déposez ou cliquez
                        </p>
                        <button
                          type="button"
                          onClick={() => document.getElementById('logo-input').click()}
                          className="btn btn-outline btn-sm gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          Parcourir
                        </button>
                      </>
                    )}

                    <input
                      id="logo-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {/* Infos format */}
                  <div className="mt-5 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-base-content/60">
                      <CheckCircle className="w-3 h-3 text-success" />
                      <span>Formats : JPG, PNG, GIF, WebP</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-base-content/60">
                      <CheckCircle className="w-3 h-3 text-success" />
                      <span>Taille max : 5 MB</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-base-content/60">
                      <CheckCircle className="w-3 h-3 text-success" />
                      <span>Recommandé : 500×500 px</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Aperçu */}
            <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Aperçu</h3>
                </div>
                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="logo"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Building2 className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {formData.name || 'Nom de la marque'}
                      </p>
                      {formData.website && (
                        <p className="font-mono text-[10px] text-base-content/50 truncate">
                          {formData.website}
                        </p>
                      )}
                    </div>
                  </div>
                  {formData.description && (
                    <>
                      <div className="divider my-3"></div>
                      <p className="text-xs text-base-content/70 line-clamp-3">
                        {formData.description}
                      </p>
                    </>
                  )}
                  <div className="divider my-3"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-base-content/60">Statut :</span>
                    <span
                      className={`badge badge-sm ${
                        formData.is_active ? 'badge-success' : 'badge-ghost'
                      }`}
                    >
                      {formData.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Conseil */}
            <div className="card bg-warning/5 border border-warning/20">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-warning mb-1">Conseil</p>
                    <p className="text-base-content/70">
                      Un logo de qualité améliore la reconnaissance de votre marque.
                      Privilégiez un fond transparent pour une meilleure intégration.
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
              onClick={() => navigate('/brands')}
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
                  <Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : 'Créer la marque'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BrandForm;