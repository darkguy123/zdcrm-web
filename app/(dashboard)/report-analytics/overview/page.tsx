"use client";
import React from "react";
import data from "./data/overview.json";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
/* recharts */
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { EnquiryChannelsChart } from "../misc/components/conversion-statistics";
import { OrderStatsDeliveryZoneSection } from "../misc/components/order-stats";
import { FinancialOverviewSection } from "../misc/components/financial-report";
import { Controller, useForm } from "react-hook-form";
import { DateRange } from "react-day-picker";
import { monthsAgo, tomorrow } from "@/utils/functions";
import FinancialSummaryCards from "../misc/components/financial-report/FinancialSummaryCards";
import { useGetFinancialReportStats } from "@/mutations/order.mutation";
import { useGetInventoryChartStats } from "@/mutations/inventory.mutation";
import { RangeAndCustomDatePicker, SelectBranchCombo } from "@/components/ui";
import { useGetAllBranches } from "@/mutations/business.mutation";
import Link from "next/link";
import InventoryChart from "../misc/components/charts/InventoryChart";
import ClientBehaviorChart from "../misc/components/charts/ClientBehaviorChart";

const OverviewPage: React.FC = () => {
  const {
    summary,
    orderStats,
    financialOverview,
    conversion,
    trafficSource,
    clientBehavior,
    customers,
    inventory,
  } = data;

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

  const { data: branches, isLoading: isFetchingBranch } = useGetAllBranches();

  const {
    data: financial_stats,
    isLoading: isLoadingStats,
  } = useGetFinancialReportStats({
    branch: watch("branch") == "all" ? undefined : watch("branch"),
    date_from: watch("date").from?.toISOString().split("T")[0],
    date_to: watch("date").to?.toISOString().split("T")[0],
    period: watch("period"),
  });

  const { data: inventory_data, isLoading: isLoadingInventory } = useGetInventoryChartStats({
    branch: watch("branch") == "all" ? undefined : watch("branch"),
  })

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">All Reports</h2>
        {/* <div className="mt-2 sm:mt-0 flex flex-wrap items-center gap-3">
          <Select defaultValue="all">
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              <SelectItem value="lagos">Lagos</SelectItem>
              <SelectItem value="yaba">Yaba</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="custom">
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Today" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>

          <Button>Compare</Button>
        </div> */}
        <div className="flex items-center gap-4 flex-wrap max-w-max">
          <Controller
            name="branch"
            control={control}
            render={({ field }) => (
              <SelectBranchCombo
                noLabel
                value={watch("branch")}
                onChange={(new_value) => setValue("branch", new_value)}
                placeholder="Filter Branch"
                variant="light"
                size="thin"
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
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FinancialSummaryCards stats={financial_stats} isLoading={isLoadingStats} />
      </div>

      {/* Two large charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <OrderStatsDeliveryZoneSection showDetailed={false} />
        <FinancialOverviewSection showDetailed={false} />
      </div>


      {/* Bottom row: client behavior, customers line, inventory */}
      <div className="grid grid-cols-[repeat(auto-fit,_minmax(100%,_1fr))] md:grid-cols-[repeat(auto-fit,_minmax(20rem,_1fr))] gap-4">
        <ClientBehaviorChart show_see_all={true} />

        <InventoryChart
          items={inventory_data}
          title="Inventory Alert"
          isLoading={isLoadingInventory}
        />
      </div>
      {/* Middle row: conversion map (placeholder) and traffic source */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Conversion Statistics</CardTitle>
            <Button variant="ghost" size="sm">
              See All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3">
                <div className="text-2xl font-bold">{conversion.total}</div>
                <div className="text-sm text-muted-foreground">
                  Compared to last month
                </div>
                <div className="mt-4 space-y-2">
                  {conversion.regions.map((r, idx) => (
                    <div
                      key={r.name}
                      className={`flex items-center justify-between ${idx % 2 !== 1 ? "bg-[#F9FAFB]" : ""
                        } rounded-md px-2 py-1`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ background: r.color }}
                        />
                        <div className="text-sm">{r.name}</div>
                      </div>
                      <div className="text-sm">{r.value.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1">
                <Image
                  src="/map.svg"
                  alt="Sales Location"
                  width={600}
                  height={400}
                  className="object-contain w-full h-full"
                />
              </div>
            </div>
          </CardContent>
        </Card> */}

        <section>
          <EnquiryChannelsChart from_overview={true} />
        </section>
      </div>
    </div>
  );
};

export default OverviewPage;
