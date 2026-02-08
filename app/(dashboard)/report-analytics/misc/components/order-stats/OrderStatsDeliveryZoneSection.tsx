"use client";

import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { RangeAndCustomDatePicker, SelectSingleCombo, Spinner } from "@/components/ui";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useGeTOrderDeliveryStats } from "../../api/getOrderStatisticsDeliveryZone";
import { DateRange } from "react-day-picker";
import { Controller, useForm } from "react-hook-form";
import { subMonths } from "date-fns";
import { OrderStatsDeliveryZoneChartSkeleton } from "./OrderStatsDeliveryZoneSkeleton";
import { SelectBranchCombo } from '@/components/ui';
import { useGetAllBusiness } from "@/mutations/business.mutation";

const chartConfig = {
  order_count: {
    label: "No. of Orders",
    color: "#00E096",
  },
  enquiry_count: {
    label: "Enquiries",
    color: "#0095FF",
  },
} satisfies ChartConfig;

const today = new Date();
const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
const monthsAgo = subMonths(new Date(), 1);

export function OrderStatsDeliveryZoneSection({ showDetailed = true }: { showDetailed?: boolean }) {
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
      period: 'month',
    },
  });

  const { data: business, isLoading: isFetchingBranch } =
    useGetAllBusiness();

  const branch = watch("branch");
  const period = watch("period");
  const date = watch("date");

  const { data, isLoading, isFetching } = useGeTOrderDeliveryStats({
    branch: branch === "all" ? undefined : branch,
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




  const chartDataRaw = Array.isArray(data?.data?.delivery_stats) ? data!.data.delivery_stats : [];
  const tickInterval = chartDataRaw.length > 8 ? Math.ceil(chartDataRaw.length / 8) : 0;

  return (
    <Card className="max-h-[600px]">
      <CardHeader className="flex md:!flex-row items-center justify-between">
        <CardTitle className="text-xl md:text-[1.5rem] font-medium text-[#17181C] flex items-center gap-2">
          Order Delivery Zones
          {isFetching && <Spinner />}
        </CardTitle>

        {showDetailed && (
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
        )}
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
              <BarChart data={chartDataRaw} barSize={20} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} stroke="#ccc" />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontFamily: "Poppins, sans-serif", fontSize: 12 }}
                />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={20}
                  axisLine={false}
                  tickFormatter={(value) => (typeof value === "string" ? value.slice(0, 15) : value)}
                  tick={{ fontFamily: "Poppins, sans-serif", fontSize: 12 }}
                  interval={tickInterval}
                  height={56}
                  padding={{ left: 10, right: 10 }}
                />

                {/* Use ChartTooltip from your UI; pass wrapperStyle to minimize clipping */}
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dashed" />}
                  wrapperStyle={{ overflow: "visible", zIndex: 9999, pointerEvents: "auto" } as any}
                  contentStyle={{ overflow: "visible" } as any}
                />

                <Bar
                  dataKey="enquiry_count"
                  fill={chartConfig.enquiry_count.color}
                  radius={4}
                  name="Enquiries"
                />
                <Bar
                  dataKey="order_count"
                  fill={chartConfig.order_count.color}
                  radius={4}
                  name="Orders"
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

export default OrderStatsDeliveryZoneSection;
