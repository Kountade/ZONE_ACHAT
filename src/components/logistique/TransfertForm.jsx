
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle, Package,
  Building2, Plus, Trash2, Info, Eye, FileText, ArrowRight,
  ArrowLeftRight, Boxes, AlertTriangle, Sparkles,
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const TransfertForm = () => {
  const navigate = useNavigate();

  // ============================================================
  // ETATS
  // ============================================================

  const [chargementInitial, setChargementInitial] = useState(true);
  const [chargementStocks, setChargementStocks] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  // Données
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [stockMap, setStockMap] = useState({});

  // Formulaire
  const [formData, setFormData] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    items: [],
    reason: '',
    notes: '',
  });

  // ============================================================
  // CHARGEMENT INITIAL OPTIMISE
  // ============================================================

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const loadData = async () => {
      const token = localStorage.getItem('Token');

      if (!token) {
        navigate('/login');
        return;
      }

      const config = {
        headers: { Authorization: `Token ${token}` },
        signal: controller.signal,
      };

      try {
        // Chargement simultané des entrepôts et produits
        const [whResult, prResult] = await Promise.allSettled([
          AxiosInstance.get(
            '/warehouses/?active=true&page_size=200',
            config
          ),

          (async () => {
            try {
              return await AxiosInstance.get(
                '/products/brief/',
                config
              );
            } catch (error) {
              if (controller.signal.aborted) throw error;

              return await AxiosInstance.get(
                '/products/?status=active&page_size=500',
                config
              );
            }
          })(),
        ]);

        if (!isMounted) return;

        // Entrepôts
        if (whResult.status === 'fulfilled') {
          const data = whResult.value.data;
          setWarehouses(data.results || data || []);
        } else {
          if (whResult.reason.response?.status === 401) {
            navigate('/login');
            return;
          }

          setErreur('Impossible de charger les entrepôts.');
        }

        // Produits
        if (prResult.status === 'fulfilled') {
          const data = prResult.value.data;
          setProducts(data.results || data || []);
        } else {
          if (prResult.reason.response?.status === 401) {
            navigate('/login');
            return;
          }

          setProducts([]);
          setErreur('Impossible de charger les produits.');
        }

      } catch (error) {
        if (isMounted && !controller.signal.aborted) {
          if (error.response?.status === 401) {
            navigate('/login');
          } else {
            setErreur('Erreur lors du chargement des données.');
          }
        }
      } finally {
        if (isMounted) {
          setChargementInitial(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [navigate]);

  // ============================================================
  // CHARGEMENT DES STOCKS OPTIMISE
  // ============================================================

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    if (!formData.fromWarehouseId) {
      setStockMap({});
      setChargementStocks(false);

      return () => {
        isMounted = false;
        controller.abort();
      };
    }

    const fetchStocks = async () => {
      setChargementStocks(true);
      setStockMap({});

      try {
        const token = localStorage.getItem('Token');

        const config = {
          headers: { Authorization: `Token ${token}` },
          signal: controller.signal,
        };

        let stocksData = [];

        try {
          const res = await AxiosInstance.get(
            `/stocks/brief/?warehouse=${formData.fromWarehouseId}`,
            config
          );

          stocksData = res.data.results || res.data || [];

        } catch (error) {
          if (controller.signal.aborted) return;

          const res = await AxiosInstance.get(
            `/stocks/?warehouse=${formData.fromWarehouseId}&page_size=1000`,
            config
          );

          stocksData = res.data.results || res.data || [];
        }

        if (!isMounted) return;

        const map = {};

        stocksData.forEach((s) => {
          map[s.product] = {
            quantity: s.quantity || 0,
            available_quantity: s.available_quantity || 0,
          };
        });

        setStockMap(map);

      } catch (error) {
        if (isMounted && !controller.signal.aborted) {
          setStockMap({});
        }
      } finally {
        if (isMounted) {
          setChargementStocks(false);
        }
      }
    };

    fetchStocks();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [formData.fromWarehouseId]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFromWarehouseChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      fromWarehouseId: e.target.value,
      items: [],
    }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Date.now() + Math.random(),
          productId: '',
          quantity: 1,
        },
      ],
    }));
  };

  const removeItem = (itemId) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
  };

  const updateItem = (itemId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId
          ? { ...item, [field]: value }
          : item
      ),
    }));
  };

  // ============================================================
  // HELPERS
  // ============================================================

  const getAvailableStock = (productId) => {
    if (!formData.fromWarehouseId || !productId) return 0;

    return stockMap[productId]?.available_quantity || 0;
  };

  const availableProducts = products.filter(
    (p) => (stockMap[p.id]?.available_quantity || 0) > 0
  );

  const destinationWarehouses = warehouses.filter(
    (wh) => String(wh.id) !== String(formData.fromWarehouseId)
  );

  const totalItems = formData.items.length;

  const totalQuantity = formData.items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );

  // ============================================================
  // VALIDATION ET ENREGISTREMENT
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (chargement) return;

    setErreur(null);
    setSucces(false);

    if (!formData.fromWarehouseId || !formData.toWarehouseId) {
      setErreur('Sélectionnez les entrepôts source et destination.');
      return;
    }

    if (
      String(formData.fromWarehouseId) ===
      String(formData.toWarehouseId)
    ) {
      setErreur('Les entrepôts doivent être différents.');
      return;
    }

    if (formData.items.length === 0) {
      setErreur('Ajoutez au moins un article.');
      return;
    }

    for (const item of formData.items) {
      if (!item.productId) {
        setErreur('Sélectionnez un produit pour chaque article.');
        return;
      }

      if (Number(item.quantity) <= 0) {
        setErreur('Les quantités doivent être supérieures à 0.');
        return;
      }

      if (Number(item.quantity) > getAvailableStock(item.productId)) {
        const product = products.find(
          (p) => String(p.id) === String(item.productId)
        );

        setErreur(
          `Stock insuffisant pour ${product?.name || 'le produit'}. Disponible : ${getAvailableStock(item.productId)}`
        );

        return;
      }
    }

    setChargement(true);

    try {
      const token = localStorage.getItem('Token');

      const headers = {
        Authorization: `Token ${token}`,
      };

      await AxiosInstance.post(
        '/transfers/',
        {
          from_warehouse_id: parseInt(
            formData.fromWarehouseId,
            10
          ),

          to_warehouse_id: parseInt(
            formData.toWarehouseId,
            10
          ),

          items: formData.items.map((it) => ({
            product_id: parseInt(it.productId, 10),
            quantity: parseInt(it.quantity, 10),
          })),

          reason: formData.reason || '',
          notes: formData.notes || '',
        },
        { headers }
      );

      setSucces(true);

      setTimeout(() => {
        navigate('/transferts');
      }, 1200);

    } catch (error) {
      let msg = 'Erreur lors du transfert.';

      if (error.response?.data) {
        const data = error.response.data;

        if (typeof data === 'string') {
          msg = data;
        } else if (data.detail) {
          msg = data.detail;
        } else if (data.error) {
          msg = data.error;
        } else if (typeof data === 'object') {
          msg = Object.entries(data)
            .map(([k, v]) =>
              `${k}: ${Array.isArray(v) ? v.join(', ') : v}`
            )
            .join(' | ');
        }
      }

      setErreur(msg);

    } finally {
      setChargement(false);
    }
  };

  const getWarehouseName = (id) => {
    const wh = warehouses.find(
      (w) => String(w.id) === String(id)
    );

    return wh ? `${wh.name} (${wh.code})` : '—';
  };

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================

  if (chargementInitial) {
    return (
      <div className="flex items-center justify-center py-20 w-full">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-base-content/60">
            Chargement...
          </p>
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
            onClick={() => navigate('/transferts')}
            className="btn btn-ghost btn-sm btn-circle"
            type="button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="text-xs text-base-content/50 uppercase mb-0.5">
              Stocks / Transferts / <span className="text-primary">Création</span>
            </div>

            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <ArrowLeftRight className="w-5 h-5 text-primary" />
              Nouveau transfert
            </h1>
          </div>

          <div className="badge badge-primary hidden sm:flex">
            Création
          </div>

        </div>
      </div>

      {/* MESSAGES */}
      {succes && (
        <div className="w-full alert alert-success rounded-none py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Transfert effectué avec succès !</span>
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

          {/* COLONNE PRINCIPALE */}
          <div className="lg:col-span-2 space-y-6">

            {/* SECTION 1 : ENTREPOTS */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">

                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Entrepôts</h2>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">

                    {/* SOURCE */}
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <ArrowLeftRight className="w-3 h-3 mr-1 inline" />
                          Source <span className="text-error">*</span>
                        </span>
                      </label>

                      <select
                        name="fromWarehouseId"
                        className="select select-bordered w-full"
                        value={formData.fromWarehouseId}
                        onChange={handleFromWarehouseChange}
                        required
                      >
                        <option value="">— Sélectionner —</option>

                        {warehouses.map((wh) => (
                          <option key={wh.id} value={wh.id}>
                            {wh.name} ({wh.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="hidden md:flex items-center justify-center pb-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <ArrowRight className="w-5 h-5 text-primary" />
                      </div>
                    </div>

                    {/* DESTINATION */}
                    <div className="form-control w-full">
                      <label className="label py-0 pb-1.5">
                        <span className="label-text text-sm font-medium">
                          <ArrowRight className="w-3 h-3 mr-1 inline" />
                          Destination <span className="text-error">*</span>
                        </span>
                      </label>

                      <select
                        name="toWarehouseId"
                        className="select select-bordered w-full"
                        value={formData.toWarehouseId}
                        onChange={handleChange}
                        required
                      >
                        <option value="">— Sélectionner —</option>

                        {destinationWarehouses.map((wh) => (
                          <option key={wh.id} value={wh.id}>
                            {wh.name} ({wh.code})
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2 : ARTICLES */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">

                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center justify-between">

                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold text-sm">
                      Articles à transférer
                    </h2>

                    {chargementStocks && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={addItem}
                    className="btn btn-sm btn-primary gap-1"
                    disabled={
                      !formData.fromWarehouseId ||
                      chargementStocks
                    }
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Ajouter</span>
                  </button>

                </div>

                <div className="p-5 space-y-4">

                  {!formData.fromWarehouseId && (
                    <div className="alert alert-info py-2">
                      <Info className="w-4 h-4" />
                      <span className="text-xs">
                        Sélectionnez d'abord un entrepôt source.
                      </span>
                    </div>
                  )}

                  {formData.fromWarehouseId && chargementStocks && (
                    <div className="text-center py-8 text-base-content/60">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                      <p className="text-sm">Chargement des stocks...</p>
                    </div>
                  )}

                  {formData.fromWarehouseId &&
                    !chargementStocks &&
                    availableProducts.length === 0 && (
                      <div className="alert alert-warning py-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs">
                          Aucun produit disponible dans cet entrepôt.
                        </span>
                      </div>
                    )}

                  {formData.fromWarehouseId &&
                    !chargementStocks &&
                    formData.items.length === 0 &&
                    availableProducts.length > 0 && (
                      <div className="text-center py-8 text-base-content/40">
                        <Boxes className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">
                          Cliquez sur "Ajouter" pour commencer.
                        </p>
                      </div>
                    )}

                  {/* ARTICLES */}
                  {formData.items.map((item, index) => {
                    const available = getAvailableStock(item.productId);

                    return (
                      <div
                        key={item.id}
                        className="card bg-base-200/30 border border-base-300"
                      >
                        <div className="card-body p-3">

                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-base-content/60">
                              Article #{index + 1}
                            </span>

                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="btn btn-ghost btn-xs btn-circle text-error"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">

                            <div className="form-control w-full">
                              <label className="label py-0 pb-1">
                                <span className="label-text text-xs font-medium">
                                  Produit <span className="text-error">*</span>
                                </span>
                              </label>

                              <select
                                value={item.productId}
                                onChange={(e) =>
                                  updateItem(
                                    item.id,
                                    'productId',
                                    e.target.value
                                  )
                                }
                                className="select select-bordered select-sm w-full"
                                required
                              >
                                <option value="">— Choisir —</option>

                                {availableProducts.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.code} - {p.name} (stock : {getAvailableStock(p.id)})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="form-control w-full sm:w-28">
                              <label className="label py-0 pb-1">
                                <span className="label-text text-xs font-medium">
                                  Qté <span className="text-error">*</span>
                                </span>
                              </label>

                              <input
                                type="number"
                                min="1"
                                max={available || undefined}
                                value={item.quantity}
                                onChange={(e) =>
                                  updateItem(
                                    item.id,
                                    'quantity',
                                    parseInt(e.target.value, 10) || 0
                                  )
                                }
                                className={`input input-bordered input-sm w-full font-mono ${
                                  item.productId && item.quantity > available
                                    ? 'input-error'
                                    : ''
                                }`}
                                required
                              />
                            </div>

                          </div>

                          {item.productId && (
                            <div className="mt-2 text-xs">
                              {item.quantity > available ? (
                                <span className="text-error flex items-center gap-1 font-medium">
                                  <AlertTriangle className="w-3 h-3" />
                                  Stock insuffisant (dispo : {available})
                                </span>
                              ) : (
                                <span className="text-base-content/60">
                                  Disponible : {available}
                                </span>
                              )}
                            </div>
                          )}

                        </div>
                      </div>
                    );
                  })}

                </div>
              </div>
            </div>

            {/* SECTION 3 : MOTIF ET NOTES */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">

                <div className="px-5 py-3 border-b bg-base-200/30 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">
                    Informations complémentaires
                  </h2>
                </div>

                <div className="p-5 space-y-4">

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Motif
                      </span>
                    </label>

                    <input
                      type="text"
                      name="reason"
                      className="input input-bordered w-full"
                      value={formData.reason}
                      onChange={handleChange}
                      maxLength="200"
                      placeholder="Ex : Réapprovisionnement magasin"
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-0 pb-1.5">
                      <span className="label-text text-sm font-medium">
                        Notes
                      </span>
                    </label>

                    <textarea
                      name="notes"
                      className="textarea textarea-bordered w-full"
                      value={formData.notes}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Informations complémentaires..."
                    />
                  </div>

                </div>
              </div>
            </div>

          </div>

          {/* COLONNE APERCU */}
          <div className="lg:col-span-1 space-y-6">

            <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm">
              <div className="card-body">

                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Aperçu</h3>
                </div>

                <div className="bg-base-100 rounded-xl p-4 border border-base-300">

                  <div className="space-y-2 mb-3">

                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <ArrowLeftRight className="w-3 h-3 text-primary" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-base-content/50 uppercase">
                          Source
                        </p>

                        <p className="font-medium truncate text-xs">
                          {formData.fromWarehouseId
                            ? getWarehouseName(formData.fromWarehouseId)
                            : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="ml-3 border-l-2 border-dashed border-primary/30 h-4"></div>

                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                        <ArrowRight className="w-3 h-3 text-success" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-base-content/50 uppercase">
                          Destination
                        </p>

                        <p className="font-medium truncate text-xs">
                          {formData.toWarehouseId
                            ? getWarehouseName(formData.toWarehouseId)
                            : '—'}
                        </p>
                      </div>
                    </div>

                  </div>

                  <div className="divider my-3"></div>

                  <div className="space-y-2 text-xs">

                    <div className="flex justify-between">
                      <span className="text-base-content/60">
                        Articles :
                      </span>
                      <span className="font-mono font-bold">
                        {totalItems}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-base-content/60">
                        Quantité totale :
                      </span>
                      <span className="font-mono font-bold text-primary">
                        {totalQuantity}
                      </span>
                    </div>

                  </div>

                  {formData.reason && (
                    <>
                      <div className="divider my-3"></div>

                      <div className="text-xs">
                        <p className="text-base-content/60 mb-1">
                          Motif :
                        </p>
                        <p className="font-medium line-clamp-2">
                          {formData.reason}
                        </p>
                      </div>
                    </>
                  )}

                </div>
              </div>
            </div>

            {/* CONSEIL FIFO */}
            <div className="card bg-info/5 border border-info/20">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />

                  <div className="text-xs">
                    <p className="font-medium text-info mb-1">
                      Méthode FIFO
                    </p>

                    <p className="text-base-content/70">
                      Les lots les plus proches de l'expiration sont transférés en priorité.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CONSEIL */}
            <div className="card bg-warning/5 border border-warning/20">
              <div className="card-body p-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />

                  <div className="text-xs">
                    <p className="font-medium text-warning mb-1">
                      Conseil
                    </p>

                    <p className="text-base-content/70">
                      Un transfert est <strong>irréversible</strong> une fois validé.
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
              onClick={() => navigate('/transferts')}
              className="btn btn-ghost"
              disabled={chargement}
            >
              Annuler
            </button>

            <button
              type="submit"
              className="btn btn-primary gap-2 min-w-[180px]"
              disabled={
                chargement ||
                chargementInitial ||
                warehouses.length === 0 ||
                chargementStocks
              }
            >
              {chargement ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Valider le transfert
                </>
              )}
            </button>

          </div>
        </div>

      </form>
    </div>
  );
};

export default TransfertForm;
