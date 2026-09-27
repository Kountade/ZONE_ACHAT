// src/components/gestion/GestionMatieresDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Book, Edit, Trash2, RefreshCw,
  CheckCircle, AlertCircle, X,
  Layers, BarChart, Hash, Clock,
  BookOpen, Plus, Save
} from 'lucide-react';

const GestionMatieresDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [matiere, setMatiere] = useState(null);
  const [niveaux, setNiveaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddConfigModal, setShowAddConfigModal] = useState(false);
  const [newConfig, setNewConfig] = useState({
    niveau_id: '',
    coefficient: 1,
    est_obligatoire: true,
    volume_horaire: 0
  });
  const [editingConfig, setEditingConfig] = useState(null);
  const [coursCount, setCoursCount] = useState(0);
  const [error, setError] = useState(null);
  const [pageReady, setPageReady] = useState(false);

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setPageReady(false);
    
    try {
      // Charger les détails de la matière
      const matiereRes = await axiosInstance.get(`/matieres/${id}/`);
      const matiereData = matiereRes.data;
      setMatiere(matiereData);
      
      // Charger les niveaux
      const niveauxRes = await axiosInstance.get('/niveaux/');
      const niveauxData = Array.isArray(niveauxRes.data) ? niveauxRes.data : [];
      setNiveaux(niveauxData);
      
      // Compter les cours associés
      try {
        const coursRes = await axiosInstance.get(`/cours/?matiere=${id}`);
        const coursData = Array.isArray(coursRes.data) ? coursRes.data : [];
        setCoursCount(coursData.length);
      } catch (error) {
        console.error('Erreur chargement cours:', error);
        setCoursCount(0);
      }
      
      setPageReady(true);
    } catch (error) {
      console.error('Erreur chargement:', error);
      setError(error);
      if (error.response?.status === 404) {
        showNotification('Matière non trouvée', 'error');
        setTimeout(() => navigate('/matieres'), 1500);
      } else {
        showNotification('Erreur de chargement des données', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/matieres/${id}/`);
      showNotification('Matière supprimée avec succès', 'success');
      setTimeout(() => navigate('/matieres'), 1500);
    } catch (error) {
      console.error('Erreur suppression:', error);
      if (error.response?.status === 400) {
        showNotification('Impossible de supprimer cette matière (utilisée dans des cours)', 'error');
      } else {
        showNotification('Erreur lors de la suppression', 'error');
      }
      setShowDeleteModal(false);
    }
  };

  const handleAddConfig = async () => {
    if (!newConfig.niveau_id) {
      showNotification('Veuillez sélectionner un niveau', 'error');
      return;
    }
    if (!newConfig.coefficient || newConfig.coefficient <= 0) {
      showNotification('Le coefficient doit être supérieur à 0', 'error');
      return;
    }

    try {
      await axiosInstance.post(`/matieres/${id}/ajouter_configuration/`, {
        niveau_id: parseInt(newConfig.niveau_id),
        coefficient: parseFloat(newConfig.coefficient),
        est_obligatoire: newConfig.est_obligatoire,
        volume_horaire: parseInt(newConfig.volume_horaire) || 0
      });
      
      showNotification('Configuration ajoutée avec succès', 'success');
      setShowAddConfigModal(false);
      setNewConfig({ niveau_id: '', coefficient: 1, est_obligatoire: true, volume_horaire: 0 });
      loadData();
    } catch (error) {
      console.error('Erreur ajout configuration:', error);
      if (error.response?.status === 400) {
        showNotification('Cette configuration existe déjà', 'error');
      } else {
        showNotification('Erreur lors de l\'ajout', 'error');
      }
    }
  };

  const handleDeleteConfig = async (niveauId, niveauNom) => {
    if (!window.confirm(`Supprimer la configuration pour le niveau "${niveauNom}" ?`)) return;
    
    try {
      await axiosInstance.delete(`/matieres/${id}/supprimer_configuration/?niveau=${niveauId}`);
      showNotification('Configuration supprimée avec succès', 'success');
      loadData();
    } catch (error) {
      console.error('Erreur suppression configuration:', error);
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const handleUpdateConfig = async (config) => {
    try {
      await axiosInstance.put(`/matieres/${id}/modifier_configuration/`, {
        niveau_id: config.niveau_id,
        coefficient: parseFloat(config.coefficient),
        est_obligatoire: config.est_obligatoire,
        volume_horaire: parseInt(config.volume_horaire) || 0
      });
      
      showNotification('Configuration mise à jour avec succès', 'success');
      setEditingConfig(null);
      loadData();
    } catch (error) {
      console.error('Erreur modification configuration:', error);
      showNotification('Erreur lors de la modification', 'error');
    }
  };

  const getNiveauNom = (niveauId) => {
    if (!niveaux || niveaux.length === 0) return 'Chargement...';
    const niveau = niveaux.find(n => n.id === niveauId);
    return niveau ? niveau.nom : 'Niveau inconnu';
  };

  const getNiveauCycle = (niveauId) => {
    if (!niveaux || niveaux.length === 0) return null;
    const niveau = niveaux.find(n => n.id === niveauId);
    return niveau ? niveau.cycle : null;
  };

  const getAvailableNiveaux = () => {
    if (!matiere || !matiere.niveaux_config || !niveaux) return niveaux || [];
    const configuredIds = matiere.niveaux_config.map(c => c.niveau);
    return niveaux.filter(n => !configuredIds.includes(n.id));
  };

  const getTotalCoefficient = () => {
    if (!matiere || !matiere.niveaux_config || matiere.niveaux_config.length === 0) return 0;
    return matiere.niveaux_config.reduce((sum, config) => sum + (config.coefficient || 0), 0);
  };

  const getAverageCoefficient = () => {
    if (!matiere || !matiere.niveaux_config || matiere.niveaux_config.length === 0) return '0';
    const total = getTotalCoefficient();
    return (total / matiere.niveaux_config.length).toFixed(1);
  };

  // Affichage du chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12 sm:w-16 sm:h-16"></div>
          <p className="text-base sm:text-xl font-semibold text-base-content/70 animate-pulse">
            Chargement des détails...
          </p>
        </div>
      </div>
    );
  }

  // Affichage de l'erreur
  if (error || !matiere) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700">Matière non trouvée</h2>
          <p className="text-gray-500 mt-2">La matière que vous recherchez n'existe pas ou a été supprimée</p>
          <button onClick={() => navigate('/matieres')} className="btn btn-primary mt-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  // Vérification des données avant rendu
  const niveauxConfig = matiere.niveaux_config || [];
  const availableNiveaux = getAvailableNiveaux();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
      {/* Notification Toast */}
      {notification.show && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification({ ...notification, show: false })}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
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
              <p className="text-base-content/70">Voulez-vous vraiment supprimer cette matière ?</p>
              <p className="font-semibold text-error mt-2">{matiere.nom}</p>
              {coursCount > 0 && (
                <p className="text-warning text-sm mt-2">
                  ⚠️ Cette matière est utilisée dans {coursCount} cours
                </p>
              )}
              {niveauxConfig.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {niveauxConfig.length} configuration(s) seront supprimées
                </p>
              )}
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button className="btn btn-ghost flex-1" onClick={() => setShowDeleteModal(false)}>Annuler</button>
              <button className="btn btn-error flex-1 gap-2" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajout Configuration */}
      {showAddConfigModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="text-xl font-bold mb-4">Ajouter une configuration</h3>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Niveau <span className="text-error">*</span></span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={newConfig.niveau_id}
                  onChange={(e) => setNewConfig({ ...newConfig, niveau_id: e.target.value })}
                >
                  <option value="">Sélectionner un niveau</option>
                  {availableNiveaux.length > 0 ? (
                    availableNiveaux.map(n => (
                      <option key={n.id} value={n.id}>{n.nom} ({n.cycle})</option>
                    ))
                  ) : (
                    <option value="" disabled>Aucun niveau disponible</option>
                  )}
                </select>
                {availableNiveaux.length === 0 && (
                  <span className="text-warning text-xs mt-1">Tous les niveaux sont déjà configurés</span>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Coefficient <span className="text-error">*</span></span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={newConfig.coefficient}
                  onChange={(e) => setNewConfig({ ...newConfig, coefficient: parseFloat(e.target.value) || 0 })}
                  min="0.5"
                  step="0.5"
                  placeholder="Ex: 3, 4, 5"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Volume horaire (heures/semaine)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={newConfig.volume_horaire}
                  onChange={(e) => setNewConfig({ ...newConfig, volume_horaire: parseInt(e.target.value) || 0 })}
                  min="0"
                  placeholder="Ex: 4, 5, 6"
                />
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={newConfig.est_obligatoire}
                    onChange={(e) => setNewConfig({ ...newConfig, est_obligatoire: e.target.checked })}
                  />
                  <span className="label-text font-semibold">Matière obligatoire</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button className="btn btn-ghost flex-1" onClick={() => { setShowAddConfigModal(false); setNewConfig({ niveau_id: '', coefficient: 1, est_obligatoire: true, volume_horaire: 0 }); }}>
                Annuler
              </button>
              <button className="btn btn-primary flex-1 gap-2" onClick={handleAddConfig} disabled={availableNiveaux.length === 0}>
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5 mb-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl"></div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <button onClick={() => navigate('/matieres')} className="btn btn-ghost btn-sm gap-2 mb-2">
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Book className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{matiere.nom || 'Sans nom'}</h1>
                {matiere.code && (
                  <span className="badge badge-primary badge-md mt-1">{matiere.code}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={loadData} className="btn btn-sm btn-outline gap-2">
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <button onClick={() => navigate(`/matieres/${id}/modifier`)} className="btn btn-sm btn-info gap-2">
              <Edit className="w-4 h-4" />
              Modifier
            </button>
            <button onClick={() => setShowDeleteModal(true)} className="btn btn-sm btn-error gap-2">
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="card bg-white shadow-md rounded-xl border border-gray-200">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Configurations</p>
                <p className="text-xl font-bold">{niveauxConfig.length}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md rounded-xl border border-gray-200">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <BarChart className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Coefficient total</p>
                <p className="text-xl font-bold">{getTotalCoefficient()}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md rounded-xl border border-gray-200">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Hash className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Moyenne</p>
                <p className="text-xl font-bold">{getAverageCoefficient()}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-md rounded-xl border border-gray-200">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <BookOpen className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Cours associés</p>
                <p className="text-xl font-bold">{coursCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configurations par niveau */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Configurations par niveau</h2>
            <span className="badge badge-primary badge-sm">{niveauxConfig.length}</span>
          </div>
          <button 
            className="btn btn-primary btn-sm gap-2"
            onClick={() => setShowAddConfigModal(true)}
            disabled={availableNiveaux.length === 0}
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>

        {niveauxConfig.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <Layers className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">Aucune configuration</p>
              <p className="text-sm text-gray-400">Configurez cette matière pour les niveaux concernés</p>
              <button 
                className="btn btn-primary btn-sm gap-2 mt-2"
                onClick={() => setShowAddConfigModal(true)}
              >
                <Plus className="w-4 h-4" />
                Ajouter une configuration
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-white">
                  <th className="font-semibold">Niveau</th>
                  <th className="font-semibold">Cycle</th>
                  <th className="font-semibold text-center">Coefficient</th>
                  <th className="font-semibold text-center">Volume horaire</th>
                  <th className="font-semibold text-center">Obligatoire</th>
                  <th className="font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {niveauxConfig.map((config) => {
                  const isEditing = editingConfig && editingConfig.id === config.id;
                  return (
                    <tr key={config.id || config.niveau} className="hover:bg-gray-50 transition-colors">
                      <td>
                        <span className="font-medium">{getNiveauNom(config.niveau)}</span>
                      </td>
                      <td>
                        <span className="badge badge-ghost badge-sm">
                          {getNiveauCycle(config.niveau) || '-'}
                        </span>
                      </td>
                      <td className="text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            className="input input-bordered input-sm w-20 text-center"
                            value={editingConfig.coefficient}
                            onChange={(e) => setEditingConfig({ ...editingConfig, coefficient: parseFloat(e.target.value) || 0 })}
                            min="0.5"
                            step="0.5"
                            autoFocus
                          />
                        ) : (
                          <span className="badge badge-primary badge-lg">{config.coefficient}</span>
                        )}
                      </td>
                      <td className="text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            className="input input-bordered input-sm w-24 text-center"
                            value={editingConfig.volume_horaire}
                            onChange={(e) => setEditingConfig({ ...editingConfig, volume_horaire: parseInt(e.target.value) || 0 })}
                            min="0"
                          />
                        ) : (
                          <span>{config.volume_horaire || 0}h</span>
                        )}
                      </td>
                      <td className="text-center">
                        {isEditing ? (
                          <input
                            type="checkbox"
                            className="checkbox checkbox-primary checkbox-sm"
                            checked={editingConfig.est_obligatoire}
                            onChange={(e) => setEditingConfig({ ...editingConfig, est_obligatoire: e.target.checked })}
                          />
                        ) : (
                          config.est_obligatoire ? (
                            <span className="badge badge-success badge-sm">Oui</span>
                          ) : (
                            <span className="badge badge-ghost badge-sm">Non</span>
                          )
                        )}
                      </td>
                      <td className="text-center">
                        {isEditing ? (
                          <div className="flex justify-center gap-2">
                            <button 
                              className="btn btn-success btn-xs gap-1"
                              onClick={() => handleUpdateConfig(editingConfig)}
                            >
                              <Save className="w-3 h-3" />
                            </button>
                            <button 
                              className="btn btn-ghost btn-xs gap-1"
                              onClick={() => setEditingConfig(null)}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-center gap-1">
                            <button 
                              className="btn btn-ghost btn-xs btn-circle"
                              onClick={() => setEditingConfig({
                                id: config.id,
                                niveau_id: config.niveau,
                                coefficient: config.coefficient,
                                est_obligatoire: config.est_obligatoire,
                                volume_horaire: config.volume_horaire
                              })}
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              className="btn btn-ghost btn-xs btn-circle text-error"
                              onClick={() => handleDeleteConfig(config.niveau, getNiveauNom(config.niveau))}
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Information supplémentaire */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="p-1 bg-blue-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-800">Information</p>
              <p className="text-xs text-blue-600 mt-1">
                Les coefficients sont spécifiques à chaque niveau. 
                Modifiez les configurations pour ajuster les coefficients par niveau.
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-green-50 rounded-xl border border-green-200">
          <div className="flex items-start gap-3">
            <div className="p-1 bg-green-100 rounded-lg">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800">Cours associés</p>
              <p className="text-xs text-green-600 mt-1">
                {coursCount > 0 
                  ? `Cette matière est utilisée dans ${coursCount} cours. La modification des coefficients affectera ces cours.`
                  : 'Aucun cours associé pour le moment.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionMatieresDetail;