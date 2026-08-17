"use client";

import { useState, useMemo } from "react";
import {
  MapPin,
  Maximize2,
  Navigation,
  Star,
  ExternalLink,
  MessageSquare,
  Plus,
  Minus,
  RotateCcw,
  Compass,
  Layers,
  Sparkles,
  ChevronRight,
  Radio
} from "lucide-react";
import { Lead } from "@/lib/types";

interface MiniLeadsMapProps {
  leads: Lead[];
  searchTerm: string;
  onSelectLead?: (lead: Lead) => void;
  selectedLeadId?: string | null;
}

export default function MiniLeadsMap({
  leads,
  searchTerm,
  onSelectLead,
  selectedLeadId,
}: MiniLeadsMapProps) {
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [mapStyle, setMapStyle] = useState<"dark" | "radar">("dark");

  // Fallback / default coordinates for Espírito Santo towns if leads don't have explicit lat/lng
  const defaultCityCoords = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (term.includes("vitória") || term.includes("vitoria")) return { lat: -20.3155, lng: -40.3128, name: "Vitória, ES" };
    if (term.includes("vila velha")) return { lat: -20.3297, lng: -40.2925, name: "Vila Velha, ES" };
    if (term.includes("linhares")) return { lat: -19.3911, lng: -40.0722, name: "Linhares, ES" };
    if (term.includes("guarapari")) return { lat: -20.6706, lng: -40.4976, name: "Guarapari, ES" };
    if (term.includes("serra")) return { lat: -20.1286, lng: -40.3078, name: "Serra, ES" };
    if (term.includes("colatina")) return { lat: -19.5392, lng: -40.6306, name: "Colatina, ES" };
    return { lat: -20.8489, lng: -41.1128, name: "Cachoeiro de Itapemirim, ES" };
  }, [searchTerm]);

  // Projected leads with reliable coordinates
  const projectedLeads = useMemo(() => {
    return leads.map((lead, idx) => {
      // If no explicit lat/lng, distribute symmetrically around the city center
      const angle = (idx / Math.max(leads.length, 1)) * 2 * Math.PI;
      const radius = 0.008 + (idx % 3) * 0.004;
      const lat = lead.lat ?? (defaultCityCoords.lat + Math.sin(angle) * radius);
      const lng = lead.lng ?? (defaultCityCoords.lng + Math.cos(angle) * radius * 1.2);

      return {
        ...lead,
        mapLat: lat,
        mapLng: lng,
        indexNumber: idx + 1,
      };
    });
  }, [leads, defaultCityCoords]);

  // Calculate bounding box for SVG viewport projection
  const bounds = useMemo(() => {
    if (projectedLeads.length === 0) {
      return {
        minLat: defaultCityCoords.lat - 0.02,
        maxLat: defaultCityCoords.lat + 0.02,
        minLng: defaultCityCoords.lng - 0.02,
        maxLng: defaultCityCoords.lng + 0.02,
      };
    }

    const lats = projectedLeads.map((l) => l.mapLat);
    const lngs = projectedLeads.map((l) => l.mapLng);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latMargin = Math.max((maxLat - minLat) * 0.25, 0.006) / zoomLevel;
    const lngMargin = Math.max((maxLng - minLng) * 0.25, 0.006) / zoomLevel;

    return {
      minLat: minLat - latMargin,
      maxLat: maxLat + latMargin,
      minLng: minLng - lngMargin,
      maxLng: maxLng + lngMargin,
    };
  }, [projectedLeads, defaultCityCoords, zoomLevel]);

  // Project lat/lng into SVG coordinates (0..100)
  const getCoordinates = (lat: number, lng: number) => {
    const latSpan = bounds.maxLat - bounds.minLat || 0.01;
    const lngSpan = bounds.maxLng - bounds.minLng || 0.01;

    // Invert Y because latitude grows northward (up)
    const x = Math.min(Math.max(((lng - bounds.minLng) / lngSpan) * 100, 5), 95);
    const y = Math.min(Math.max((1 - (lat - bounds.minLat) / latSpan) * 100, 8), 92);

    return { x, y };
  };

  const handleMarkerClick = (lead: Lead) => {
    setActiveLead(activeLead?.id === lead.id ? null : lead);
    if (onSelectLead) onSelectLead(lead);
  };

  // Google Maps Search link for the entire target city
  const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchTerm)}`;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
      {/* HEADER WITH CONTROLS */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Mapa de Leads
              </h3>
              <span className="text-[10px] px-1.5 py-0.2 bg-blue-500/20 text-blue-400 font-mono rounded font-semibold">
                {leads.length} {leads.length === 1 ? "Local" : "Locais"}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate max-w-[170px] font-sans">
              {defaultCityCoords.name}
            </p>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMapStyle((s) => (s === "dark" ? "radar" : "dark"))}
            title={mapStyle === "dark" ? "Visualizar Modo Radar" : "Visualizar Modo Vetorial"}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(z + 0.3, 2.5))}
            title="Aproximar Zoom"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(z - 0.3, 0.7))}
            title="Afastar Zoom"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            title="Centralizar Visualização"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* MAP STAGE CONTAINER */}
      <div className="relative w-full h-[220px] bg-slate-950 overflow-hidden select-none">
        {/* RADAR SWEEP ANIMATION (RADAR MODE) */}
        {mapStyle === "radar" && (
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <div className="w-full h-full rounded-full border border-emerald-500/20 scale-150 animate-ping duration-1000"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12)_0%,transparent_70%)]"></div>
          </div>
        )}

        {/* GRID CARTOGRAPHY BACKGROUND */}
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(51, 65, 85, 0.25)" strokeWidth="0.75" />
            </pattern>
            <pattern id="mainGrid" width="60" height="60" patternUnits="userSpaceOnUse">
              <rect width="60" height="60" fill="url(#smallGrid)" />
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1" />
            </pattern>
            <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(37, 99, 235, 0.12)" />
              <stop offset="100%" stopColor="rgba(15, 23, 42, 0)" />
            </radialGradient>
          </defs>

          {/* Grid pattern */}
          <rect width="100%" height="100%" fill="url(#mainGrid)" />
          <rect width="100%" height="100%" fill="url(#mapGlow)" />

          {/* Simulated Geographic Road Network */}
          <g stroke="rgba(71, 85, 105, 0.4)" strokeWidth="1.5" fill="none" strokeDasharray="3,3">
            <path d="M 0,110 Q 70,120 140,80 T 280,100 T 400,90" />
            <path d="M 120,0 Q 150,90 180,140 T 210,220" />
            <path d="M 20,40 Q 110,60 220,160 T 360,180" />
          </g>

          {/* City Hub Rings */}
          <circle cx="50%" cy="50%" r="45" fill="none" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="50%" cy="50%" r="80" fill="none" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="1" strokeDasharray="6 6" />
        </svg>

        {/* EMPTY STATE IF NO LEADS */}
        {leads.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10">
            <div className="w-10 h-10 rounded-full bg-slate-900/80 border border-slate-700 flex items-center justify-center text-slate-400 mb-2">
              <Radio className="w-5 h-5 text-blue-400 animate-pulse" />
            </div>
            <p className="text-xs font-medium text-slate-300 font-sans">
              Radar de Prospecção Ativo
            </p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
              Execute a varredura para plotar os pins com nota e WhatsApp.
            </p>
          </div>
        )}

        {/* PLOTTED LEAD PINS */}
        {projectedLeads.map((lead) => {
          const { x, y } = getCoordinates(lead.mapLat, lead.mapLng);
          const isSelected = selectedLeadId === lead.id || activeLead?.id === lead.id;

          return (
            <div
              key={lead.id}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -100%)",
              }}
              className="absolute z-20 cursor-pointer group transition-all duration-300"
              onClick={() => handleMarkerClick(lead)}
            >
              {/* Pulsing Ripple Halo */}
              <div
                className={`absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 w-4 h-4 rounded-full pointer-events-none transition-all ${
                  isSelected
                    ? "bg-blue-500/40 scale-150 animate-ping"
                    : "bg-emerald-500/20 group-hover:scale-125"
                }`}
              />

              {/* Pin Marker */}
              <div
                className={`relative flex items-center justify-center rounded-full transition-transform transform group-hover:scale-110 shadow-lg ${
                  isSelected
                    ? "w-8 h-8 bg-blue-600 border-2 border-white text-white z-30 shadow-[0_0_15px_rgba(37,99,235,0.7)]"
                    : "w-6 h-6 bg-slate-900 border-2 border-emerald-500 text-emerald-400 group-hover:border-emerald-300"
                }`}
              >
                <span className="font-mono text-[10px] font-bold">
                  {lead.indexNumber}
                </span>

                {/* Rating Mini Tag */}
                {lead.rating > 0 && (
                  <span
                    className={`absolute -top-2 -right-3 text-[9px] font-mono px-1 py-0.2 rounded-full font-bold shadow-sm ${
                      lead.rating >= 4.5
                        ? "bg-amber-400 text-slate-950"
                        : "bg-slate-800 text-slate-200 border border-slate-700"
                    }`}
                  >
                    ★{lead.rating.toFixed(1)}
                  </span>
                )}
              </div>

              {/* Pin Pointer Arrow */}
              <div
                className={`w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] mx-auto -mt-0.5 ${
                  isSelected ? "border-t-blue-600" : "border-t-emerald-500"
                }`}
              />

              {/* Hover Tooltip Preview */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-40 pointer-events-none whitespace-nowrap">
                <div className="bg-slate-950 border border-slate-700 px-2.5 py-1 rounded shadow-xl text-left">
                  <p className="text-[11px] font-bold text-white truncate max-w-[180px]">
                    {lead.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {lead.phone} • Sem Site
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {/* ACTIVE PIN DETAIL POPUP CARD (WHEN PIN IS CLICKED) */}
        {activeLead && (
          <div className="absolute bottom-2 left-2 right-2 z-30 bg-slate-950/95 backdrop-blur-md border border-blue-500/40 rounded-lg p-2.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <h4 className="text-xs font-bold text-white truncate max-w-[190px]">
                    {activeLead.name}
                  </h4>
                </div>
                <p className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5">
                  📍 {activeLead.address || "Endereço em " + defaultCityCoords.name}
                </p>
              </div>

              <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {activeLead.rating > 0 ? activeLead.rating.toFixed(1) : "N/A"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-slate-800">
              <a
                href={activeLead.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm transition-colors"
              >
                <MessageSquare className="w-3 h-3" />
                WhatsApp
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  activeLead.name + " " + (activeLead.address || "")
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium flex items-center justify-center gap-1 border border-slate-700 transition-colors"
              >
                <Navigation className="w-3 h-3 text-blue-400" />
                No Maps
              </a>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER ACTION */}
      <div className="p-2.5 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-[11px]">
        <span className="text-slate-400 font-mono text-[10px] flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block animate-pulse"></span>
          Geolocalização GIS ES
        </span>
        <a
          href={googleMapsSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
        >
          Google Maps
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
