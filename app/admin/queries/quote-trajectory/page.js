"use client";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import axiosClient from "@/app/lib/axiosClient";
import { swalError } from "@/app/lib/swal";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import { useTranslation } from "@/app/locales";
import IconSearch from "@/components/icon/icon-search";
import IconBackSpace from "@/components/icon/icon-backspace";

const URL_TRAYECTORIA = (nro) => `cotizaciones/${nro}/trayectoria`;

// Flujo completo en orden — debe coincidir con CotizacionTrayectoriaService.CalcularEtapa.
const ETAPAS_FLUJO = [
  "Cotizado",
  "Orden en proceso",
  "Almacén USA (pendiente de recepción)",
  "Recepción parcial",
  "Recepción completa",
  "Embalado",
  "Documentado",
  "Despachado",
  "Entregado",
];

// Color del punto de la línea de tiempo según el tipo de paso.
const COLOR_EVENTO = {
  "Cotizado": "bg-sky-500",
  "Orden en proceso": "bg-indigo-500",
  "Orden de compra": "bg-violet-500",
  "Recepción": "bg-amber-500",
  "Embalaje": "bg-orange-500",
  "Documentado": "bg-cyan-500",
  "Despachado": "bg-teal-500",
  "Entregado": "bg-emerald-500",
};

const colorEvento = (etapa) => {
  if ((etapa ?? "").toLowerCase().includes("anulad")) return "bg-red-500";
  return COLOR_EVENTO[etapa] ?? "bg-primary";
};

