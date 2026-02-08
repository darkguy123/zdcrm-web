import React from "react";
import { DateRange } from "react-day-picker";
import { Controller, useForm } from "react-hook-form";
import { subMonths } from "date-fns";

import { useGetAllBranches } from "@/app/(dashboard)/admin/businesses/misc/api";
import SelectSingleSimple from "@/components/ui/selectSingleSimple";
import { SelectBranchCombo, SelectSingleCombo } from "@/components/ui";
import { RangeAndCustomDatePicker, Spinner } from "@/components/ui";

import { useGeTOrderStats } from "../../api";
import OrderStatsCard from "./OrderStatsCard";
import OrderStatsCardSkeleton from "./OrderStatsSkeleton";
import { useGetAllBusiness } from "@/mutations/business.mutation";

const today = new Date();
const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
const monthsAgo = subMonths(new Date(), 20);

const OrderStatsHeaderSection = () => {
  const { data: business, isLoading: isFetchingBranch } =
    useGetAllBusiness();

  const { control, register, watch, setValue } = useForm<{
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
      period: "today",
    },
  });
  const {
    data: order_stats,
    isLoading: isLoadingStats,
    isFetching: isFetchingStats,
  } = useGeTOrderStats({
    branch: watch("branch") == "all" ? undefined : watch("branch"),
    date_from: watch("date").from?.toISOString().split("T")[0],
    date_to: watch("date").to?.toISOString().split("T")[0],
    period: watch("period"),
  });

  return (
    <div>
      <header className="flex justify-between items-center mb-6">
        <h1 className="flex items-center gap-2 text-xl md:text-[1.5rem] font-medium text-[#17181C] ">
          Order Statistics
          {isFetchingStats && <Spinner />}
        </h1>
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
              if (value.dateType === "custom" && value.from && value.to) {
                setValue("date", { from: value.from, to: value.to });
                setValue("period", "custom");
              } else {
                setValue(
                  "period",
                  value.dateType as
                  | "today"
                  | "week"
                  | "month"
                  | "year"
                  | "custom"
                );
              }
            }}
            value={{
              dateType: watch("period"),
              from: watch("date").from,
              to: watch("date").to,
            }}
          />
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
        {isLoadingStats &&
          Array.from({ length: 8 }).map((_, index) => (
            <OrderStatsCardSkeleton key={index} />
          ))}
        {Object.entries(order_stats?.data || {}).map(([key, value], index) => (
          <OrderStatsCard key={index} key_text={key} value={value} />
        ))}
      </div>
    </div>
  );
};

export default OrderStatsHeaderSection;
