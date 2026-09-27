// src/components/academic/EmploiDuTempsAnnuel.jsx
import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, BookOpen, Users, User, Building2,
  Loader2, ChevronLeft, ChevronRight, Search,
  RefreshCw, AlertCircle, Download, Printer,
  FileText, School, CalendarDays,
  ChevronDown, ChevronUp
} from 'lucide-react';
import axiosInstance from '../AxiosInstance';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const EmploiDuTempsAnnuel = () => {
  // États
  const [loading, setLoading] = useState(false);
  const [cours, setCours] = useState([]);
  const [emploiDuTemps, setEmploiDuTemps] = useState([]);
  const [filterType, setFilterType] = useState('classe');
  const [filterValue, setFilterValue] = useState('');
  const [filterOptions, setFilterOptions] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [error, setError] = useState(null);
  const [anneeScolaire, setAnneeScolaire] = useState(null);
  const [anneeScolaires, setAnneeScolaires] = useState([]);

  // Configuration des jours
  const joursComplet = {
    lundi: 'Lundi',
    mardi: 'Mardi',
    mercredi: 'Mercredi',
    jeudi: 'Jeudi',
    vendredi: 'Vendredi',
    samedi: 'Samedi'
  };

  const typeCoursConfig = {
    cours: { label: 'CM', color: 'bg-blue-500' },
    td: { label: 'TD', color: 'bg-green-500' },
    tp: { label: 'TP', color: 'bg-purple-500' }
  };

  // ==================== CHARGEMENT ====================

  useEffect(() => {
    fetchAnneeScolaires();
    fetchAnneeScolaireActive();
    fetchFilterData();
  }, []);

  useEffect(() => {
    if (filterValue && anneeScolaire) {
      fetchEmploiDuTemps();
    }
  }, [filterValue, filterType, currentDate, anneeScolaire]);

  // ==================== API ====================

  const fetchAnneeScolaires = async () => {
    try {
      const response = await axiosInstance.get('/annees-scolaires/');
      setAnneeScolaires(response.data || []);
    } catch (error) {
      console.error('Erreur chargement années scolaires:', error);
    }
  };

  const fetchAnneeScolaireActive = async () => {
    try {
      const response = await axiosInstance.get('/annees-scolaires/active/');
      if (response.data) {
        setAnneeScolaire(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement année scolaire active:', error);
    }
  };

  const fetchFilterData = async () => {
    try {
      let options = [];
      if (filterType === 'classe') {
        const response = await axiosInstance.get('/classes/');
        options = response.data.map(c => ({ value: c.id, label: c.nom }));
      } else if (filterType === 'enseignant') {
        const response = await axiosInstance.get('/professeurs/');
        options = response.data.map(p => ({ value: p.id, label: `${p.prenom} ${p.nom}` }));
      } else if (filterType === 'salle') {
        const response = await axiosInstance.get('/salles/');
        options = response.data.map(s => ({ value: s.id, label: s.nom }));
      }
      setFilterOptions(options);
    } catch (error) {
      console.error('Erreur chargement options:', error);
      toast.error('Erreur lors du chargement des données');
    }
  };

  const fetchEmploiDuTemps = async () => {
    if (!filterValue || !anneeScolaire) return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      
      if (filterType === 'classe') params.append('classe', filterValue);
      else if (filterType === 'enseignant') params.append('enseignant', filterValue);
      else if (filterType === 'salle') params.append('salle', filterValue);

      params.append('annee_scolaire', anneeScolaire.id);
      
      const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd');
      params.append('date_debut', monthStart);
      params.append('date_fin', monthEnd);

      const response = await axiosInstance.get(
        `/cours/emploi_du_temps_complet/?${params.toString()}`
      );

      setEmploiDuTemps(response.data.emploi_du_temps || []);
      const allCours = response.data.emploi_du_temps?.flatMap(j => j.cours) || [];
      setCours(allCours);

      if (allCours.length === 0) {
        toast('Aucun cours trouvé', { duration: 3000 });
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError(error.response?.data?.error || 'Impossible de charger l\'emploi du temps');
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  // ==================== NAVIGATION ====================

  const prevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const nextMonth = () => setCurrentDate(prev => addMonths(prev, 1));

  const handleFilterChange = (type) => {
    setFilterType(type);
    setFilterValue('');
    setCours([]);
    setEmploiDuTemps([]);
    fetchFilterData();
  };

  // ==================== RENDU ====================

  const getCoursForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const jour = emploiDuTemps.find(j => j.date === dateStr);
    return jour ? jour.cours : [];
  };

  const formatHeure = (heure) => {
    if (!heure) return '';
    return heure.substring(0, 5);
  };

  const renderCours = (coursItem) => {
    const isException = coursItem.est_exception;
    const isAnnule = coursItem.est_annule;
    const typeInfo = typeCoursConfig[coursItem.type_cours] || { label: 'Cours', color: 'bg-gray-500' };

    return (
      <div
        key={coursItem.id}
        className={`rounded p-1.5 mb-1 text-xs ${
          isAnnule ? 'opacity-50 line-through bg-gray-100' :
          isException ? 'bg-yellow-50 border-l-2 border-yellow-500' :
          'bg-blue-50 border-l-2 border-blue-500'
        }`}
      >
        <div className="font-semibold text-blue-700 truncate text-[11px]">
          {coursItem.matiere_nom || 'Sans matière'}
          {isException && <span className="ml-1 text-yellow-600 text-[9px]">(Exception)</span>}
          {isAnnule && <span className="ml-1 text-red-500 text-[9px]">(Annulé)</span>}
        </div>
        <div className="text-gray-600 text-[10px]">
          {formatHeure(coursItem.heure_debut)} - {formatHeure(coursItem.heure_fin)}
        </div>
        <div className="text-gray-500 text-[9px] truncate">
          {coursItem.enseignant_nom || 'N/A'}
        </div>
        {coursItem.raison_ajustement && (
          <div className="text-yellow-600 text-[8px] truncate">
            ⚠️ {coursItem.raison_ajustement}
          </div>
        )}
      </div>
    );
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    // Créer un tableau de tous les jours du mois
    const days = [];
    const start = new Date(monthStart);
    while (start <= monthEnd) {
      days.push(new Date(start));
      start.setDate(start.getDate() + 1);
    }

    // Obtenir le premier jour de la semaine (lundi = 1)
    const firstDay = monthStart.getDay() || 7;
    const padding = firstDay - 1;

    const grid = [];
    
    // Jours vides
    for (let i = 0; i < padding; i++) {
      grid.push(
        <div key={`empty-${i}`} className="border rounded p-1.5 min-h-[100px] bg-gray-50">
        </div>
      );
    }

    // Jours du mois
    days.forEach(date => {
      const coursOfDay = getCoursForDay(date);
      const isToday = isSameDay(date, new Date());
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      grid.push(
        <div
          key={format(date, 'yyyy-MM-dd')}
          className={`border rounded p-1.5 min-h-[100px] transition-colors ${
            isToday ? 'border-blue-500 bg-blue-50 shadow-md' :
            isWeekend ? 'bg-gray-50 border-gray-200' :
            'border-gray-200 bg-white'
          }`}
        >
          <div className={`text-center font-semibold text-xs py-0.5 rounded ${
            isToday ? 'bg-blue-500 text-white' :
            isWeekend ? 'bg-gray-200 text-gray-500' :
            'bg-gray-100 text-gray-700'
          }`}>
            {format(date, 'd', { locale: fr })}
            <span className="text-[9px] font-normal ml-0.5 text-gray-500">
              {format(date, 'EEE', { locale: fr })}
            </span>
            {isToday && <span className="badge badge-primary badge-xs ml-0.5">Auj</span>}
          </div>

          <div className="space-y-0.5 max-h-[120px] overflow-y-auto mt-0.5">
            {coursOfDay.length === 0 ? (
              <div className="text-center text-gray-400 text-[10px] py-1">-</div>
            ) : (
              coursOfDay.map(c => renderCours(c))
            )}
          </div>
          
          {coursOfDay.length > 0 && (
            <div className="text-center text-gray-400 text-[8px] mt-0.5 border-t border-gray-100 pt-0.5">
              {coursOfDay.length} cours
            </div>
          )}
        </div>
      );
    });

    return grid;
  };

  // ==================== EXPORT ====================

  const handleExport = () => {
    if (cours.length === 0) {
      toast.error('Aucun cours à exporter');
      return;
    }

    const exportData = cours.map(c => ({
      'Matière': c.matiere_nom || '',
      'Enseignant': c.enseignant_nom || '',
      'Classe': c.classe_nom || '',
      'Salle': c.salle_nom || '',
      'Jour': joursComplet[c.jour] || c.jour || '',
      'Début': formatHeure(c.heure_debut),
      'Fin': formatHeure(c.heure_fin),
      'Type': typeCoursConfig[c.type_cours]?.label || c.type_cours || 'Cours',
      'Exception': c.est_exception ? 'Oui' : 'Non',
      'Annulé': c.est_annule ? 'Oui' : 'Non'
    }));

    const headers = Object.keys(exportData[0]);
    const csv = [
      headers.join(','),
      ...exportData.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `emploi_du_temps_${format(currentDate, 'MM-yyyy')}.csv`;
    link.click();
    toast.success('Export CSV effectué');
  };

  // ==================== RENDU PRINCIPAL ====================

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2 text-gray-800">
              <Calendar className="w-6 h-6 text-blue-600" />
              Emploi du temps annuel
            </h1>
            <p className="text-sm text-gray-500">
              Visualisez les cours par classe, professeur ou salle
              {anneeScolaire && (
                <span className="ml-2 badge badge-primary badge-sm">
                  {anneeScolaire.libelle}
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExport}
              className="btn btn-outline btn-sm gap-1"
              disabled={cours.length === 0}
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={() => window.print()}
              className="btn btn-outline btn-sm gap-1"
              disabled={cours.length === 0}
            >
              <Printer className="w-4 h-4" />
              Imprimer
            </button>
            <button
              onClick={() => {
                setFilterValue('');
                setCours([]);
                setEmploiDuTemps([]);
              }}
              className="btn btn-ghost btn-sm gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow p-3 mb-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="form-control">
              <label className="label label-text text-xs">Afficher pour</label>
              <select
                className="select select-bordered select-sm"
                value={filterType}
                onChange={(e) => handleFilterChange(e.target.value)}
                disabled={loading}
              >
                <option value="classe">Classe</option>
                <option value="enseignant">Professeur</option>
                <option value="salle">Salle</option>
              </select>
            </div>
            <div className="form-control flex-1 min-w-[150px]">
              <label className="label label-text text-xs">Sélectionner</label>
              <select
                className="select select-bordered select-sm w-full"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                disabled={loading || filterOptions.length === 0}
              >
                <option value="">
                  {filterOptions.length === 0 ? 'Chargement...' : 'Sélectionner'}
                </option>
                {filterOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-control">
              <label className="label label-text text-xs">Année</label>
              <select
                className="select select-bordered select-sm"
                value={anneeScolaire?.id || ''}
                onChange={(e) => {
                  const selected = anneeScolaires.find(a => a.id === parseInt(e.target.value));
                  setAnneeScolaire(selected);
                }}
              >
                {anneeScolaires.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.libelle} {a.est_active ? '⭐' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-control">
              <button
                className="btn btn-primary btn-sm gap-1"
                onClick={fetchEmploiDuTemps}
                disabled={!filterValue || loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Afficher
              </button>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        {cours.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            <div className="bg-white rounded-lg shadow p-2 text-center border">
              <div className="text-xl font-bold text-blue-600">{cours.length}</div>
              <div className="text-xs text-gray-500">Total cours</div>
            </div>
            <div className="bg-white rounded-lg shadow p-2 text-center border">
              <div className="text-xl font-bold text-green-600">
                {new Set(cours.map(c => c.matiere_nom)).size}
              </div>
              <div className="text-xs text-gray-500">Matières</div>
            </div>
            <div className="bg-white rounded-lg shadow p-2 text-center border">
              <div className="text-xl font-bold text-purple-600">
                {new Set(cours.map(c => c.enseignant_nom)).size}
              </div>
              <div className="text-xs text-gray-500">Enseignants</div>
            </div>
            <div className="bg-white rounded-lg shadow p-2 text-center border">
              <div className="text-xl font-bold text-orange-600">
                {cours.filter(c => c.est_exception).length}
              </div>
              <div className="text-xs text-gray-500">Exceptions</div>
            </div>
          </div>
        )}

        {/* Navigation mois */}
        {cours.length > 0 && !error && (
          <div className="flex items-center justify-between mb-3 bg-white rounded-lg shadow p-2">
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="btn btn-ghost btn-sm btn-square">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-medium text-sm">
                {format(currentDate, 'MMMM yyyy', { locale: fr })}
              </span>
              <button onClick={nextMonth} className="btn btn-ghost btn-sm btn-square">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{cours.length} cours</span>
              <button 
                onClick={() => setCurrentDate(new Date())} 
                className="btn btn-outline btn-xs"
              >
                Aujourd'hui
              </button>
            </div>
          </div>
        )}

        {/* Contenu */}
        {loading ? (
          <div className="flex items-center justify-center h-48 bg-white rounded-lg shadow">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-500">Chargement...</span>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-red-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-base font-medium">{error}</p>
            <button onClick={fetchEmploiDuTemps} className="btn btn-primary btn-sm mt-3">
              Réessayer
            </button>
          </div>
        ) : cours.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-base font-medium">Aucun cours à afficher</p>
            <p className="text-sm">Sélectionnez un filtre et cliquez sur Afficher</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-2 overflow-x-auto">
            <div className="grid grid-cols-7 gap-1">
              {/* En-têtes des jours */}
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, i) => (
                <div key={i} className="text-center font-semibold text-xs text-gray-600 py-1 bg-gray-100 rounded">
                  {day}
                </div>
              ))}
              {/* Calendrier */}
              {renderCalendar()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmploiDuTempsAnnuel;