'use client'

import React from 'react';
import { useGetTopProducts } from '../../api';
import { Skeleton } from "@/components/ui/skeleton"
import { DateRange } from 'react-day-picker';
import { Controller, useForm } from 'react-hook-form';
import { useGetAllBranches } from '@/app/(dashboard)/admin/businesses/misc/api';
import { subMonths } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, RangeAndCustomDatePicker, SelectSingleCombo, Spinner } from '@/components/ui';
import SelectSingleSimple from '@/components/ui/selectSingleSimple';
import { SelectBranchCombo } from '@/components/ui';
import { useGetAllBusiness } from '@/mutations/business.mutation';


const today = new Date();
const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
const monthsAgo = subMonths(new Date(), 1);

const OrderStatsTopProducts: React.FC = () => {
  const { data: business, isLoading: isFetchingBranch } = useGetAllBusiness();
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
      period: 'today',
    },
  });


  const { data, isLoading, isFetching } = useGetTopProducts({
    branch: watch('branch') == "all" ? undefined : watch('branch'),
    date_from: watch('date').from?.toISOString().split('T')[0],
    date_to: watch('date').to?.toISOString().split('T')[0],
    period: watch('period'),
  });
  const products = data?.data || [];
  const skeletonRows = Array(5).fill(null);

  return (
    <Card className='overflow-hidden w-full'>
      <CardHeader className="flex md:!flex-row items-center justify-between p-4 md:p-6">
        <CardTitle className='text-lg md:text-xl font-medium text-[#17181C] flex items-center gap-1'>
          Top Products
          {
            isFetching && <Spinner size={14} />
          }
        </CardTitle>

        <div className="flex items-center justify-end gap-2 flex-wrap max-w-max">
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
      <div className="overflow-x-auto">
        <table className='w-full text-left'>
          <thead>
            <tr className='bg-gray-100 text-gray-600 uppercase text-sm leading-normal'>
              <th className='py-3 px-6'>#</th>
              <th className='py-3 px-6'>Name</th>
              <th className='py-3 px-6'>Category</th>
              <th className='py-3 px-6'>Orders</th>
              <th className='py-3 px-6'>Quantity</th>
            </tr>
          </thead>
          <tbody className='text-gray-600 text-sm font-light'>
            {isLoading ? (
              skeletonRows.map((_, index) => (
                <tr key={index} className='border-b border-gray-200'>
                  <td className='py-3 px-6'><Skeleton className="h-4 w-4" /></td>
                  <td className='py-3 px-6'><Skeleton className="h-4 w-40" /></td>
                  <td className='py-3 px-6'><Skeleton className="h-4 w-20" /></td>
                  <td className='py-3 px-6'>
                    <Skeleton className="h-8 w-24" />
                  </td>
                  <td className='py-3 px-6'><Skeleton className="h-4 w-8" /></td>
                </tr>
              ))
            ) : (
              products.map((product, index) => (
                <tr
                  key={product.product_id}
                  className='border-b border-gray-200 hover:bg-gray-100'
                >
                  <td className='py-3 px-6 text-center'>{`0${index + 1}`}</td>
                  <td className='py-3 px-6'>{product.product_name}</td>
                  <td className='py-3 px-6'>{product.category_name}</td>
                  <td className='py-3 px-6'>
                    <div className='bg-blue-100 text-blue-800 text-center rounded-md border border-blue-800 px-2 py-1'>
                      {product.order_count} Orders
                    </div>
                  </td>
                  <td className='py-3 px-6 text-center'>{product.total_quantity}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default OrderStatsTopProducts;

