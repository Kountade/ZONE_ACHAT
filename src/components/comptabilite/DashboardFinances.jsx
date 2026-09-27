// src/comptabilite/DashboardFinances.jsx
import React, { useState, useEffect } from 'react';
import {
  Wallet, TrendingUp, TrendingDown, Users, UserCog, UserCheck,
  DollarSign, Percent, AlertCircle, RefreshCw, Loader2,
  ArrowUpRight, ArrowDownRight, Clock
} from 'lucide-react';
import axiosInstance from '../AxiosInstance';
import toast from 'react-hot-toast';

const DashboardFinances = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [annee, setAnnee] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchDashboard();
  }, [annee]);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/comptabilite/dashboard-financier/', {
        params: { annee }
      });
      setData(response.data);
    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
      setError('Impossible de charger le dashboard financier');
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-error">{error}</h3>
          <button onClick={fetchDashboard} className="btn btn-primary mt-4">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Clients',
      value: data?.total_clients || 0,
      icon: Users,
      color: 'primary'
    },
    {
      title: 'Total Professeurs',
      value: data?.total_professeurs || 0,
      icon: UserCog,
      color: 'secondary'
    },
    {
      title: 'Total Surveillants',
      value: data?.total_surveillants || 0,
      icon: UserCheck,
      color: 'info'
    },
    {
      title: 'Total Recettes',
      value: `${(data?.total_recettes || 0).toLocaleString()} FCFA`,
      icon: TrendingUp,
      color: 'success'
    },
    {
      title: 'Total Dépenses',
      value: `${(data?.total_depenses || 0).toLocaleString()} FCFA`,
      icon: TrendingDown,
      color: 'error'
    },
    {
      title: 'Solde',
      value: `${(data?.solde || 0).toLocaleString()} FCFA`,
      icon: Wallet,
      color: 'warning'
    },
    {
      title: 'Encours',
      value: `${(data?.encours || 0).toLocaleString()} FCFA`,
      icon: DollarSign,
      color: 'error'
    },
    {
      title: 'Taux de Recouvrement',
      value: `${data?.taux_recouvrement || 0}%`,
      icon: Percent,
      color: 'success'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="w-8 h-8 text-primary" />
            Dashboard Finances
          </h1>
          <p className="text-sm text-base-content/60">
            Vue d'ensemble de la situation financière
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            className="select select-bordered select-sm"
            value={annee}
            onChange={(e) => setAnnee(Number(e.target.value))}
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button onClick={fetchDashboard} className="btn btn-ghost btn-sm gap-2">
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-base-100 rounded-xl shadow-sm p-4 border border-base-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-base-content/60">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-${card.color}/10 text-${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-base-100 rounded-xl shadow-sm p-4 border border-base-200">
        <h3 className="font-semibold mb-4">Recettes par mois</h3>
        <div className="flex items-end gap-2 h-48">
          {data?.recettes_par_mois && Object.entries(data.recettes_par_mois).map(([mois, montant]) => {
            const max = Math.max(...Object.values(data.recettes_par_mois));
            const height = (montant / max) * 100;
            const moisNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
            return (
              <div key={mois} className="flex-1 flex flex-col items-center">
                <div className="w-full flex justify-center">
                  <div 
                    className="w-8 bg-primary/60 rounded-t hover:bg-primary transition-all"
                    style={{ height: `${Math.max(5, height)}%` }}
                  ></div>
                </div>
                <span className="text-xs text-base-content/40 mt-2">{moisNames[parseInt(mois) - 1]}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-base-100 rounded-xl shadow-sm p-4 border border-base-200">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-error" />
            Top Retardataires
          </h3>
          {data?.top_retardataires?.length > 0 ? (
            <div className="space-y-2">
              {data.top_retardataires.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 hover:bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-base-content/40">#{index + 1}</span>
                    <div>
                      <p className="font-medium">{item.client}</p>
                      <p className="text-xs text-base-content/40">{item.matricule}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-error">{item.solde.toLocaleString()} FCFA</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-base-content/40 py-4">Aucun retardataire</p>
          )}
        </div>

        <div className="bg-base-100 rounded-xl shadow-sm p-4 border border-base-200">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Dernières transactions
          </h3>
          {data?.dernieres_transactions?.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {data.dernieres_transactions.map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-2 hover:bg-base-200 rounded-lg">
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-xs text-base-content/40">
                      {transaction.date_transaction} • {transaction.categorie}
                    </p>
                  </div>
                  <span className={`font-semibold ${transaction.type_transaction === 'credit' ? 'text-success' : 'text-error'}`}>
                    {transaction.type_transaction === 'credit' ? '+' : '-'}{transaction.montant.toLocaleString()} FCFA
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-base-content/40 py-4">Aucune transaction</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardFinances;