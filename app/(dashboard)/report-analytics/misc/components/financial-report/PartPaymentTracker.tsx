"use client";

import React from "react";

import { SelectBranchCombo, SelectSingleCombo, Spinner } from "@/components/ui";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Controller, useForm } from "react-hook-form";
import { useGetPartPaymentStats } from "@/mutations/order.mutation";
import { PartPaymentStats } from "@/types/finacialStatistics.types";
import { useGetAllBusiness } from "@/mutations/business.mutation";

const defaultCurrency = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 2,
});

// Progress bar component
const Track = ({
  color,
  value,
  max,
  height = 8,
  trailColor,
}: {
  color: string;
  value: number;
  max: number;
  height?: number;
  trailColor?: string;
}) => {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  return (
    <div
      className="w-full rounded-full transition-all duration-500"
      style={{ height, backgroundColor: trailColor ?? "var(--muted)" }}
    >
      <div
        className="rounded-full transition-all duration-500"
        style={{
          width: `${pct}%`,
          height,
          backgroundColor: color,
        }}
      />
    </div>
  );
};

export default function PartPaymentTracker() {
  const { data: business, isLoading: isFetchingBranch } =
    useGetAllBusiness();

  const { control, watch, setValue } = useForm<{
    branch?: string;
  }>({
    defaultValues: {
      branch: undefined,
    },
  });

  const branch = watch("branch");

  // Fetch API stats
  const { data, isLoading, isFetching } = useGetPartPaymentStats({
    branch: branch === "all" ? undefined : branch,
  });

  // Extract real API values
  const stats: PartPaymentStats | undefined = data;

  const orderCount = stats?.order_count ?? 0;
  const totalAmount = stats?.total_amount ? Number(stats.total_amount) : 0;
  const totalPaid = stats?.total_paid ? Number(stats.total_paid) : 0;
  const balanceDue = stats?.balance_due ? Number(stats.balance_due) : 0;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-xl md:text-[1.5rem] font-medium text-[#17181C] flex items-center gap-2">
          Part Payment Tracker
          {isLoading || isFetching && <Spinner />}
        </CardTitle>

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
      </CardHeader>

      <CardContent>
        <div className="grid">

          {/* Orders Row */}
          <div className="grid grid-cols-[220px_1fr_auto] items-center gap-4 py-4">
            <div className="text-base">Part Payment Orders</div>
            <Track
              color="#111827"
              value={orderCount}
              max={orderCount || 1}
              height={6}
              trailColor="transparent"
            />
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {orderCount} Orders
            </div>
          </div>

          <div className="border-t" />

          {/* Total Amount Row */}
          <div className="grid grid-cols-[220px_1fr_auto] items-center gap-4 py-4">
            <div className="text-base">Part Payment Amount</div>
            <Track
              color="#3B82F6"
              value={totalAmount}
              max={totalAmount || 1}
              height={8}
              trailColor="#DBEAFE"
            />
            <div className="text-sm whitespace-nowrap">
              <span className="inline-flex items-center rounded-full border border-blue-500 text-blue-600 px-3 py-1">
                {defaultCurrency.format(totalAmount)}
              </span>
            </div>
          </div>

          <div className="border-t" />

          {/* Paid Row */}
          <div className="grid grid-cols-[220px_1fr_auto] items-center gap-4 py-4">
            <div className="text-base">Part Payment Paid</div>
            <Track
              color="#22C55E"
              value={totalPaid}
              max={totalAmount || 1}
              height={8}
              trailColor="#DCFCE7"
            />
            <div className="text-sm whitespace-nowrap">
              <span className="inline-flex items-center rounded-full bg-emerald-500 text-white px-3 py-1">
                {defaultCurrency.format(totalPaid)}
              </span>
            </div>
          </div>

          <div className="border-t" />

          {/* Balance Row */}
          <div className="grid grid-cols-[220px_1fr_auto] items-center gap-4 py-4">
            <div className="text-base">Balance Due</div>
            <Track
              color="#EF4444"
              value={balanceDue}
              max={totalAmount || 1}
              height={8}
              trailColor="#FEE2E2"
            />
            <div className="text-sm whitespace-nowrap">
              <span className="inline-flex items-center rounded-full bg-red-500 text-white px-3 py-1">
                {defaultCurrency.format(balanceDue)}
              </span>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
