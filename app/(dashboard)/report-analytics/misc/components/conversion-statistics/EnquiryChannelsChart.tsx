"use client";

import React from "react";
import { DateRange } from "react-day-picker";
import { subMonths } from "date-fns";
import { Controller, useForm } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton, RangeAndCustomDatePicker, SelectSingleCombo, Spinner } from "@/components/ui";

import SelectSingleSimple from "@/components/ui/selectSingleSimple";
import { SelectBranchCombo } from '@/components/ui';
import { useGetAllBranches } from "@/app/(dashboard)/admin/businesses/misc/api";
import { useGetEnquiryChannelStats } from "../../api";
import { cn } from "@/lib/utils";
import { useGetAllBusiness } from "@/mutations/business.mutation";

const chartConfig = {
  Google: { label: "Google", color: "#25D366" },
  Instagram: { label: "Instagram", color: "#E6A500" },
  WhatsApp: { label: "WhatsApp", color: "#25D366" },
  "Store walk in": { label: "Store walk in", color: "#6E81F4" },
  Others: { label: "Others", color: "#6E81F4" },
  Email: { label: "Email", color: "#1C1C1C" },
  Website: { label: "Website", color: "#0095FF" },
  "Phone Call": { label: "Phone Call", color: "#6FC5F5" },
  Facebook: { label: "Facebook", color: "#4267B2" },
  "Tik Tok": { label: "TikTok", color: "#69C9D0" },
};

const today = new Date();
const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
const monthsAgo = subMonths(new Date(), 1);

interface EnquiryChannelsChartProps {
  from_overview?: boolean;
}
function EnquiryChannelsChart({ from_overview }: EnquiryChannelsChartProps) {
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
      period: "today",
    },
  });

  const { data, isLoading, isFetching } = useGetEnquiryChannelStats({
    branch: watch("branch") == "all" ? undefined : watch("branch"),
    date_from: watch("date").from?.toISOString().split("T")[0],
    date_to: watch("date").to?.toISOString().split("T")[0],
    period: watch("period"),
  });

  const chartData =
    data?.data.channels.map((channel) => ({
      channel: channel.channel,
      enquiries: channel.total_count,
      converted_enquiries: channel.converted_count,
    })) || [];

  // Find max enquiries for consistent bar scaling
  const maxEnquiries = Math.max(...chartData.map((item) => item.enquiries), 1);

  const ProgressBar = ({
    channel,
    enquiries,
    convertedEnquiries,
  }: {
    channel: string;
    enquiries: number;
    convertedEnquiries: number;
  }) => {
    const channelConfig = chartConfig[channel as keyof typeof chartConfig];
    const barColor = channelConfig?.color || "#8B909A";

    // Calculate bar widths as percentages of max enquiries
    const totalBarWidth = (enquiries / maxEnquiries) * 100;
    const convertedBarWidth = (convertedEnquiries / maxEnquiries) * 100;

    // Create lighter version of the color for total enquiries
    const lighterBarColor = `${barColor}40`; // Add transparency for lighter version

    return (
      <div className="flex flex-col gap-2 py-3 w-full">
        <header className="flex items-center justify-between gap-4 w-full">
          <span className="text-sm font-medium text-gray-900 text-left">
            {channelConfig?.label || channel}
          </span>

          <div className="text-sm text-gray-500 min-w-[60px] text-right">
            {convertedEnquiries}/{enquiries}
          </div>
        </header>

        <section className=" w-full">
          <div className="w-full bg-gray-200 rounded-sm h-3.5 relative overflow-hidden">
            {/* Total enquiries bar (lighter color) */}
            <div
              className="h-3.5 rounded-full absolute top-0 left-0"
              style={{
                width: `${totalBarWidth}%`,
                backgroundColor: lighterBarColor,
              }}
            />
            {/* Converted enquiries bar (darker color, overlays the lighter one) */}
            <div
              className="h-3 rounded-full absolute top-0 left-0"
              style={{
                width: `${convertedBarWidth}%`,
                backgroundColor: barColor,
              }}
            />
          </div>
        </section>
      </div>
    );
  };

  const usableChartData = from_overview ? chartData.slice(0, 4) : chartData;

  return (
    <Card className={cn(from_overview ? "" : "h-full 2xl:col-span-2")}>
      <CardHeader className="flex md:!flex-row items-center justify-between">
        <CardTitle className="text-xl md:text-[1.5rem] font-medium text-[#17181C] flex items-center gap-2">
          Conversion Channel
          {isFetching && <Spinner />}
        </CardTitle>
        <div className="flex items-center gap-4 flex-wrap max-w-max">
          {from_overview ? (
            <LinkButton
              href={"/report-analytics/conversion-statistics"}
              variant={"outline"}
              size={"thin"}
            >
              View All
            </LinkButton>
          ) : (
            <>
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
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-end text-xs text-gray-500 mb-4 pr-4">
              No. of Enquiries/No. of Converted Enquiries
            </div>
            <div
              className={cn(
                "grid gap-x-10",
                from_overview ? "gap-y-2.5" : "xl:grid-cols-2"
              )}
            >
              {usableChartData.map((item, index) => (
                <ProgressBar
                  key={index}
                  channel={item.channel}
                  enquiries={item.enquiries}
                  convertedEnquiries={item.converted_enquiries}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EnquiryChannelsChart;
