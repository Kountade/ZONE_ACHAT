// src/pages/GestionProfesseurs.jsx
import React, { useState, useEffect } from 'react';
import {
  Search,
  Edit,
  Trash2,
  Eye,
  UserCog,
  Mail,
  Phone,
  Calendar,
  Download,
  UserPlus,
  Briefcase,
  Award,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const GestionProfesseurs = () => {
  const navigate = useNavigate();
  const [professeurs, setProfesseurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('tous');
  const [selectedProfesseur, setSelectedProfesseur] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalProfesseurs, setTotalProfesseurs] = useState(0);

  // Statistiques
  const [stats, setStats] = useState({
    total: 0,
    actifs: 0,
    inactifs: 0,
    titulaires: 0,
    parSpecialite: {}
  });

  useEffect(() => {
    fetchProfesseurs();
  }, []);

  const fetchProfesseurs = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/professeurs/');
      const data = response.data;
      setProfesseurs(data);
      setTotalProfesseurs(data.length);
      calculateStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des professeurs:', error);
      toast.error('Erreur lors du chargement des professeurs');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const actifs = data.filter(p => p.est_actif).length;
    const inactifs = data.filter(p => !p.est_actif).length;
    const titulaires = data.filter(p => p.est_titulaire).length;
    
    const specialites = {};
    data.forEach(p => {
      if (p.specialite) {
        specialites[p.specialite] = (specialites[p.specialite] || 0) + 1;
      }
    });

    setStats({
      total: data.length,
      actifs,
      inactifs,
      titulaires,
      parSpecialite: specialites
    });
  };

  // Filtrage des professeurs (sans établissement)
  const filteredProfesseurs = professeurs.filter(prof => {
    const matchSearch = 
      prof.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prof.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prof.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prof.matricule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prof.specialite?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = filterStatus === 'tous' || 
      (filterStatus === 'actif' && prof.est_actif) ||
      (filterStatus === 'inactif' && !prof.est_actif) ||
      (filterStatus === 'titulaire' && prof.est_titulaire);

    return matchSearch && matchStatus;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProfesseurs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProfesseurs.length / itemsPerPage);

  // Suppression d'un professeur
  const handleDelete = async () => {
    if (!selectedProfesseur) return;
    try {
      await axiosInstance.delete(`/professeurs/${selectedProfesseur.id}/`);
      toast.success('Professeur supprimé avec succès');
      setShowDeleteModal(false);
      fetchProfesseurs();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression du professeur');
    }
  };

  // Changement de statut
  const toggleStatus = async (professeur) => {
    try {
      const updated = { ...professeur, est_actif: !professeur.est_actif };
      await axiosInstance.patch(`/professeurs/${professeur.id}/`, updated);
      toast.success(`Professeur ${updated.est_actif ? 'activé' : 'désactivé'} avec succès`);
      fetchProfesseurs();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  // Export CSV (sans établissement)
  const exportCSV = () => {
    const headers = ['Matricule', 'Nom', 'Prénom', 'Email', 'Spécialité', 'Statut'];
    const rows = filteredProfesseurs.map(p => [
      p.matricule,
      p.nom,
      p.prenom,
      p.email,
      p.specialite || '-',
      p.est_actif ? 'Actif' : 'Inactif'
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `professeurs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Export CSV effectué avec succès');
  };

  // Formatage de la date
  const formatDate = (date) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: fr });
  };

  // Fonction pour naviguer vers l'ajout
  const handleAddProfesseur = () => {
    navigate('/professeurs/ajout');
  };

  return (
    <div className="min-h-screen bg-base-200 p-4 sm:p-6">
      {/* En-tête */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-base-content flex items-center gap-2">
              <UserCog className="w-8 h-8 text-primary" />
              Gestion des Professeurs
            </h1>
            <p className="text-sm text-base-content/60 mt-1">
              {totalProfesseurs} professeurs au total
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportCSV}
              className="btn btn-outline btn-sm gap-2"
            >
              <Download className="w-4 h-4" />
              Exporter
            </button>
            <button
              onClick={fetchProfesseurs}
              className="btn btn-outline btn-sm gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Rafraîchir
            </button>
            <button
              onClick={handleAddProfesseur}
              className="btn btn-primary btn-sm gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Ajouter un professeur
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-base-100 rounded-xl shadow-sm p-4 border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/60">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <UserCog className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
        <div className="bg-base-100 rounded-xl shadow-sm p-4 border-l-4 border-success">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/60">Actifs</p>
              <p className="text-2xl font-bold text-success">{stats.actifs}</p>
            </div>
            <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
          </div>
        </div>
        <div className="bg-base-100 rounded-xl shadow-sm p-4 border-l-4 border-warning">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/60">Titulaires</p>
              <p className="text-2xl font-bold text-warning">{stats.titulaires}</p>
            </div>
            <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center">
              <Award className="w-6 h-6 text-warning" />
            </div>
          </div>
        </div>
        <div className="bg-base-100 rounded-xl shadow-sm p-4 border-l-4 border-info">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/60">Spécialités</p>
              <p className="text-2xl font-bold text-info">
                {Object.keys(stats.parSpecialite).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-info/10 rounded-full flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-info" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-base-100 rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
            <input
              type="text"
              placeholder="Rechercher un professeur (nom, prénom, email, matricule...)"
              className="input input-bordered w-full pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="select select-bordered select-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="tous">Tous les statuts</option>
              <option value="actif">Actifs</option>
              <option value="inactif">Inactifs</option>
              <option value="titulaire">Titulaires</option>
            </select>
            {/* Filtre établissement supprimé */}
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('tous');
              }}
              className="btn btn-ghost btn-sm"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Tableau des professeurs */}
      <div className="bg-base-100 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredProfesseurs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-base-content/60">
            <UserCog className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">Aucun professeur trouvé</p>
            <p className="text-sm">Modifiez vos filtres ou ajoutez un nouveau professeur</p>
            <button
              onClick={handleAddProfesseur}
              className="btn btn-primary btn-sm gap-2 mt-4"
            >
              <UserPlus className="w-4 h-4" />
              Ajouter un professeur
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>Matricule</th>
                  <th>Nom & Prénom</th>
                  <th>Contact</th>
                  <th>Spécialité</th>
                  <th>Statut</th>
                  <th>Date d'embauche</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((prof) => (
                  <tr key={prof.id} className="hover">
                    <td>
                      <span className="font-mono text-sm bg-base-200 px-2 py-1 rounded">
                        {prof.matricule}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                            <span className="text-sm font-bold">
                              {prof.prenom?.charAt(0)}{prof.nom?.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">{prof.prenom} {prof.nom}</p>
                          {/* Ligne établissement supprimée */}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-1">
                        <p className="text-sm flex items-center gap-1">
                          <Mail className="w-3 h-3 text-base-content/40" />
                          <span className="text-xs">{prof.email || '-'}</span>
                        </p>
                        <p className="text-sm flex items-center gap-1">
                          <Phone className="w-3 h-3 text-base-content/40" />
                          <span className="text-xs">{prof.telephone || '-'}</span>
                        </p>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-primary badge-sm">
                        {prof.specialite || 'Non définie'}
                      </span>
                      {prof.matieres_enseignees?.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {prof.matieres_enseignees.slice(0, 2).map((matiere, idx) => (
                            <span key={idx} className="badge badge-ghost badge-xs">
                              {matiere.nom}
                            </span>
                          ))}
                          {prof.matieres_enseignees.length > 2 && (
                            <span className="badge badge-ghost badge-xs">
                              +{prof.matieres_enseignees.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <span className={`badge badge-sm ${prof.est_actif ? 'badge-success' : 'badge-error'}`}>
                          {prof.est_actif ? 'Actif' : 'Inactif'}
                        </span>
                        {prof.est_titulaire && (
                          <span className="badge badge-warning badge-sm">
                            Titulaire
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-sm">
                      {formatDate(prof.date_embauche)}
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedProfesseur(prof);
                            setShowDetailsModal(true);
                          }}
                          className="btn btn-ghost btn-xs btn-square"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/professeurs/modifier/${prof.id}`}
                          className="btn btn-ghost btn-xs btn-square"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4 text-primary" />
                        </Link>
                        <button
                          onClick={() => toggleStatus(prof)}
                          className={`btn btn-ghost btn-xs btn-square ${prof.est_actif ? 'text-warning' : 'text-success'}`}
                          title={prof.est_actif ? 'Désactiver' : 'Activer'}
                        >
                          {prof.est_actif ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProfesseur(prof);
                            setShowDeleteModal(true);
                          }}
                          className="btn btn-ghost btn-xs btn-square text-error"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && filteredProfesseurs.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-base-200">
            <p className="text-sm text-base-content/60">
              {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredProfesseurs.length)} sur {filteredProfesseurs.length}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn btn-ghost btn-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`btn btn-sm ${currentPage === pageNum ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-ghost btn-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Détails - sans établissement */}
      {showDetailsModal && selectedProfesseur && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-base-100 border-b border-base-200 p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <UserCog className="w-6 h-6 text-primary" />
                Détails du professeur
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="btn btn-ghost btn-sm btn-square"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="avatar placeholder">
                  <div className="w-20 h-20 rounded-full bg-primary text-primary-content text-3xl font-bold flex items-center justify-center">
                    {selectedProfesseur.prenom?.charAt(0)}{selectedProfesseur.nom?.charAt(0)}
                  </div>
                </div>
                <div>
                  <h4 className="text-2xl font-bold">{selectedProfesseur.prenom} {selectedProfesseur.nom}</h4>
                  <p className="text-base-content/60">{selectedProfesseur.matricule}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`badge ${selectedProfesseur.est_actif ? 'badge-success' : 'badge-error'}`}>
                      {selectedProfesseur.est_actif ? 'Actif' : 'Inactif'}
                    </span>
                    {selectedProfesseur.est_titulaire && (
                      <span className="badge badge-warning">Titulaire</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h5 className="font-semibold text-sm text-base-content/60 uppercase">Informations personnelles</h5>
                  <div className="bg-base-200 rounded-lg p-3 space-y-2">
                    <p className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-base-content/40" />
                      <span>{selectedProfesseur.email || '-'}</span>
                    </p>
                    <p className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-base-content/40" />
                      <span>{selectedProfesseur.telephone || '-'}</span>
                    </p>
                    <p className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-base-content/40" />
                      <span>{selectedProfesseur.adresse || '-'}</span>
                    </p>
                    <p className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-base-content/40" />
                      <span>Né(e) le {formatDate(selectedProfesseur.date_naissance)}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h5 className="font-semibold text-sm text-base-content/60 uppercase">Informations professionnelles</h5>
                  <div className="bg-base-200 rounded-lg p-3 space-y-2">
                    <p className="flex items-center gap-2 text-sm">
                      <Briefcase className="w-4 h-4 text-base-content/40" />
                      <span>Spécialité : {selectedProfesseur.specialite || '-'}</span>
                    </p>
                    <p className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-base-content/40" />
                      <span>Embauché le {formatDate(selectedProfesseur.date_embauche)}</span>
                    </p>
                    <p className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-base-content/40" />
                      <span>Créé le {formatDate(selectedProfesseur.date_creation)}</span>
                    </p>
                    {/* Ligne établissement supprimée */}
                  </div>
                </div>
              </div>

              {/* Matières enseignées */}
              {selectedProfesseur.matieres_enseignees?.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-semibold text-sm text-base-content/60 uppercase mb-2">
                    Matières enseignées
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfesseur.matieres_enseignees.map((matiere, idx) => (
                      <span key={idx} className="badge badge-primary badge-lg">
                        {matiere.nom}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Classes principales */}
              {selectedProfesseur.classes_principales?.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-semibold text-sm text-base-content/60 uppercase mb-2">
                    Classes principales
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfesseur.classes_principales.map((classe, idx) => (
                      <span key={idx} className="badge badge-info badge-lg">
                        {classe.nom}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Diplômes */}
              {selectedProfesseur.diplomes && (
                <div className="mt-4">
                  <h5 className="font-semibold text-sm text-base-content/60 uppercase mb-2">
                    Diplômes
                  </h5>
                  <div className="bg-base-200 rounded-lg p-3">
                    <p className="text-sm whitespace-pre-wrap">{selectedProfesseur.diplomes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {showDeleteModal && selectedProfesseur && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2">Confirmer la suppression</h3>
              <p className="text-base-content/60 mb-6">
                Êtes-vous sûr de vouloir supprimer le professeur <br />
                <span className="font-semibold text-base-content">
                  {selectedProfesseur.prenom} {selectedProfesseur.nom}
                </span> ?
                <br />
                <span className="text-error text-sm">Cette action est irréversible.</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="btn btn-ghost"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  className="btn btn-error"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionProfesseurs;