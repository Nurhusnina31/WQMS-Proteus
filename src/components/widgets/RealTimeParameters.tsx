import { useEffect, useState } from "react";
import { PARAMETERS } from "../../data/constants";
import { formatPollutantValue } from "../../utils/numberFormat";
import { useUnits } from "../../context/UnitContext";
import {
  getRealTimeParams,
  type RealtimeReading,
} from "../../services/liveData.service";
import { getLatestReadings } from "../../services/telemetry.service";
import EmptyState from "../common/EmptyState";

interface RealTimeParametersProps {
  deviceId: string;
}

/**
 * Format an ISO timestamp as a relative "Xs ago" / "Xm ago" string,
 * relative to the current time at render. Returns "" when the value
 * is missing / unparseable.
 */
function formatAgo(at: string | undefined, now: number): string {
  if (!at) return "";
  const t = Date.parse(at);
  if (isNaN(t)) return "";
  const ageMs = Math.max(0, now - t);
  const ageS = Math.floor(ageMs / 1000);
  if (ageS < 60) return `${ageS}s ago`;
  const ageM = Math.floor(ageS / 60);
  if (ageM < 60) return `${ageM}m ago`;
  const ageH = Math.floor(ageM / 60);
  return `${ageH}h ago`;
}

/**
 * Color the "Xs ago" label by staleness:
 * - fresh (<30s) → muted gray (looks normal)
 * - aging (30s–2min) → yellow (something may be off)
 * - stale (>2min) → red (parameter is not being updated)
 */
function freshnessColor(at: string | undefined, now: number): string {
  if (!at) return "text-gray-500";
  const ageMs = now - Date.parse(at);
  if (isNaN(ageMs)) return "text-gray-500";
  if (ageMs < 30_000) return "text-gray-500";
  if (ageMs < 120_000) return "text-yellow-600";
  return "text-red-600";
}

export default function RealTimeParameters({
  deviceId,
}: RealTimeParametersProps) {
  const [liveData, setLiveData] = useState<Record<string, RealtimeReading>>({});
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const { convert, getUnit } = useUnits();

  useEffect(() => {
    if (!deviceId) return;

    const fetchLiveData = async () => {
      try {
        // Try live data from Redis (pushed by MQTT subscriber).
        // Xylenes is now a direct reading from channel 59.
        const data = await getRealTimeParams(deviceId);
        setLiveData(data.readings);
        setLoading(false);
      } catch {
        // Fallback: get latest reading from database — single shared timestamp
        try {
          const readings = await getLatestReadings(deviceId, 1);
          if (readings.length > 0) {
            const latest = readings[0];
            const at = latest.observedAt ?? new Date().toISOString();
            const mapped: Record<string, RealtimeReading> = {};
            const set = (
              key: string,
              raw: string | number | null | undefined,
            ) => {
              if (raw === null || raw === undefined || raw === "") return;
              const num = typeof raw === "string" ? parseFloat(raw) : raw;
              if (!isNaN(num)) mapped[key] = { value: num, at };
            };
            set("ph", latest.phValue);
            set("do", latest.doValue);
            set("nh3n", latest.nh3nValue);
            set("cod", latest.codValue);
            set("bod", latest.bodValue);
            set("tss", latest.tssValue);
            set("temperature", latest.tempValue);
            set("depth", latest.depthValue);
            setLiveData(mapped);
          }
        } catch (dbErr) {
          console.error("Failed to fetch fallback data:", dbErr);
        }
        setLoading(false);
      }
    };

    fetchLiveData();
    const interval = setInterval(fetchLiveData, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, [deviceId]);

  // Tick every second so the "Xs ago" labels update without re-fetching.
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-blue-600">Loading...</div>
      </div>
    );
  }

  if (Object.keys(liveData).length === 0) {
    return (
      <EmptyState
        compact
        title="No Live Data"
        message="The device may be offline or no data has been recorded yet."
      />
    );
  }

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 7px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #EFF8FF;
          border-radius: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #A9CDE2;
          border-radius: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #0369A1;
        }

        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #A9CDE2 #EFF8FF;
        }
      `}</style>
      <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
        <div className="space-y-3">
          {PARAMETERS.filter((param) => param.key !== "wqi").map((param) => {
            const entry = liveData[param.key];
            const rawValue = entry?.value ?? 0;
            const at = entry?.at;
            const convertedValue = convert(rawValue, param.key) ?? rawValue;
            const formattedValue = formatPollutantValue(
              convertedValue,
              param.key,
            );
            const displayUnit = getUnit(param.key);
            const ago = formatAgo(at, now);
            const agoColor = freshnessColor(at, now);

            // Calculate bar width based on parameter range
            let maxValue = 100;
            if (param.key === "temperature") maxValue = 50;

            const percentage = Math.min((rawValue / maxValue) * 100, 100);

            return (
              <div
                  key={param.key}
                  className="space-y-2 rounded-xl border border-line bg-[#FAFDFF] p-3 transition-colors duration-200 hover:bg-sidebar"
                >
                {/* Parameter label and value */}
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-baseline gap-2">
                    <span className="font-semibold text-ink">
                      {param.label}
                    </span>
                    {ago && entry && (
                      <span className={`text-[10px] ${agoColor}`} title={at}>
                        {ago}
                      </span>
                    )}
                  </span>
                  <span className="font-semibold tabular-nums text-ink">
                    {entry ? formattedValue : "–"}{" "}
                    <span className="text-muted text-xs">{displayUnit}</span>
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 overflow-hidden rounded-full bg-[#E1EDF5]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#0369A1] to-[#38BDF8] transition-all duration-1000"
                    style={{ width: `${Math.max(0, percentage)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
