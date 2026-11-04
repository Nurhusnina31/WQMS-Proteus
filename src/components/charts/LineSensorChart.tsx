// components/charts/LineSensorChart.tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import ExposureLimitsDisplay from "./ExposureLimitsDisplay";
import { formatSensorValue } from "../../utils/numberFormat";
import {
  formatChartAxisTime,
  formatChartTooltipDate,
} from "../../utils/dateFormat";

type Props = {
  data: any[];
  params: string[];
};

// Color palette for different parameters
const PARAM_COLORS = [
  "#0369A1", // Ocean Blue
  "#0E7490", // Deep Cyan
  "#7C3AED", // Violet
  "#D97706", // Amber
  "#059669", // Green
  "#E11D48", // Rose
  "#2563EB", // Blue
  "#9333EA", // Purple
];

export default function LineSensorChart({ data, params }: Props) {
  return (
    <>
      <div className="h-94">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke="#E2EDF5" strokeDasharray="3 3" vertical={false} />
            <XAxis
              tickMargin={10}
              dataKey="t"
              tick={{ fill: "#63839A", fontSize: 12 }}
              axisLine={{ stroke: "#D1E5F2" }}
              tickLine={false}
              tickFormatter={(value) => formatChartAxisTime(value)}
            />
            <YAxis
              tickMargin={15}
              tick={{ fill: "#63839A", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #D1E5F2",
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(15, 41, 66, 0.08)",
              color: "#0F2942",
              fontSize: 12,
              padding: "10px 14px",
            }}
            labelStyle={{
              color: "#63839A",
              fontSize: 12,
              marginBottom: 6,
            }}
            itemStyle={{
              fontSize: 12,
            }}
            formatter={(value: any) => {
              if (typeof value === "number") {
                return formatSensorValue(value, 2);
              }
              return value;
            }}
            labelFormatter={(value) => formatChartTooltipDate(value)}
          />

            {/* Only show legend when multiple parameters are selected */}
            {params.length > 1 && (
              <Legend
                verticalAlign="bottom"
                height={60}
                wrapperStyle={{
                  color: "#0F2942",
                  fontSize: 13,
                  paddingTop: "20px",
                }}
              />
            )}

            {/* Render a Line for each selected parameter */}
            {params.map((param, index) => {
              const color = PARAM_COLORS[index % PARAM_COLORS.length];

              return (
                <Line
                  key={param}
                  type="linear"
                  dataKey={param}
                  dot={{ r: 3, stroke: color, strokeWidth: 1 }}
                  stroke={color}
                  strokeWidth={2.5}
                  activeDot={{ r: 5 }}
                  strokeLinecap="butt"
                  strokeLinejoin="miter"
                  name={param.toUpperCase()}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Show exposure ranges when single parameter is selected */}
      {params.length === 1 && <ExposureLimitsDisplay parameter={params[0]} />}
    </>
  );
}
