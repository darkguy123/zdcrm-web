"use client";

import React from "react";
import { Card } from "@/components/ui";
import InfoIcon from "@/icons/core/InfoIcon";
import { useGetCustomerBehaviourStats } from "@/mutations/customer.mutation";
import Link from "next/link";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
} from "recharts";

/* ---------------------------------------------
   Types
--------------------------------------------- */

type ClientBehaviorChartItem = {
    name: string;
    value: number;
    percentage: number;
    color: string;
};

/* ---------------------------------------------
   Constants
--------------------------------------------- */

const BEHAVIOUR_COLORS: Record<string, string> = {
    "First Time": "#A0AEC0",
    "Frequent": "#0CAF60",
    "Returning": "#3182CE",
    "Quiet": "#DD6B20",
    "Unknown": "#E53E3E",
};

/* ---------------------------------------------
   Component
--------------------------------------------- */

const ClientBehaviorChart: React.FC<{
    show_see_all?: boolean;
}> = ({ show_see_all = false }) => {
    const { data: customerBehaviorData, isLoading } =
        useGetCustomerBehaviourStats();

    /* ---------------------------------------------
       Transform API → Chart Data
    --------------------------------------------- */
    const data: ClientBehaviorChartItem[] = React.useMemo(() => {
        if (!customerBehaviorData?.stats) return [];

        return customerBehaviorData.stats.map((item) => ({
            name: item.behaviour,
            value: item.count,
            percentage: Number(item.percentage),
            color: BEHAVIOUR_COLORS[item.behaviour] ?? "#CBD5E0",
        }));

    }, [customerBehaviorData]);

    /* ---------------------------------------------
       Loading / Empty States
    --------------------------------------------- */

    if (isLoading) {
        return (
            <Card className="p-6 flex items-center justify-center h-[300px]">
                <span className="text-sm text-muted-foreground">
                    Loading client behavior...
                </span>
            </Card>
        );
    }

    if (!data.length) {
        return (
            <Card className="p-6 flex items-center justify-center h-[300px]">
                <span className="text-sm text-muted-foreground">
                    No client behavior data available
                </span>
            </Card>
        );
    }

    /* ---------------------------------------------
       Render
    --------------------------------------------- */

    return (
        <Card className="p-6">
            {/* Header */}
            <div className="mb-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-xl font-semibold font-dm-sans text-slate-900">
                        Client Behavior
                    </h2>
                    <InfoIcon />
                </div>

                {show_see_all && (
                    <Link
                        href="/report-analytics/conversion-statistics"
                        className="font-medium text-[#0CAF60] px-3 py-1 rounded hover:underline"
                    >
                        See All
                    </Link>
                )}
            </div>

            <div className="flex w-full flex-row items-center justify-between gap-6">
                {/* Donut Chart */}
                <div className="h-[220px] w-[45%]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey="value"
                                nameKey="name"
                                innerRadius="70%"
                                outerRadius="100%"
                                paddingAngle={0}
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={index}
                                        fill={entry.color}
                                        stroke="none"
                                    />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="w-[55%] space-y-3">
                    {/* Headers */}
                    <div className="flex items-center justify-end text-sm font-medium text-[#979797]">
                        <span className="mr-4 font-dm-sans">No. client</span>
                        <span className="font-dm-sans">Percentage</span>
                    </div>

                    {data.map((item) => (
                        <div
                            key={item.name}
                            className="flex items-center justify-between text-xs sm:text-sm py-0.5"
                        >
                            <div className="flex items-center gap-2">
                                <span
                                    className="size-3 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className="text-[#718096] text-base font-medium font-dm-sans">
                                    {item.name}
                                </span>
                            </div>

                            <div className="flex items-center gap-8 font-extrabold">
                                <span className="w-12 text-center text-slate-900 font-dm-sans">
                                    {item.value}
                                </span>
                                <span className="w-12 text-center text-slate-900 font-dm-sans">
                                    {item.percentage.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
};

export default ClientBehaviorChart;
