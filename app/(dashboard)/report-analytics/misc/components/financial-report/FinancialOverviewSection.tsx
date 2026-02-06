"use client";

import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { SelectSingleCombo, Spinner } from "@/components/ui";
import SelectSingleSimple from "@/components/ui/selectSingleSimple";
import { SelectBranchCombo } from "@/components/ui";

import { useGetFinancialOverviewStats } from "../../api";
import { useGetAllBranches } from "@/app/(dashboard)/admin/businesses/misc/api";
import BarChartSkeleton from "./BarChartSkeleton";
import { useGetAllBusiness } from "@/mutations/business.mutation";

const chartConfig = {
  total_revenue: {
    label: "Total Revenue",
    color: "#00E096",
  },
  net_profit: {
    label: "Net Profit",
    color: "#0095FF",
  },
};

type FormValues = {
  branch?: string;
  period_type: "weekly" | "monthly";
};

export function FinancialOverviewSection({ showDetailed = true }: { showDetailed?: boolean }) {
  const { data: business, isLoading: isFetchingBranch } = useGetAllBusiness();

  const { control, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      branch: undefined,
      period_type: "weekly",
    },
  });

  const branchWatch = watch("branch");
  const periodType = watch("period_type");

  const { data, isLoading, isFetching } = useGetFinancialOverviewStats({
    branch: branchWatch === "all" ? undefined : branchWatch,
    period_type: periodType,
  });

  const chartData = useMemo(() => {
    // defensive checks for API shape: data?.data?.data
    const raw = Array.isArray(data?.data?.data) ? data!.data.data : [];
    if (!raw || raw.length === 0) return [];

    return raw.map((item: any) => {
      const total_revenue = Number(item.total_revenue) || 0;
      const net_profit = Number(item.net_profit) || 0;

      const shortDay = (() => {
        if (item.day && typeof item.day === "string") {
          return item.day.length > 3 ? item.day.slice(0, 3) : item.day;
        }
        if (item.date) {
          try {
            const parsed = parseISO(item.date);
            return format(parsed, "EEE"); // Mon, Tue, Wed
          } catch {
            return "";
          }
        }
        return "";
      })();

      const formattedDate = periodType === "weekly" ? shortDay : item.month ?? "";

      return {
        ...item,
        total_revenue,
        net_profit,
        formattedDate,
      };
    });
  }, [data, periodType]);

  // dynamic interval to cap visible ticks (roughly max ~8 ticks)
  const tickInterval = chartData.length > 8 ? Math.ceil(chartData.length / 8) : 0;

  return (
    <Card className="">
      <CardHeader className="flex md:!flex-row items-center justify-between">
        <CardTitle className="text-xl md:text-2xl font-medium text-[#17181C] flex items-center gap-2">
          Financial Overview
          {isFetching && <Spinner />}
        </CardTitle>

        {showDetailed && (
          <div className="flex items-center gap-4 flex-wrap max-w-max">
            <Controller
              name="period_type"
              control={control}
              render={({ field }) => (
                <SelectSingleSimple
                  {...field}
                  onChange={(new_value) =>
                    setValue("period_type", new_value as "weekly" | "monthly")
                  }
                  value={periodType}
                  options={[
                    { label: "Weekly", value: "weekly" },
                    { label: "Monthly", value: "monthly" },
                  ]}
                  labelKey="label"
                  valueKey="value"
                  placeholder="Filter Period"
                  variant="light"
                  size="thin"
                />
              )}
            />
            <Controller
              name="branch"
              control={control}
              render={({ field }) => (
                <SelectSingleCombo
                  name="branch"
                  value={field.value?.toString() || ""}
                  onChange={(val) => field.onChange(Number(val))}
                  options={
                    business?.map((b) => ({
                      label: b.name,
                      value: b.id.toString(),
                    })) || []
                  }
                  valueKey="value"
                  labelKey="label"
                  variant="light"
                  size="thin"
                  placeholder="Select Business"
                  isLoadingOptions={isFetchingBranch}
                />
              )}
            />
          </div>
        )}
      </CardHeader>

      <div>
        <ChartContainer config={chartConfig} className="w-full overflow-visible max-w-full max-h-[400px]"
        >
          {isLoading ? (
            <BarChartSkeleton />
          ) : (
            <ResponsiveContainer className="!w-full" height="100%">
              <BarChart data={chartData} barSize={20} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} stroke="#ccc" />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontFamily: "Poppins, sans-serif", fontSize: 12 }}
                />
                <XAxis
                  dataKey="formattedDate"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontFamily: "Poppins, sans-serif", fontSize: 12 }}
                  interval={tickInterval}
                  height={60}
                  xAxisId={0}
                  tickSize={12}
                  scale="point"
                  padding={{ left: 20, right: 20 }}
                />
                <Tooltip
                  cursor={false}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-2 border border-gray-200 rounded shadow">
                          <p className="font-bold">{label}</p>
                          {payload.map((entry, index) => (
                            <p key={index} style={{ color: entry.color }}>
                              {entry.name}: N{Number(entry.value).toLocaleString()}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="total_revenue"
                  fill={chartConfig.total_revenue.color}
                  radius={4}
                  name="Total Revenue"
                />
                <Bar
                  dataKey="net_profit"
                  fill={chartConfig.net_profit.color}
                  radius={4}
                  name="Net Profit"
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  layout="horizontal"
                  wrapperStyle={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingLeft: "20px",
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>
      </div>
    </Card>
  );
}

export default FinancialOverviewSection;
