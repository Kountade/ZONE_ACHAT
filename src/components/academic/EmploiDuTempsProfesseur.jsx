// src/components/academic/EmploiDuTempsProfesseur.jsx
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  Building2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertCircle,
  Download,
  Printer,
  User,
  FileText,
  CalendarDays,
  Timer,
  BookMarked,
  School,
  Users as UsersIcon,
  Eye
} from 'lucide-react';
import axiosInstance from '../AxiosInstance';
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  differenceInMinutes,
  addWeeks,
  parseISO
} from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const EmploiDuTempsProfesseur = () => {
  // États
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [professeurs, setProfesseurs] = useState([]);
  const [selectedProfesseur, setSelectedProfesseur] = useState('');
  const [cours, setCours] = useState([]);
  const [loadingProfesseurs, setLoadingProfesseurs] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [anneeScolaireActive, setAnneeScolaireActive] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    parJour: {},
    parMatiere: {},
    parType: {},
    dureeTotale: 0
  });
  const [showStats, setShowStats] = useState(true);
  const [professeurNom, setProfesseurNom] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Configuration
  const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const joursDisplay = {
    lundi: 'Lun',
    mardi: 'Mar',
    mercredi: 'Mer',
    jeudi: 'Jeu',
    vendredi: 'Ven',
    samedi: 'Sam'
  };
  const joursComplet = {
    lundi: 'Lundi',
    mardi: 'Mardi',
    mercredi: 'Mercredi',
    jeudi: 'Jeudi',
    vendredi: 'Vendredi',
    samedi: 'Samedi'
  };

  const typeCoursConfig = {
    cours: { label: 'CM', color: 'badge-primary' },
    td: { label: 'TD', color: 'badge-secondary' },
    tp: { label: 'TP', color: 'badge-accent' }
  };

  // Récupérer l'utilisateur connecté
  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem('User');
      return userData ? JSON.parse(userData) : null;
    } catch { return null; }
  };

  const currentUser = getCurrentUser();
  const isProfesseur = currentUser?.role === 'professeur' || currentUser?.role === 'enseignant';
  const isAdmin = currentUser?.role === 'super_admin' || 
                  currentUser?.role === 'direction' || 
                  currentUser?.role === 'administratif';

  // Chargement initial
  useEffect(() => {
    const user = getCurrentUser();
    setUserRole(user?.role || null);
    
    fetchAnneeScolaireActive();
    
    if (isProfesseur) {
      // Mode professeur : charger directement son emploi du temps
      fetchMonEmploiDuTemps();
      setLoadingProfesseurs(false);
    } else if (isAdmin) {
      // Mode admin : charger la liste des professeurs
      fetchProfesseurs();
    } else {
      setLoadingProfesseurs(false);
      setLoadingInitial(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin && selectedProfesseur) {
      fetchEmploiDuTempsParProfesseur(selectedProfesseur);
    }
  }, [selectedProfesseur]);

  useEffect(() => {
    calculateStats();
  }, [cours]);

  // ==================== FONCTIONS API ====================

  const fetchProfesseurs = async () => {
    try {
      setLoadingProfesseurs(true);
      const response = await axiosInstance.get('/professeurs/');
      setProfesseurs(response.data || []);
      
      // Si un seul professeur, le sélectionner automatiquement
      if (response.data && response.data.length === 1) {
        setSelectedProfesseur(response.data[0].id.toString());
      }
    } catch (err) {
      console.error('Erreur chargement professeurs:', err);
      setError('Impossible de charger la liste des professeurs');
    } finally {
      setLoadingProfesseurs(false);
      setLoadingInitial(false);
    }
  };

  const fetchAnneeScolaireActive = async () => {
    try {
      const response = await axiosInstance.get('/annees-scolaires/active/');
      if (response.data) {
        setAnneeScolaireActive(response.data);
      }
    } catch (err) {
      console.error('Erreur chargement année scolaire:', err);
    }
  };

  // Mode Professeur - Récupère l'emploi du temps du professeur connecté
  const fetchMonEmploiDuTemps = async () => {
    setLoading(true);
    setError(null);

    try {
      // Utiliser l'endpoint /cours/mes_cours/ pour récupérer les cours du professeur connecté
      const response = await axiosInstance.get('/cours/mes_cours/');
      
      if (response.data) {
        setCours(response.data || []);
        
        const user = getCurrentUser();
        if (user) {
          setProfesseurNom(`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email);
        }
        
        if (response.data.length === 0) {
          toast.info('Aucun cours trouvé pour votre emploi du temps');
        } else {
          toast.success(`${response.data.length} cours chargés`);
        }
      }
    } catch (err) {
      console.error('Erreur chargement emploi du temps:', err);
      
      // Fallback : essayer avec le filtre enseignant
      try {
        const user = getCurrentUser();
        if (user?.id) {
          const profResponse = await axiosInstance.get(`/professeurs/?user=${user.id}`);
          if (profResponse.data && profResponse.data.length > 0) {
            const professeur = profResponse.data[0];
            const params = {
              enseignant: professeur.id
            };
            
            if (anneeScolaireActive) {
              params.annee_scolaire = anneeScolaireActive.id;
            }

            const coursResponse = await axiosInstance.get('/cours/emploi_du_temps/', { params });
            setCours(coursResponse.data || []);
            setProfesseurNom(`${professeur.prenom} ${professeur.nom}`);
          }
        }
      } catch (fallbackErr) {
        console.error('Erreur fallback:', fallbackErr);
        setError('Impossible de charger votre emploi du temps. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
      setLoadingInitial(false);
    }
  };

  // Mode Admin - Récupère l'emploi du temps d'un professeur sélectionné
  const fetchEmploiDuTempsParProfesseur = async (professeurId) => {
    if (!professeurId) {
      setCours([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = {
        enseignant: professeurId
      };
      
      if (anneeScolaireActive) {
        params.annee_scolaire = anneeScolaireActive.id;
      }

      const response = await axiosInstance.get('/cours/emploi_du_temps/', { params });
      setCours(response.data || []);
      
      // Récupérer le nom du professeur
      const prof = professeurs.find(p => p.id === parseInt(professeurId));
      if (prof) {
        setProfesseurNom(`${prof.prenom} ${prof.nom}`);
      }
      
      if (response.data.length === 0) {
        toast.info('Aucun cours trouvé pour ce professeur');
      } else {
        toast.success(`${response.data.length} cours trouvés`);
      }
    } catch (err) {
      console.error('Erreur chargement emploi du temps:', err);
      setError(err.response?.data?.error || 'Erreur lors du chargement');
      setCours([]);
    } finally {
      setLoading(false);
    }
  };

  // ==================== STATISTIQUES ====================

  const calculateStats = () => {
    const statsData = {
      total: cours.length,
      parJour: {},
      parMatiere: {},
      parType: {},
      dureeTotale: 0
    };

    cours.forEach(c => {
      const jourLabel = joursComplet[c.jour] || c.jour;
      statsData.parJour[jourLabel] = (statsData.parJour[jourLabel] || 0) + 1;
      
      statsData.parMatiere[c.matiere_nom] = (statsData.parMatiere[c.matiere_nom] || 0) + 1;
      
      const typeLabel = typeCoursConfig[c.type_cours]?.label || c.type_cours || 'Cours';
      statsData.parType[typeLabel] = (statsData.parType[typeLabel] || 0) + 1;
      
      if (c.heure_debut && c.heure_fin) {
        const debut = new Date(`1970-01-01T${c.heure_debut}`);
        const fin = new Date(`1970-01-01T${c.heure_fin}`);
        statsData.dureeTotale += differenceInMinutes(fin, debut);
      }
    });

    setStats(statsData);
  };

  // ==================== FONCTIONS DE RENDU ====================

  const getCoursForDay = (dayIndex) => {
    const dayName = jours[dayIndex];
    return cours
      .filter(c => c.jour === dayName)
      .sort((a, b) => a.heure_debut?.localeCompare(b.heure_debut) || 0);
  };

  const formatHeure = (heure) => {
    if (!heure) return '';
    return heure.substring(0, 5);
  };

  const getDuree = (debut, fin) => {
    if (!debut || !fin) return null;
    const minutes = differenceInMinutes(
      new Date(`1970-01-01T${fin}`),
      new Date(`1970-01-01T${debut}`)
    );
    if (minutes < 60) return `${minutes}min`;
    const heures = Math.floor(minutes / 60);
    const restes = minutes % 60;
    return restes > 0 ? `${heures}h${restes}` : `${heures}h`;
  };

  // ==================== NAVIGATION ====================

  const prevWeek = () => setCurrentWeekStart(prev => addWeeks(prev, -1));
  const nextWeek = () => setCurrentWeekStart(prev => addWeeks(prev, 1));
  const currentWeek = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // ==================== EXPORT ====================

  const handleExport = (formatType) => {
    if (cours.length === 0) {
      toast.error('Aucun cours à exporter');
      return;
    }

    const exportData = cours.map(c => ({
      'Matière': c.matiere_nom || '',
      'Classe': c.classe_nom || '',
      'Salle': c.salle_nom || '',
      'Jour': joursComplet[c.jour] || c.jour || '',
      'Début': formatHeure(c.heure_debut),
      'Fin': formatHeure(c.heure_fin),
      'Durée': getDuree(c.heure_debut, c.heure_fin) || '',
      'Type': typeCoursConfig[c.type_cours]?.label || c.type_cours || 'Cours',
      'Récurrent': c.est_recurrent ? 'Oui' : 'Non'
    }));

    const prefix = isProfesseur ? 'mon_emploi_du_temps' : `emploi_du_temps_${professeurNom.replace(/\s/g, '_')}`;

    if (formatType === 'csv') {
      const headers = Object.keys(exportData[0]);
      const csv = [
        headers.join(','),
        ...exportData.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${prefix}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      toast.success('Export CSV effectué');
    } else {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json;charset=utf-8;'
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${prefix}_${format(new Date(), 'yyyy-MM-dd')}.json`;
      link.click();
      toast.success('Export JSON effectué');
    }
  };

  // ==================== RENDU DES COURS ====================

  const renderCours = (coursItem, idx) => {
    const duree = getDuree(coursItem.heure_debut, coursItem.heure_fin);
    const typeInfo = typeCoursConfig[coursItem.type_cours] || { label: 'Cours', color: 'badge-ghost' };

    return (
      <div
        key={idx}
        className="bg-base-200 rounded-lg p-2 mb-2 border-l-4 border-primary text-sm hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-primary flex items-center gap-1 truncate">
              <BookOpen className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{coursItem.matiere_nom || 'Sans matière'}</span>
            </div>
            <div className="text-xs text-base-content/70 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 flex-shrink-0" />
              {formatHeure(coursItem.heure_debut)} - {formatHeure(coursItem.heure_fin)}
              {duree && (
                <span className="badge badge-ghost badge-xs ml-1">
                  {duree}
                </span>
              )}
            </div>
            <div className="text-xs text-base-content/70 flex items-center gap-1 truncate">
              <Users className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{coursItem.classe_nom || 'N/A'}</span>
            </div>
            <div className="text-xs text-base-content/70 flex items-center gap-1 truncate">
              <Building2 className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{coursItem.salle_nom || 'N/A'}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
            <span className={`badge badge-xs ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
            {!coursItem.est_recurrent && (
              <span className="badge badge-ghost badge-xs">Ponctuel</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==================== RENDU DE LA GRILLE ====================

  const renderGrid = () => {
    const days = [];
    for (let i = 0; i < 6; i++) {
      const date = addDays(currentWeekStart, i);
      const coursOfDay = getCoursForDay(i);
      const isToday = isSameDay(date, new Date());
      const isPast = date < new Date() && !isToday;

      days.push(
        <div
          key={i}
          className={`border rounded-lg p-2 min-h-[200px] transition-colors ${
            isToday ? 'border-primary bg-primary/5 shadow-md' :
            isPast ? 'border-base-300 bg-base-200/50' :
            'border-base-300 bg-base-100'
          }`}
        >
          <div
            className={`text-center font-semibold text-sm py-1 rounded mb-2 ${
              isToday ? 'bg-primary text-primary-content' :
              isPast ? 'bg-base-300 text-base-content/70' :
              'bg-base-200'
            }`}
          >
            {joursDisplay[jours[i]]}
            <span className="text-xs font-normal ml-1">
              {format(date, 'dd/MM', { locale: fr })}
            </span>
            {isToday && (
              <span className="badge badge-primary badge-xs ml-1">Aujourd'hui</span>
            )}
          </div>
          <div className="space-y-1 max-h-[500px] overflow-y-auto custom-scrollbar">
            {coursOfDay.length === 0 ? (
              <div className="text-center text-xs text-base-content/40 py-4">-</div>
            ) : (
              coursOfDay.map((c, idx) => renderCours(c, idx))
            )}
          </div>
          <div className="text-xs text-center text-base-content/40 mt-1">
            {coursOfDay.length > 0 && `${coursOfDay.length} cours`}
          </div>
        </div>
      );
    }
    return days;
  };

  // ==================== RENDU DES STATISTIQUES ====================

  const renderStats = () => {
    if (cours.length === 0) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-base-100 rounded-lg p-3 shadow-sm border border-base-300">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <FileText className="w-5 h-5 text-primary/50" />
          </div>
          <div className="text-xs text-base-content/60">Total cours</div>
        </div>
        <div className="bg-base-100 rounded-lg p-3 shadow-sm border border-base-300">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-secondary">
              {Object.keys(stats.parJour).length}
            </div>
            <CalendarDays className="w-5 h-5 text-secondary/50" />
          </div>
          <div className="text-xs text-base-content/60">Jours avec cours</div>
        </div>
        <div className="bg-base-100 rounded-lg p-3 shadow-sm border border-base-300">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-accent">
              {Object.keys(stats.parMatiere).length}
            </div>
            <BookMarked className="w-5 h-5 text-accent/50" />
          </div>
          <div className="text-xs text-base-content/60">Matières différentes</div>
        </div>
        <div className="bg-base-100 rounded-lg p-3 shadow-sm border border-base-300">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-info">
              {Math.round(stats.dureeTotale / 60)}h
            </div>
            <Timer className="w-5 h-5 text-info/50" />
          </div>
          <div className="text-xs text-base-content/60">Durée totale</div>
        </div>
      </div>
    );
  };

  // ==================== RENDU PRINCIPAL ====================

  // Chargement initial
  if (loadingInitial) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-base-content/60">Chargement...</p>
        </div>
      </div>
    );
  }

  // Vérifier si l'utilisateur a accès
  if (!isProfesseur && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center p-8 bg-base-100 rounded-xl shadow-lg max-w-md">
          <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-error">Accès refusé</h2>
          <p className="text-base-content/70 mt-2">
            Vous n'avez pas les droits pour accéder à cette page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="btn btn-primary mt-4"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="w-8 h-8 text-primary" />
              {isProfesseur ? 'Mon Emploi du Temps' : 'Emploi du temps - Professeur'}
            </h1>
            <p className="text-sm text-base-content/60 flex items-center gap-2">
              {isProfesseur ? (
                <>
                  <User className="w-4 h-4" />
                  {professeurNom || 'Professeur'}
                </>
              ) : (
                <>
                  <UsersIcon className="w-4 h-4" />
                  Consultez l'emploi du temps d'un professeur
                </>
              )}
              {anneeScolaireActive && (
                <span className="ml-2 badge badge-primary badge-sm">
                  {anneeScolaireActive.libelle}
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className="btn btn-ghost btn-sm gap-2"
            >
              <FileText className="w-4 h-4" />
              Stats
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="btn btn-outline btn-sm gap-2"
              disabled={cours.length === 0}
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={() => window.print()}
              className="btn btn-outline btn-sm gap-2"
              disabled={cours.length === 0}
            >
              <Printer className="w-4 h-4" />
              Imprimer
            </button>
            <button
              onClick={isProfesseur ? fetchMonEmploiDuTemps : () => fetchEmploiDuTempsParProfesseur(selectedProfesseur)}
              className="btn btn-ghost btn-sm gap-2"
              disabled={loading || (isAdmin && !selectedProfesseur)}
            >
              <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Mode Admin : Sélection du professeur */}
        {isAdmin && (
          <div className="bg-base-100 rounded-xl shadow-sm p-4 mb-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="form-control flex-1 min-w-[200px]">
                <label className="label label-text flex items-center gap-2">
                  <UsersIcon className="w-4 h-4" />
                  Sélectionner un professeur
                </label>
                <select
                  className="select select-bordered w-full"
                  value={selectedProfesseur}
                  onChange={(e) => setSelectedProfesseur(e.target.value)}
                  disabled={loading || loadingProfesseurs}
                >
                  <option value="">Choisir un professeur...</option>
                  {professeurs.map((prof) => (
                    <option key={prof.id} value={prof.id}>
                      {prof.prenom} {prof.nom} {prof.matricule ? `(${prof.matricule})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <button
                  className="btn btn-primary gap-2"
                  onClick={() => fetchEmploiDuTempsParProfesseur(selectedProfesseur)}
                  disabled={!selectedProfesseur || loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  Voir l'emploi du temps
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mode Professeur : Informations du professeur */}
        {isProfesseur && professeurNom && cours.length > 0 && (
          <div className="bg-base-100 rounded-lg p-3 shadow-sm border border-base-300 mb-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <span className="font-medium">{professeurNom}</span>
              <span className="text-sm text-base-content/60 ml-2">
                {currentUser?.email && `(${currentUser.email})`}
              </span>
            </div>
          </div>
        )}

        {/* Statistiques */}
        {showStats && renderStats()}

        {/* Erreur */}
        {error && (
          <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
            <button
              onClick={isProfesseur ? fetchMonEmploiDuTemps : () => fetchEmploiDuTempsParProfesseur(selectedProfesseur)}
              className="btn btn-error btn-sm mt-2"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Navigation semaine */}
        {cours.length > 0 && !error && (
          <div className="flex items-center justify-between mb-4 bg-base-100 rounded-xl shadow-sm p-3">
            <div className="flex items-center gap-2">
              <button
                onClick={prevWeek}
                className="btn btn-ghost btn-sm btn-square"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-medium">
                Semaine du {format(currentWeekStart, 'dd MMMM yyyy', { locale: fr })}
              </span>
              <button
                onClick={nextWeek}
                className="btn btn-ghost btn-sm btn-square"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-base-content/60">
                {cours.length} cours
              </span>
              <button
                onClick={currentWeek}
                className="btn btn-outline btn-sm"
              >
                Aujourd'hui
              </button>
            </div>
          </div>
        )}

        {/* Contenu principal - Grille calendrier */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-base-content/60">
              Chargement de l'emploi du temps...
            </span>
          </div>
        ) : error ? (
          <div className="bg-base-100 rounded-xl shadow-sm p-12 text-center text-error">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">{error}</p>
            <p className="text-sm mt-2">
              Veuillez réessayer ou contacter l'administrateur.
            </p>
            <button
              onClick={isProfesseur ? fetchMonEmploiDuTemps : () => fetchEmploiDuTempsParProfesseur(selectedProfesseur)}
              className="btn btn-primary btn-sm mt-4"
            >
              Réessayer
            </button>
          </div>
        ) : cours.length === 0 ? (
          <div className="bg-base-100 rounded-xl shadow-sm p-12 text-center text-base-content/60">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">Aucun cours à afficher</p>
            <p className="text-sm">
              {isProfesseur 
                ? "Vous n'avez pas encore de cours planifiés."
                : "Sélectionnez un professeur et cliquez sur 'Voir l'emploi du temps'"
              }
            </p>
          </div>
        ) : (
          <div className="bg-base-100 rounded-xl shadow-sm p-4 overflow-x-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 min-w-[700px]">
              {renderGrid()}
            </div>
          </div>
        )}
      </div>

      {/* Styles additionnels */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        
        @media print {
          .btn, 
          .form-control, 
          .no-print {
            display: none !important;
          }
          .bg-base-100, 
          .bg-base-200 {
            background: white !important;
          }
          .border {
            border-color: #ddd !important;
          }
          .shadow-sm {
            box-shadow: none !important;
          }
          .min-h-screen {
            min-height: auto !important;
          }
          .p-4, .p-6 {
            padding: 0.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default EmploiDuTempsProfesseur;