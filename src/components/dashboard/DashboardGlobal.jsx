// src/components/dashboard/DashboardGlobal.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import AxiosInstance from '../AxiosInstance';
import {
  Users, School, BookOpen, UserCog,
  TrendingUp, TrendingDown, DollarSign, AlertTriangle,
  CheckCircle, Loader2, RefreshCw,
  PieChart, Activity, FileText, Wallet, AlertCircle,
  ArrowUpRight, ArrowDownRight, UserRound, ClipboardList,
  Building2, Award
} from 'lucide-react';

ChartJS.register(
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement
);

const DashboardGlobal = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const token = localStorage.getItem('Token');
      if (!token) {
        navigate('/login');
        return;
      }

      const headers = { Authorization: `Token ${token}` };

      // ✅ Essaie plusieurs URLs dans l'ordre (compatible avec les 2 backends)
      const urlsToTry = [
        '/dashboard/global/',   // Si backend avec préfixe (recommandé)
        '/global/',             // Si backend sans préfixe
      ];

      let lastError = null;
      let response = null;

      for (const url of urlsToTry) {
        try {
          response = await AxiosInstance.get(url, { headers });
          console.log(`✅ Succès sur ${url}`);
          break;
        } catch (err) {
          lastError = err;
          console.warn(`❌ Échec sur ${url} (${err.response?.status})`);
        }
      }

      if (!response) {
        throw lastError || new Error('Aucune URL fonctionnelle');
      }

      setData(response.data);
    } catch (err) {
      console.error('❌ Erreur dashboard:', err);
      const status = err.response?.status;
      const triedUrls = '/dashboard/global/ et /global/';

      if (status === 401) {
        navigate('/login');
      } else if (status === 403) {
        setError("Accès refusé — vous n'avez pas les droits nécessaires.");
      } else if (status === 404) {
        setError(
          `URL non trouvée. Testé : ${triedUrls}. ` +
          `Vérifiez que backend/urls.py contient : ` +
          `path('dashboard/', include('dashboard.urls'))`
        );
      } else if (err.code === 'ERR_NETWORK') {
        setError("Serveur injoignable — Django est-il lancé sur http://127.0.0.1:8000 ?");
      } else {
        setError(err.response?.data?.detail || err.message || "Erreur inconnue");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fmt = (n) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));
  const fmtCFA = (n) => `${fmt(n)} FCFA`;
  const fmtDate = (d) => {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    } catch { return '-'; }
  };

  // ============================================================
  // CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-200">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-base-content/60">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERREUR
  // ============================================================
  if (error) {
    return (
      <div className="p-4 md:p-6 bg-base-200 min-h-screen">
        <div className="max-w-2xl mx-auto mt-20">
          <div className="alert alert-error shadow-lg">
            <AlertTriangle className="w-6 h-6" />
            <div className="flex-1">
              <p className="font-bold">Erreur</p>
              <p className="text-sm">{error}</p>
            </div>
            <button className="btn btn-sm btn-ghost" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" /> Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center bg-base-200 min-h-screen">
        <p className="text-base-content/60">Aucune donnée disponible</p>
      </div>
    );
  }

  // ============================================================
  // EXTRACTION
  // ============================================================
  const g = data.stats_globales || {};
  const f = data.stats_financieres || {};
  const e = data.stats_evaluations || {};
  const repartitionNiveaux = Array.isArray(data.repartition_niveaux) ? data.repartition_niveaux : [];
  const recettesMois = Array.isArray(data.recettes_par_mois) ? data.recettes_par_mois : [];
  const topRetardataires = Array.isArray(data.top_retardataires) ? data.top_retardataires : [];
  const dernieresInscriptions = Array.isArray(data.dernieres_inscriptions) ? data.dernieres_inscriptions : [];
  const dernieresTransactions = Array.isArray(data.dernieres_transactions) ? data.dernieres_transactions : [];
  const dernieresEvaluations = Array.isArray(data.dernieres_evaluations) ? data.dernieres_evaluations : [];

  // ============================================================
  // GRAPHIQUES
  // ============================================================
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
                  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

  const pieNiveauxData = {
    labels: repartitionNiveaux.map(n => n.nom),
    datasets: [{
      label: 'Élèves',
      data: repartitionNiveaux.map(n => n.nb_eleves),
      backgroundColor: repartitionNiveaux.map((_, i) => colors[i % colors.length]),
      borderColor: '#ffffff',
      borderWidth: 2,
    }],
  };

  const pieOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#6b7280', font: { size: 11 }, padding: 10 }
      },
    },
    maintainAspectRatio: false,
  };

  const barRecettesData = {
    labels: recettesMois.map(m => m.label),
    datasets: [{
      label: 'Recettes (FCFA)',
      data: recettesMois.map(m => m.montant),
      backgroundColor: '#10b981',
      borderRadius: 6,
    }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => fmtCFA(ctx.raw) } },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (v) => fmt(v), color: '#6b7280' },
        grid: { color: '#f3f4f6' }
      },
      x: { ticks: { color: '#6b7280' }, grid: { display: false } },
    },
  };

  return (
    <div className="p-4 md:p-6 bg-base-200 min-h-screen">

      {/* EN-TÊTE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Tableau de bord
          </h1>
          <p className="text-base-content/60 text-sm mt-1">
            Vue d'ensemble de l'établissement • {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            })}
          </p>
        </div>
        <button onClick={fetchData} disabled={isRefreshing} className="btn btn-primary gap-2">
          {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Actualiser
        </button>
      </div>

      {/* STATS GLOBALES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard icon={Users} color="primary" label="Élèves"
          value={fmt(g.eleves_total)} sub={`${fmt(g.eleves_actifs)} actifs`}
          onClick={() => navigate('/eleves')} />
        <StatCard icon={UserCog} color="info" label="Professeurs"
          value={fmt(g.professeurs_total)} sub={`${fmt(g.professeurs_actifs)} actifs`}
          onClick={() => navigate('/professeurs')} />
        <StatCard icon={School} color="success" label="Classes"
          value={fmt(g.classes_total)} sub={`${fmt(g.niveaux_total)} niveaux`}
          onClick={() => navigate('/classes')} />
        <StatCard icon={BookOpen} color="warning" label="Matières"
          value={fmt(g.matieres_total)} sub={`${fmt(g.cours_total)} cours`}
          onClick={() => navigate('/matieres')} />
        <StatCard icon={ClipboardList} color="secondary" label="Évaluations"
          value={fmt(e.total_evaluations)} sub={`${fmt(e.total_notes)} notes`}
          onClick={() => navigate('/evaluations')} />
        <StatCard icon={UserRound} color="accent" label="Utilisateurs"
          value={fmt(g.utilisateurs_total)} sub={`${fmt(g.users_eleves)} élèves`} />
      </div>

      {/* STATS FINANCIÈRES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <StatCardBig icon={TrendingUp} color="success" label="Recettes totales"
          value={fmtCFA(f.total_recettes)}
          sub={`Taux recouvrement : ${f.taux_recouvrement || 0}%`} />
        <StatCardBig icon={TrendingDown} color="error" label="Dépenses totales"
          value={fmtCFA(f.total_depenses)} sub={`Solde : ${fmtCFA(f.solde)}`} />
        <StatCardBig icon={Wallet} color="warning" label="Encours"
          value={fmtCFA(f.encours)} sub={`${fmt(f.total_clients)} clients`} />
        <StatCardBig icon={AlertTriangle} color="error" label="Échéances en retard"
          value={fmt(f.total_echeances_retard)} sub={`${fmt(f.total_transactions)} transactions`} />
      </div>

      {/* GRAPHIQUES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                Répartition des élèves par niveau
              </h3>
              <button onClick={() => navigate('/niveaux')} className="text-xs text-primary hover:underline">
                Voir tout
              </button>
            </div>
            {repartitionNiveaux.length > 0 ? (
              <div className="h-64">
                <Pie data={pieNiveauxData} options={pieOptions} />
              </div>
            ) : (
              <p className="text-center text-base-content/40 py-10">Aucune donnée</p>
            )}
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Recettes — 12 derniers mois
              </h3>
              <span className="text-xs text-base-content/60">
                Total : {fmtCFA(recettesMois.reduce((a, m) => a + m.montant, 0))}
              </span>
            </div>
            <div className="h-64">
              <Bar data={barRecettesData} options={barOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* DÉTAIL NIVEAUX */}
      <div className="card bg-base-100 shadow-md mb-6">
        <div className="card-body p-5">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-primary" />
            Détail des niveaux
          </h3>
          <div className="space-y-3">
            {repartitionNiveaux.length === 0 ? (
              <p className="text-center text-base-content/40 py-6">Aucun niveau</p>
            ) : (
              repartitionNiveaux.map(n => {
                const max = Math.max(...repartitionNiveaux.map(x => x.nb_eleves), 1);
                return (
                  <div key={n.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{n.nom}</span>
                        <span className="badge badge-sm badge-ghost">{n.cycle_display}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-base-content/60">{n.nb_classes} classe(s)</span>
                        <span className="font-bold text-primary">{fmt(n.nb_eleves)} élèves</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-base-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all"
                           style={{ width: `${(n.nb_eleves / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* TABLEAUX */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-error" />
                Top retardataires
              </h3>
              <button onClick={() => navigate('/comptabilite/recouvrement')}
                      className="text-xs text-primary hover:underline">Voir tout</button>
            </div>
            <div className="divider my-2"></div>
            {topRetardataires.length === 0 ? (
              <p className="text-center text-base-content/40 py-6">🎉 Aucun retardataire</p>
            ) : (
              <div className="space-y-2">
                {topRetardataires.map(c => (
                  <div key={c.id} onClick={() => navigate(`/eleves/${c.id}`)}
                       className="flex items-center justify-between p-2 rounded-lg hover:bg-base-200 cursor-pointer transition-colors">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0">
                        <UserRound className="w-4 h-4 text-error" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{c.nom}</p>
                        <p className="text-xs text-base-content/50 font-mono truncate">
                          {c.matricule} • {c.classe || 'Sans classe'}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-error whitespace-nowrap ml-2">
                      {fmtCFA(c.solde)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Dernières inscriptions
              </h3>
              <button onClick={() => navigate('/eleves')}
                      className="text-xs text-primary hover:underline">Voir tout</button>
            </div>
            <div className="divider my-2"></div>
            <div className="space-y-2">
              {dernieresInscriptions.length === 0 ? (
                <p className="text-center text-base-content/40 py-6">Aucune inscription récente</p>
              ) : (
                dernieresInscriptions.map(el => (
                  <div key={el.id} onClick={() => navigate(`/eleves/${el.id}`)}
                       className="flex items-center justify-between p-2 rounded-lg hover:bg-base-200 cursor-pointer transition-colors">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <UserRound className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{el.nom}</p>
                        <p className="text-xs text-base-content/50 font-mono truncate">
                          {el.matricule} • {el.classe}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {el.a_un_user ? (
                        <CheckCircle className="w-4 h-4 text-success" title="Compte user créé" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-warning" title="Pas de compte" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TRANSACTIONS + ÉVALUATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Dernières transactions
              </h3>
              <button onClick={() => navigate('/comptabilite/transactions')}
                      className="text-xs text-primary hover:underline">Voir tout</button>
            </div>
            <div className="divider my-2"></div>
            <div className="space-y-2">
              {dernieresTransactions.length === 0 ? (
                <p className="text-center text-base-content/40 py-6">Aucune transaction</p>
              ) : (
                dernieresTransactions.map(t => (
                  <div key={t.id}
                       className="flex items-center justify-between p-2 rounded-lg hover:bg-base-200 transition-colors">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {t.type === 'Crédit (Payé)' ? (
                        <ArrowUpRight className="w-4 h-4 text-success flex-shrink-0" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-error flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{t.categorie}</p>
                        <p className="text-xs text-base-content/50 truncate">
                          {t.client || '—'} • {fmtDate(t.date)}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold whitespace-nowrap ml-2 ${
                      t.type === 'Crédit (Payé)' ? 'text-success' : 'text-error'
                    }`}>
                      {fmtCFA(t.montant)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Dernières évaluations
              </h3>
              <button onClick={() => navigate('/evaluations')}
                      className="text-xs text-primary hover:underline">Voir tout</button>
            </div>
            <div className="divider my-2"></div>
            <div className="space-y-2">
              {dernieresEvaluations.length === 0 ? (
                <p className="text-center text-base-content/40 py-6">Aucune évaluation</p>
              ) : (
                dernieresEvaluations.map(ev => (
                  <div key={ev.id}
                       className="flex items-center justify-between p-2 rounded-lg hover:bg-base-200 cursor-pointer transition-colors">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center flex-shrink-0">
                        <Award className="w-4 h-4 text-info" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{ev.titre}</p>
                        <p className="text-xs text-base-content/50 truncate">
                          {ev.matiere} • {ev.niveau} • {fmtDate(ev.date)}
                        </p>
                      </div>
                    </div>
                    <span className={`badge badge-sm ${ev.est_publie ? 'badge-success' : 'badge-warning'}`}>
                      {ev.est_publie ? 'Publiée' : 'En attente'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BILAN */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-4 text-center">
            <p className="text-xs text-base-content/60 uppercase">Évaluations</p>
            <p className="text-2xl font-bold text-primary">{fmt(e.total_evaluations)}</p>
          </div>
        </div>
        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-4 text-center">
            <p className="text-xs text-base-content/60 uppercase">Publiées</p>
            <p className="text-2xl font-bold text-success">{fmt(e.evaluations_publiees)}</p>
          </div>
        </div>
        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-4 text-center">
            <p className="text-xs text-base-content/60 uppercase">Notes saisies</p>
            <p className="text-2xl font-bold text-info">{fmt(e.total_notes)}</p>
          </div>
        </div>
        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-4 text-center">
            <p className="text-xs text-base-content/60 uppercase">Moyenne globale</p>
            <p className="text-2xl font-bold text-warning">
              {e.moyenne_globale ? Number(e.moyenne_globale).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

// ============================================================
// COMPOSANTS UTILITAIRES
// ============================================================
const StatCard = ({ icon: Icon, color, label, value, sub, onClick }) => {
  const colorMap = {
    primary: 'text-primary bg-primary/10',
    info: 'text-info bg-info/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    error: 'text-error bg-error/10',
    secondary: 'text-secondary bg-secondary/10',
    accent: 'text-accent bg-accent/10',
  };
  const cls = colorMap[color] || colorMap.primary;
  return (
    <div onClick={onClick}
         className={`card bg-base-100 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all ${onClick ? 'cursor-pointer' : ''}`}>
      <div className="card-body p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cls}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-xs text-base-content/60 uppercase">{label}</span>
        </div>
        <p className="text-2xl font-bold text-base-content">{value}</p>
        {sub && <p className="text-xs text-base-content/40 mt-1">{sub}</p>}
      </div>
    </div>
  );
};

const StatCardBig = ({ icon: Icon, color, label, value, sub }) => {
  const colorMap = {
    success: 'text-success bg-success/10',
    error: 'text-error bg-error/10',
    warning: 'text-warning bg-warning/10',
    primary: 'text-primary bg-primary/10',
  };
  const cls = colorMap[color] || colorMap.primary;
  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body p-5">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${cls}`}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-xs text-base-content/60 uppercase mb-1">{label}</p>
        <p className="text-xl font-bold text-base-content">{value}</p>
        {sub && <p className="text-xs text-base-content/40 mt-1">{sub}</p>}
      </div>
    </div>
  );
};

export default DashboardGlobal;