"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  RangeAndCustomDatePicker,
  SelectBranchCombo,
  SelectSingleCombo,
  Spinner,
} from "@/components/ui";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Controller, useForm } from "react-hook-form";
import { DateRange } from "react-day-picker";

import { useGetPaymentStatusStats } from "@/mutations/order.mutation";
import { monthsAgo, tomorrow } from "@/utils/functions";
import { PaymentStatusStats } from "@/types/finacialStatistics.types";
import { OrderStatsDeliveryZoneChartSkeleton } from "../order-stats/OrderStatsDeliveryZoneSkeleton";
import { useGetAllBusiness } from "@/mutations/business.mutation";

// ---- Types ------------------------------------------------

export type PaymentStatusDatum = {
  status: string;   // x-axis label
  orders: number;   // number of orders
  amount: number;   // numeric amount
};

export type PaymentStatusConversionChartProps = {
  title?: string;
  className?: string;
  formatCurrency?: (value: number) => string;
  minCategoryWidth?: number;
  barGap?: number;
  barCategoryGap?: number | string;
};

// ---- Config / helpers -------------------------------------

const chartConfig: ChartConfig = {
  orders: { label: "No. of Orders", color: "hsl(var(--chart-1))" },
  amount: { label: "Amount", color: "hsl(var(--chart-2))" },
};

const defaultCurrency = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const shortNumber = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) {
    const val = +(v / 1_000_000).toFixed(1);
    return `${val}M`;
  }
  if (abs >= 1_000) {
    const val = Math.round(v / 1_000);
    return `${val}k`;
  }
  return String(v);
};

// ---- Component --------------------------------------------

export default function PaymentStatusConversionChart({
  title = "Payment Status Conversion",
  className,
  formatCurrency = (v) => defaultCurrency.format(v),
  barGap = 8,
  barCategoryGap = 32,
}: PaymentStatusConversionChartProps) {
  const { data: business, isLoading: isFetchingBranch } =
    useGetAllBusiness();

  const { control, watch, setValue } = useForm<{
    branch?: string;
    date: DateRange;
    period: "today" | "week" | "month" | "year" | "custom";
  }>({
    defaultValues: {
      branch: undefined,
      date: {
        from: monthsAgo,
        to: tomorrow,
      },
      period: "custom",
    },
  });

  const branch = watch("branch");
  const period = watch("period");
  const date = watch("date");

  const {
    data: paymentStatusData,
    isLoading,
    isFetching,
  } = useGetPaymentStatusStats({
    branch,
    date_from:
      period === "custom" && date.from
        ? date.from.toISOString().split("T")[0]
        : undefined,
    date_to:
      period === "custom" && date.to
        ? date.to.toISOString().split("T")[0]
        : undefined,
    period,
  });

  // Map API data -> chart data
  const chartData: PaymentStatusDatum[] =
    (Array.isArray(paymentStatusData) ? paymentStatusData : [])?.map(
      (item: PaymentStatusStats) => ({
        status: item.payment_option_label,
        orders: item.order_count ?? 0,
        amount: item.total_amount ? Number(item.total_amount) || 0 : 0,
      })
    ) ?? [];

  const maxOrders =
    chartData.length > 0
      ? Math.max(...chartData.map((d) => d.orders ?? 0))
      : 0;

  const maxAmount =
    chartData.length > 0
      ? Math.max(...chartData.map((d) => d.amount ?? 0))
      : 0;

  return (
    <Card className={`max-h-[600px] ${className ?? ""}`}>
      <CardHeader className="flex md:!flex-row items-center justify-between">
        <CardTitle className="text-xl md:text-[1.5rem] font-medium text-[#17181C] flex items-center gap-2">
          {title}
          {isFetching && <Spinner />}
        </CardTitle>

        <div className="flex items-center gap-4 flex-wrap max-w-max">
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

          <RangeAndCustomDatePicker
            className="max-w-max"
            variant="light"
            size="thin"
            onChange={(value) => {
              if (value.dateType === 'custom' && value.from && value.to) {
                setValue('date', { from: value.from, to: value.to });
                setValue('period', 'custom');
              } else {
                setValue('period', value.dateType as "today" | "week" | "month" | "year" | "custom");
              }
            }}
            value={{
              dateType: watch('period'),
              from: watch('date').from,
              to: watch('date').to
            }}
          />
        </div>
      </CardHeader>

      <div>
        <ChartContainer
          config={chartConfig}
          className="w-full overflow-visible max-w-full max-h-[400px]"
        >
          {isLoading ? (
            <OrderStatsDeliveryZoneChartSkeleton />
          ) : (
            <ResponsiveContainer className="!w-full" height="100%">
              <BarChart
                data={chartData}
                barSize={12}
                margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                barCategoryGap={barCategoryGap}
                barGap={barGap}
              >
                <CartesianGrid strokeDasharray="0"
                  vertical={false}
                  horizontal={true}
                  stroke="#EFF1F3"
                  strokeWidth={1}
                />

                {/* Visible axis for AMOUNT (formatted 17k / 300k / 1.2M) */}
                <YAxis
                  yAxisId="amount"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  domain={[0, maxAmount * 1.1 || 1]}
                  tickFormatter={(v) => shortNumber(Number(v))}
                />

                {/* Hidden axis for ORDERS so bars are not tiny */}
                <YAxis
                  yAxisId="orders"
                  hide
                  domain={[0, maxOrders * 1.1 || 1]}
                />

                <XAxis
                  dataKey="status"
                  tickLine={false}
                  tickMargin={20}
                  axisLine={false}
                  tick={{ fontFamily: "Poppins, sans-serif", fontSize: 12 }}
                  interval={0}
                  height={56}
                  padding={{ left: 10, right: 10 }}
                />

                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dashed"
                      labelFormatter={(label) => String(label)}
                      formatter={(value: unknown, name?: string | number) => {
                        if (name === "amount")
                          return [formatCurrency(Number(value)), "Amount"];
                        if (name === "orders")
                          return [
                            Number(value).toLocaleString(),
                            "No. of Orders",
                          ];
                        return [String(value), String(name)];
                      }}
                    />
                  }
                  wrapperStyle={{
                    overflow: "visible",
                    zIndex: 9999,
                    pointerEvents: "auto",
                    blur: "10px",
                  } as any}
                  contentStyle={{ overflow: "visible" } as any}
                />

                <Bar
                  yAxisId="orders"
                  dataKey="orders"
                  fill="var(--color-orders)"
                  radius={4}
                  name="Orders"
                />
                <Bar
                  yAxisId="amount"
                  dataKey="amount"
                  fill="var(--color-amount)"
                  radius={4}
                  name="Amount"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>
      </div>

      <CardFooter>
        <p className="w-full text-center text-muted-foreground text-xs font-dm-sans">
          Total no of order/Amount made from payment status
        </p>
      </CardFooter>
    </Card>
  );
}
