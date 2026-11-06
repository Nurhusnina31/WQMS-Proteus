import { useEffect, useState } from "react";
import { getRealTimeParams } from "../../services/liveData.service";
import { getLatestReadings } from "../../services/telemetry.service";
import { computeWqiBreakdown, wqiColor, type WqiResult } from "../../utils/wqi";
import EmptyState from "../common/EmptyState";

interface WqiGaugeProps {
  deviceId: string;
}

/**
 * Live DOE Water Quality Index widget.
 *
 * Pulls the current readings (Redis live cache, with a DB fallback), computes
 * the WQI + six sub-indices client-side via utils/wqi, and renders a
 * semicircular gauge with a per-parameter sub-index breakdown.
 */
export default function WqiGauge({ deviceId }: WqiGaugeProps) {
  const [result, setResult] = useState<WqiResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!deviceId) return;

    const compute = (r: {
      ph?: number | null;
      do?: number | null;
      bod?: number | null;
      cod?: number | null;
      nh3n?: number | null;
      tss?: number | null;
      temperature?: number | null;
      pHmV?: number | null;
      turbidity?: number | null;
      TRYP?: number | null;
      CDOM?: number | null;
      ORP?: number | null;
      nh4?: number | null;
      HDO?: number | null;
      HDOpercent?: number | null;
      CDOMtemperature?: number | null;
      TRYPppb?: number | null;    

    }) => {
      const res = computeWqiBreakdown(r);
      setResult(res);
      setMissing(res === null);
      setLoading(false);
    };

    const fetchData = async () => {
      try {
        const data = await getRealTimeParams(deviceId);
        const r = data.readings;
        const v = (k: string) => r[k]?.value;
        compute({
          ph: v("ph"),
          do: v("do"),
          bod: v("bod"),
          cod: v("cod"),
          nh3n: v("nh3n"),
          tss: v("tss"),
          temperature: v("temperature"),
          pHmV: v("phmV"),
          turbidity: v("turbidity"),
          TRYP: v("TRYP"),
          CDOM: v("CDOM"),
          ORP: v("ORP"),
          nh4: v("nh4"),
          HDO: v("HDO"),
          HDOpercent: v("HDOpercent"),
          CDOMtemperature: v("CDOMtemperature"),
          TRYPppb: v("TRYPppb"),  
        });
      } catch {
        // Fallback: latest DB reading
        try {
          const readings = await getLatestReadings(deviceId, 1);
          if (readings.length > 0) {
            const l = readings[0];
            const n = (x: string | null) =>
              x === null || x === undefined ? null : parseFloat(x);
            compute({
              ph: n(l.phValue),
              do: n(l.doValue),
              bod: n(l.bodValue),
              cod: n(l.codValue),
              nh3n: n(l.nh3nValue),
              tss: n(l.tssValue),
              temperature: n(l.tempValue),
              pHmV: n(l.phmVValue),
              turbidity: n(l.turbidityValue),
              TRYP: n(l.TRYValue),
              CDOM: n(l.CDOMValue),
              ORP: n(l.ORPValue),
              nh4: n(l.nh4Value),
              HDO: n(l.HDOValue),
              HDOpercent: n(l.HDOpercentValue),
              CDOMtemperature: n(l.CDOMtemperatureValue),
              TRYPppb: n(l.TRYppbValue),
            });
          } else {
            setLoading(false);
          }
        } catch {
          setLoading(false);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s, same cadence as live params
    return () => clearInterval(interval);
  }, [deviceId]);

  if (loading) {
    return (
      <div
        className="flex min-h-[180px] items-center justify-center gap-3 text-brand"
        role="status"
      >
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand/20 border-t-brand" />
        <span className="text-sm font-medium">
          Loading water quality...
        </span>
      </div>
    );
  }

  if (missing || !result) {
    return (
      <div className="rounded-xl border border-line bg-[#F7FBFE] p-4">
        <EmptyState
          compact
          title="WQI Unavailable"
          message="WQI needs all six parameters (pH, DO, BOD, COD, NH₃-N, TSS) plus temperature. One or more is missing from the latest reading."
        />
      </div>
    );
  }

  const { wqi, class: cls, status, subIndices } = result;
  const color = wqiColor(wqi);

  // ── Semicircular gauge geometry ──────────────────────────────────────────
  // 180° arc, radius 80, centred at (100,100). Arc length = π·80.
  const ARC_LEN = Math.PI * 80;
  const fraction = Math.max(0, Math.min(1, wqi / 100));
  const dashOffset = ARC_LEN * (1 - fraction);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-center">
      {/* Gauge */}
      <div className="flex flex-col items-center rounded-xl bg-[#F7FBFE] p-4">
        <svg viewBox="0 0 200 118" className="w-full max-w-[280px]">
          {/* Track */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#E1EDF5"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={ARC_LEN}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 1s ease, stroke 1s ease" }}
          />
          {/* Value */}
          <text
            x="100"
            y="86"
            textAnchor="middle"
            className="font-bold"
            style={{ fontSize: "34px", fill: color }}
          >
            {wqi.toFixed(1)}
          </text>
          <text
            x="100"
            y="104"
            textAnchor="middle"
            style={{ fontSize: "11px", fill: "#64748b" }}
          >
            Class {cls}
          </text>
          {/* Scale ends */}
          <text x="20" y="116" textAnchor="middle" style={{ fontSize: "9px", fill: "#94a3b8" }}>0</text>
          <text x="180" y="116" textAnchor="middle" style={{ fontSize: "9px", fill: "#94a3b8" }}>100</text>
        </svg>

        {/* Status pill */}
        <span
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium -mt-1"
          style={{ backgroundColor: `${color}1a`, color }}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          {status}
        </span>
      </div>

      {/* Sub-index breakdown */}
      <div className="space-y-3 md:border-l md:border-line md:pl-6">
        <div className="mb-2 text-sm font-semibold text-ink">
          Sub-index breakdown
        </div>
        {subIndices.map((s) => {
          const barColor = wqiColor(s.score);
          return (
            <div key={s.key} className="flex items-center gap-2 text-sm">
              <span className="w-14 text-slate-600 shrink-0">{s.label}</span>
              <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${s.score}%`, backgroundColor: barColor }}
                />
              </div>
              <span className="w-9 text-right font-mono text-slate-700 shrink-0">
                {Math.round(s.score)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