const fmtFecha = (val) => {
  if (!val) return "—";
  return new Date(val).toLocaleString("es-BO", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

const diasEntre = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

export default function QuoteTrajectory() {
  const t = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const nroUrl = searchParams.get("nro") ?? "";
  const [nroInput, setNroInput] = useState(nroUrl);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [filter, setFilter] = useState("");

  useDynamicTitle(`${t.query} | ${t.quote_trajectory ?? "Trayectoria de cotización"}`);

  useEffect(() => {
    if (!nroUrl) {
      setData(null);
      setNotFound(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const rs = await axiosClient.get(URL_TRAYECTORIA(nroUrl));
        if (!cancelled) setData(rs.data);
      } catch (error) {
        if (cancelled) return;
        setData(null);
        if (error?.response?.status === 404) setNotFound(true);
        else swalError(t.error ?? "Error", t.save_data_error ?? "No se pudo cargar la trayectoria.", t.close);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [nroUrl]);

  const eventos = useMemo(() => data?.eventos ?? [], [data]);

  // Días desde el paso anterior (para ver dónde se demoró).
  const eventosConDias = useMemo(
    () => eventos.map((e, i) => ({
      ...e,
      diasDesdeAnterior: i > 0 && e.fecha && eventos[i - 1].fecha
        ? diasEntre(eventos[i - 1].fecha, e.fecha)
        : null,
    })),
    [eventos]
  );

  const eventosFiltrados = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return eventosConDias;
    return eventosConDias.filter((e) =>
      [e.etapa, e.descripcion, e.usuario, e.referencia]
        .some((campo) => (campo ?? "").toLowerCase().includes(q))
    );
  }, [eventosConDias, filter]);

  // Resumen: primer y último paso con fecha; duración del flujo (primero → último) y
  // días transcurridos desde el último paso hasta hoy.
  const resumen = useMemo(() => {
    const fechas = eventos.map((e) => e.fecha).filter(Boolean);
    const primera = fechas[0];
    const ultima = fechas[fechas.length - 1];
    return {
      duracionDias: primera && ultima ? diasEntre(primera, ultima) : null,
      diasDesdeUltimo: ultima ? Math.floor((Date.now() - new Date(ultima)) / 86400000) : null,
      primera,
      ultima,
    };
  }, [eventos]);

  const indiceActual = data ? ETAPAS_FLUJO.indexOf(data.etapaActual) : -1;

  const buscar = (e) => {
    e.preventDefault();
    const nro = nroInput.trim();
    setFilter("");
    router.push(nro ? `${pathname}?nro=${encodeURIComponent(nro)}` : pathname, { scroll: false });
  };

  return (
    <>
      <ul className="flex space-x-2 rtl:space-x-reverse mb-4 text-sm text-gray-500">
        <li>{t.query}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-800 dark:text-gray-100">
          {t.quote_trajectory ?? "Trayectoria de cotización"}
        </li>
      </ul>

      <form onSubmit={buscar} className="flex items-center gap-2 mb-6">
        <input
          type="text"
          inputMode="numeric"
          value={nroInput}
          onChange={(e) => setNroInput(e.target.value.replace(/\D/g, ""))}
          placeholder={t.nro_quote ?? "Nro. Cotización"}
          className="h-10 w-56 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="submit"
          className="flex h-10 items-center gap-1.5 rounded-lg px-3 bg-primary/20 text-primary hover:bg-primary/40 transition text-sm"
        >
          <IconSearch className="h-4 w-4" />
          {t.btn_search ?? "Buscar"}
        </button>
      </form>

      {loading && (
        <div className="flex items-center justify-center py-14">
          <span className="text-sm text-gray-400 animate-pulse">{t.searching ?? "Buscando..."}</span>
        </div>
      )}

      {!loading && !nroUrl && (
        <p className="text-sm text-gray-400">{t.enter_nro_quote ?? "Ingresá un número de cotización."}</p>
      )}

      {!loading && notFound && (
        <p className="text-sm text-gray-400">{t.quote_not_found ?? "Cotización no encontrada."}</p>
      )}

      {!loading && data && (
        <div className="space-y-4">
          {/* Cabecera: cotización, cliente, categoría y etapa actual */}
          <div className="panel p-4 flex flex-wrap items-center gap-x-6 gap-y-2">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t.quote ?? "Cotización"}</p>
              <p className="text-base font-semibold text-gray-800 dark:text-gray-100">{data.nroCotizacion}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t.customer ?? "Cliente"}</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{data.cliente || "—"}</p>
              {data.codPais && (
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                  <img
                    src={`/assets/flags/${data.codPais.toLowerCase()}.svg`}
                    alt={data.codPais}
                    className="h-4 w-6 rounded object-cover border border-gray-200 dark:border-gray-600"
                  />
                  {data.nomPais || data.codPais}
                </p>
              )}
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t.category ?? "Categoría"}</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{data.categoria || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t.first_step ?? "Inicio"}</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{fmtFecha(resumen.primera)}</p>
              {resumen.duracionDias != null && (
                <p className="text-xs text-gray-400">
                  {t.flow_duration ?? "Duración del flujo"}: {resumen.duracionDias} {t.days ?? "días"}
                </p>
              )}
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t.last_step ?? "Último paso"}</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{fmtFecha(resumen.ultima)}</p>
              {resumen.diasDesdeUltimo != null && data.etapaActual !== "Entregado" && (
                <p className={`text-xs font-semibold ${resumen.diasDesdeUltimo >= 7 ? "text-red-500" : "text-gray-500"}`}>
                  {resumen.diasDesdeUltimo === 0
                    ? (t.today ?? "Hoy")
                    : `${t.ago ?? "Hace"} ${resumen.diasDesdeUltimo} ${t.days ?? "días"}`}
                </p>
              )}
            </div>
            <div className="ml-auto">
              <span className="inline-flex items-center rounded-full bg-primary/10 dark:bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {data.etapaActual}
              </span>
            </div>
          </div>

          {/* Flujo: etapas alcanzadas (resaltadas) y la actual */}
          <div className="panel p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{t.flow ?? "Flujo"}</p>
            <ol className="flex flex-wrap items-center gap-y-2">
              {ETAPAS_FLUJO.map((etapa, i) => {
                const alcanzada = indiceActual >= 0 && i <= indiceActual;
                const actual = i === indiceActual;
                return (
                  <li key={etapa} className="flex items-center">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium
                        ${actual ? "bg-primary text-white ring-2 ring-primary/30"
                          : alcanzada ? "bg-primary/15 text-primary"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${alcanzada ? "bg-current" : "bg-gray-300 dark:bg-gray-600"}`} />
                      {etapa}
                    </span>
                    {i < ETAPAS_FLUJO.length - 1 && (
                      <span className={`mx-1.5 h-px w-4 ${alcanzada && i < indiceActual ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`} />
                    )}
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Filtro */}
          <div className="flex items-center gap-3">
            <div className="relative w-full max-w-sm">
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder={t.filter ?? "Filtrar..."}
                className="h-10 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 pe-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {filter && (
                <button
                  type="button"
                  onClick={() => setFilter("")}
                  className="absolute inset-y-0 end-2 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <IconBackSpace className="h-4 w-4" />
                </button>
              )}
            </div>
            <span className="text-xs text-gray-400">
              {eventosFiltrados.length} / {eventos.length}
            </span>
          </div>

          {/* Línea de tiempo */}
          <div className="panel p-5">
            {eventosFiltrados.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">{t.empty_results ?? "Sin resultados"}</p>
            ) : (
              <ol className="relative border-s border-gray-200 dark:border-gray-700 ms-2 space-y-5">
                {eventosFiltrados.map((e, i) => {
                  const anulado = (e.etapa ?? "").toLowerCase().includes("anulad");
                  // "Entregado" toma la última modificación del embalaje: no es la fecha de entrega exacta.
                  const aproximado = e.etapa === "Entregado";
                  return (
                    <li key={i} className="ms-5">
                      <span className={`absolute -start-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 ${colorEvento(e.etapa)}`} />
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className={`text-sm font-semibold ${anulado ? "text-red-600 line-through" : "text-gray-800 dark:text-gray-100"}`}>
                          {e.etapa}
                        </span>
                        <span className="text-xs text-gray-400">{fmtFecha(e.fecha)}</span>
                        {e.diasDesdeAnterior != null && (
                          <span className="text-[11px] rounded bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-gray-500">
                            {e.diasDesdeAnterior === 0 ? (t.same_day ?? "mismo día") : `+${e.diasDesdeAnterior} ${t.days ?? "días"}`}
                          </span>
                        )}
                        {aproximado && (
                          <span
                            className="text-[11px] text-amber-600"
                            title={t.approx_date ?? "Fecha aproximada: última modificación del embalaje"}
                          >
                            {t.approx_date_short ?? "fecha aprox."}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{e.descripcion}</p>
                      <p className="text-xs text-gray-400 mt-0.5 flex flex-wrap items-center gap-x-2">
                        {e.referencia && (
                          <span className="font-mono rounded bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-gray-600 dark:text-gray-300">
                            {e.referencia}
                          </span>
                        )}
                        {e.usuario && <span>{e.usuario}</span>}
                      </p>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      )}
    </>
  );
}
