"use client";

import { Controller, useForm } from "react-hook-form";
import { CartesianGrid, Legend, XAxis, YAxis, Area, AreaChart } from "recharts";

import { SelectSingleCombo, Spinner } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import SelectSingleSimple from "@/components/ui/selectSingleSimple";
import { SelectBranchCombo } from "@/components/ui";

import { useGetClientTrackingStats } from "../../api";
import { useGetAllBranches } from "@/app/(dashboard)/admin/businesses/misc/api";
import { useGetAllBusiness } from "@/mutations/business.mutation";

const chartConfig = {
  new_customers: {
    label: "New Clients",
    color: "hsl(var(--chart-1))",
  },
  returning_customers: {
    label: "Returning Clients",
    color: "hsl(var(--chart-2))",
  },
};

function ClientTrackingChart() {
  const { control, watch, setValue } = useForm<{
    branch?: string;
  }>({
    defaultValues: {
      branch: undefined,
    },
  });
  const { data: business, isLoading: isFetchingBranch } =
    useGetAllBusiness();
  const { data, isLoading, isFetching } = useGetClientTrackingStats({
    branch: watch("branch") == "all" ? undefined : watch("branch"),
  });

  const chartData = data?.data.monthly_stats || [];

  return (
    <Card>
      <CardHeader className="flex md:!flex-row items-center justify-between">
        <CardTitle className="text-xl md:text-[1.5rem] font-medium text-[#17181C] flex items-center gap-2">
          Clients
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
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="max-h-[400px] w-full h-[95%]"
        >
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <defs>
              <linearGradient
                id="newCustomersGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="var(--color-new_customers)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-new_customers)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient
                id="returningCustomersGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="var(--color-returning_customers)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-returning_customers)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            {/* Areas with gradient fill and strokes to draw lines */}
            <Area
              dataKey="new_customers"
              type="natural"
              fill="url(#newCustomersGradient)"
              fillOpacity={0.4}
              stroke="var(--color-new_customers)"
              strokeWidth={2}
            />
            <Area
              dataKey="returning_customers"
              type="natural"
              fill="url(#returningCustomersGradient)"
              fillOpacity={0.4}
              stroke="var(--color-returning_customers)"
              strokeWidth={2}
            />
            <Legend
              verticalAlign="bottom"
              align="center"
              layout="horizontal"
              wrapperStyle={{
                paddingTop: "20px",
              }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export default ClientTrackingChart;
