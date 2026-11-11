// src/components/logistique/UniteMesureForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle, Ruler,
  Scale, Droplet, Box, RefreshCw, Trash2, Info, Eye,
  Power, Star, Calculator, Tag, FileText, X, Sparkles
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const UniteMesureForm = () => {
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
    symbol: '',
    type: 'unit',
    conversion_factor: 1.0,
    is_base_unit: false,
    is_active: true,
  });

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================
  useEffect(() => {
    const init = async () => {
      if (estEdition) {
        await chargerUnite();
      } else {
        setChargementInitial(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const chargerUnite = async () => {
    setChargementInitial(true);
    try {
      const res = await AxiosInstance.get(`/unit-measures/${id}/`);
      const d = res.data;
      setFormData({
        name: d.name || '',
        symbol: d.symbol || '',
        type: d.type || 'unit',
        conversion_factor: d.conversion_factor || 1.0,
        is_base_unit: d.is_base_unit || false,
        is_active: d.is_active !== undefined ? d.is_active : true,
      });
    } catch (err) {
      setErreur("Impossible de charger l'unité de mesure");
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

  // ============================================================
  // VALIDATION
  // ============================================================
  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.symbol.trim()) newErrors.symbol = 'Le symbole est requis';
    if (Number(formData.conversion_factor) <= 0) {
      newErrors.conversion_factor = 'Le facteur de conversion doit être positif';
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
      const dataToSend = {
        ...formData,
        conversion_factor: parseFloat(formData.conversion_factor),
      };

      if (estEdition) {
        await AxiosInstance.patch(`/unit-measures/${id}/`, dataToSend);
      } else {
        await AxiosInstance.post('/unit-measures/', dataToSend);
      }

      setSucces(true);
      setTimeout(() => navigate('/unites-mesure'), 1200);
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
      await AxiosInstance.delete(`/unit-measures/${id}/`);
      setSucces(true);
      setTimeout(() => navigate('/unites-mesure'), 1200);
    } catch (err) {
      setErreur('Erreur lors de la suppression');
    }
    setShowDeleteModal(false);
  };

  // ============================================================
  // HELPERS
  // ============================================================
  const getTypeIcon = () => {
    switch (formData.type) {
      case 'weight': return <Scale className="w-5 h-5" />;
      case 'volume': return <Droplet className="w-5 h-5" />;
      case 'length': return <Ruler className="w-5 h-5" />;
      default: return <Box className="w-5 h-5" />;
    }
  };

  const getTypeLabel = () => {
    switch (formData.type) {
      case 'weight': return 'Poids';
      case 'volume': return 'Volume';
      case 'length': return 'Longueur';
      default: return 'Unité';
    }
  };

  const getTypeColor = () => {
    switch (formData.type) {
      case 'weight': return 'warning';
      case 'volume': return 'info';
      case 'length': return 'success';
      default: return 'primary';
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

  const typeColor = getTypeColor();

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="w-full min-h-screen bg-base-200/40 pb-24">
      {/* EN-TÊTE */}
      <div className="w-full sticky top-0 z-20 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate('/unites-mesure')}
            className="btn btn-ghost btn-sm btn-circle"
            type="button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Produits / Unités / <span className="text-primary">{estEdition ? 'Édition' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <Ruler className="w-5 h-5 text-primary" />
              {estEdition ? "Modifier l'unité" : 'Nouvelle unité de mesure'}
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
          <span>Unité {estEdition ? 'modifiée' : 'créée'} avec succès !</span>
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
              <p className="text-base-content/70">Voulez-vous vraiment supprimer cette unité ?</p>
              <p className="font-semibold text-error mt-2">{formData.name}</p>
              {formData.is_base_unit && (
                <p className="text-warning text-sm mt-2 flex items-center justify-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Cette unité est marquée comme unité de base
                </p>
              )}
            </div>
            <div className="flex gap-3 p-4 bg-base-200/40">
              <button className="btn btn-ghost flex-1" onClick={() => setShowDeleteModal(false)}>
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
                  <Tag className="w-4 h-4 text-primary" />
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
                        maxLength="50"
                        placeholder="Ex : Kilogramme, Litre, Mètre"
                        autoFocus
                      />
                      {errors.name && <span className="text-error text-xs mt-1">{errors.name}</span>}
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          Symbole <span className="text-error">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        name="symbol"
                        className={`input input-bordered w-full font-mono ${errors.symbol ? 'input-error' : ''}`}
                        value={formData.symbol}
                        onChange={handleChange}
                        required
                        maxLength="10"
                        placeholder="Ex : kg, L, m"
                      />
                      {errors.symbol && <span className="text-error text-xs mt-1">{errors.symbol}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Box className="w-3 h-3 mr-1 inline" /> Type d'unité
                        </span>
                      </label>
                      <select
                        name="type"
                        className="select select-bordered w-full"
                        value={formData.type}
                        onChange={handleChange}
                      >
                        <option value="unit">Unité</option>
                        <option value="weight">Poids</option>
                        <option value="volume">Volume</option>
                        <option value="length">Longueur</option>
                      </select>
                    </div>

                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <Calculator className="w-3 h-3 mr-1 inline" /> Facteur de conversion
                        </span>
                      </label>
                      <input
                        type="number"
                        name="conversion_factor"
                        className={`input input-bordered w-full font-mono ${errors.conversion_factor ? 'input-error' : ''}`}
                        value={formData.conversion_factor}
                        onChange={handleChange}
                        min="0.0001"
                        step="0.0001"
                        placeholder="1.0000"
                      />
                      {errors.conversion_factor ? (
                        <span className="text-error text-xs mt-1">{errors.conversion_factor}</span>
                      ) : (
                        <span className="text-xs text-base-content/40 mt-1">
                          Facteur de conversion vers l'unité de base
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2 : Options */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Power className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Options</h2>
                </div>
                <div className="p-5 space-y-4">
                  <div className="form-control w-full">
                    <label className="label cursor-pointer justify-start gap-3 py-1">
                      <input
                        type="checkbox"
                        name="is_base_unit"
                        className="checkbox checkbox-primary"
                        checked={formData.is_base_unit}
                        onChange={handleChange}
                      />
                      <span className="label-text text-sm font-medium flex items-center gap-2">
                        <Star className="w-4 h-4 text-warning" />
                        Unité de base
                      </span>
                    </label>
                    <span className="text-xs text-base-content/40 mt-1 ml-8">
                      Les conversions se feront par rapport à cette unité
                    </span>
                  </div>

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
                        {formData.is_active ? 'Unité active' : 'Unité inactive'}
                      </span>
                    </label>
                    <span className="text-xs text-base-content/40 mt-1 ml-1">
                      {formData.is_active
                        ? 'Cette unité sera disponible pour les produits'
                        : "Cette unité n'apparaîtra pas dans les sélections"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info box conversions */}
            <div className="card bg-info/5 border border-info/20">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-info mb-1">À savoir sur les conversions</p>
                    <p className="text-base-content/70">
                      Le facteur de conversion permet de convertir cette unité vers l'unité de base.
                      Exemple : si l'unité de base est le <strong>Gramme</strong> et que cette unité est
                      le <strong>Kilogramme</strong>, le facteur sera <strong>1000</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* COLONNE APERÇU (1/3) */}
          {/* ============================================================ */}
          <div className="lg:col-span-1 space-y-6">
            {/* Card type dominant */}
            <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Aperçu</h3>
                </div>
                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-14 h-14 rounded-lg bg-${typeColor}/20 flex items-center justify-center flex-shrink-0`}>
                      {getTypeIcon()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-base-content/50">
                        {formData.symbol || 'SYM'}
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {formData.name || "Nom de l'unité"}
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
                      <span className="text-base-content/60">Facteur :</span>
                      <span className="font-mono font-bold">
                        × {formData.conversion_factor || 1}
                      </span>
                    </div>
                  </div>
                  <div className="divider my-3"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-base-content/60">Statut :</span>
                    <span
                      className={`badge badge-sm ${formData.is_active ? 'badge-success' : 'badge-ghost'}`}
                    >
                      {formData.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {formData.is_base_unit && (
                    <div className="flex items-center gap-1 mt-2 text-warning text-xs">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="font-medium">Unité de base</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info box type */}
            <div className="card bg-info/5 border border-info/20">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-info mb-1">Types d'unités</p>
                    <ul className="text-base-content/70 space-y-1">
                      <li>• <strong>Unité</strong> : pièce, boîte, carton</li>
                      <li>• <strong>Poids</strong> : kg, g, tonne</li>
                      <li>• <strong>Volume</strong> : L, mL, m³</li>
                      <li>• <strong>Longueur</strong> : m, cm, km</li>
                    </ul>
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
                      Définissez une seule unité de base par type (ex : Gramme pour le poids).
                      Les autres unités doivent avoir un facteur cohérent.
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
              onClick={() => navigate('/unites-mesure')}
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
                  <Save className="w-4 h-4" /> {estEdition ? 'Enregistrer' : "Créer l'unité"}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UniteMesureForm;