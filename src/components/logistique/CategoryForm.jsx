// src/components/logistique/CategoryForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Save, X, FolderTree, RefreshCw, ArrowLeft,
  CheckCircle, AlertCircle, Home,
  Tag, FileText, Info, Loader2, Power
} from 'lucide-react';

const CategoryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    parent: '',
    is_active: true,
  });
  const [categories, setCategories] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);
  const [errors, setErrors] = useState({});

  const getToken = () => localStorage.getItem('Token');

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================
  useEffect(() => {
    const init = async () => {
      await chargerCategories();
      if (isEditMode) {
        await chargerCategorie();
      } else {
        setChargementInitial(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const chargerCategories = async () => {
    try {
      const token = getToken();
      const res = await AxiosInstance.get('/categories/?page_size=500', {
        headers: { Authorization: `Token ${token}` },
      });
      const data = res.data.results || res.data || [];
      setCategories(data);
    } catch (err) {
      console.error('Erreur chargement catégories:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const chargerCategorie = async () => {
    setChargementInitial(true);
    try {
      const token = getToken();
      const res = await AxiosInstance.get(`/categories/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const d = res.data;
      setFormData({
        name: d.name || '',
        code: d.code || '',
        description: d.description || '',
        parent: d.parent || '',
        is_active: d.is_active !== undefined ? d.is_active : true,
      });
    } catch (err) {
      if (err.response?.status === 404) {
        setErreur('Catégorie non trouvée');
        setTimeout(() => navigate('/categories'), 1500);
      } else {
        setErreur('Impossible de charger la catégorie');
      }
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
    const prefix = formData.name ? formData.name.substring(0, 3).toUpperCase() : 'CAT';
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

    if (formData.code) {
      const existing = categories.find(
        (c) => c.code === formData.code && String(c.id) !== String(id)
      );
      if (existing) newErrors.code = 'Ce code existe déjà';
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
      const token = getToken();
      const dataToSend = {
        name: formData.name,
        code: formData.code,
        description: formData.description,
        is_active: formData.is_active,
      };
      if (formData.parent) dataToSend.parent = formData.parent;

      const headers = { Authorization: `Token ${token}` };

      if (isEditMode) {
        await AxiosInstance.patch(`/categories/${id}/`, dataToSend, { headers });
      } else {
        await AxiosInstance.post('/categories/', dataToSend, { headers });
      }

      setSucces(true);
      setTimeout(() => navigate('/categories'), 1200);
    } catch (err) {
      if (err.response?.status === 401) {
        setErreur('Session expirée');
        setTimeout(() => navigate('/login'), 1500);
      } else if (err.response?.data) {
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
  // LOADING
  // ============================================================
  if (chargementInitial) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-base-content/60">Chargement...</p>
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
            onClick={() => navigate('/categories')}
            className="btn btn-ghost btn-sm btn-circle"
            type="button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Produits / Catégories /{' '}
              <span className="text-primary">{isEditMode ? 'Édition' : 'Création'}</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <FolderTree className="w-5 h-5 text-primary" />
              {isEditMode ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </h1>
          </div>
        </div>
      </div>

      {succes && (
        <div className="w-full alert alert-success rounded-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Catégorie {isEditMode ? 'modifiée' : 'créée'} avec succès !</span>
        </div>
      )}
      {erreur && (
        <div className="w-full alert alert-error rounded-none py-2">
          <AlertCircle className="w-5 h-5" />
          <span>{erreur}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="max-w-3xl mx-auto p-6">
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-0">
              <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Informations de la catégorie</h2>
              </div>

              <div className="p-5 space-y-5">
                {/* Nom */}
                <div className="form-control w-full">
                  <label className="label py-0 pb-1.5">
                    <span className="label-text text-sm font-medium">
                      <Tag className="w-3 h-3 mr-1 inline" /> Nom{' '}
                      <span className="text-error">*</span>
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
                    placeholder="Ex : Électronique, Alimentation, Mode..."
                    autoFocus
                  />
                  {errors.name && <span className="text-error text-xs mt-1">{errors.name}</span>}
                </div>

                {/* Code */}
                <div className="form-control w-full">
                  <label className="label py-0 pb-1.5">
                    <span className="label-text text-sm font-medium">
                      <FileText className="w-3 h-3 mr-1 inline" /> Code{' '}
                      <span className="text-error">*</span>
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
                      maxLength="50"
                      placeholder="Ex : ELEC001"
                    />
                    <button
                      type="button"
                      onClick={generateCode}
                      className="btn btn-outline join-item gap-1"
                      title="Générer un code automatique"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span className="hidden sm:inline">Auto</span>
                    </button>
                  </div>
                  {errors.code && <span className="text-error text-xs mt-1">{errors.code}</span>}
                  <span className="text-xs text-base-content/40 mt-1">
                    Code unique pour identifier cette catégorie
                  </span>
                </div>

                {/* Parent */}
                <div className="form-control w-full">
                  <label className="label py-0 pb-1.5">
                    <span className="label-text text-sm font-medium">
                      <Home className="w-3 h-3 mr-1 inline" /> Catégorie parente
                    </span>
                  </label>
                  <select
                    name="parent"
                    className="select select-bordered w-full"
                    value={formData.parent || ''}
                    onChange={handleChange}
                  >
                    <option value="">Aucune (catégorie racine)</option>
                    {categories
                      .filter((cat) => {
                        // Exclure la catégorie elle-même en mode édition
                        if (isEditMode && String(cat.id) === String(id)) return false;
                        // N'afficher que les catégories racines (pas de sous-catégorie de sous-catégorie)
                        return !cat.parent;
                      })
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} ({cat.code})
                        </option>
                      ))}
                  </select>
                  <span className="text-xs text-base-content/40 mt-1">
                    Laissez vide pour une catégorie de niveau supérieur
                  </span>
                </div>

                {/* Description */}
                <div className="form-control w-full">
                  <label className="label py-0 pb-1.5">
                    <span className="label-text text-sm font-medium">Description</span>
                  </label>
                  <textarea
                    name="description"
                    className="textarea textarea-bordered w-full"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Description détaillée de la catégorie..."
                  ></textarea>
                  <span className="text-xs text-base-content/40 mt-1">
                    Optionnel — Une description claire aide à organiser les produits
                  </span>
                </div>

                {/* Statut */}
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
                      {formData.is_active ? 'Catégorie active' : 'Catégorie inactive'}
                    </span>
                  </label>
                  <span className="text-xs text-base-content/40 mt-1 ml-1">
                    {formData.is_active
                      ? 'Les produits de cette catégorie seront visibles'
                      : 'Cette catégorie sera masquée'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Info édition */}
          {isEditMode && (
            <div className="mt-6 card bg-info/5 border border-info/20">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-info mb-1">Information</p>
                    <p className="text-base-content/70">
                      La modification d'une catégorie peut affecter l'organisation de vos produits.
                      Les sous-catégories et produits associés seront automatiquement mis à jour.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BARRE STICKY */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-base-100 border-t border-base-300 shadow-lg lg:pl-72">
          <div className="flex items-center justify-end gap-3 px-6 py-3">
            <button
              type="button"
              onClick={() => navigate('/categories')}
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
                  <Save className="w-4 h-4" /> {isEditMode ? 'Enregistrer' : 'Créer la catégorie'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;