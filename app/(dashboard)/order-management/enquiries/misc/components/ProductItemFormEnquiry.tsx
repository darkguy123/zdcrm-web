import React from 'react'


import { Control, FieldErrors, useFieldArray, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { FormControl, FormField, FormItem, Input, ProductsDropdown, SelectSingleCombo } from '@/components/ui';
import { useGetProductsInventory, useGetStockInventory } from '@/app/(dashboard)/inventory/misc/api';
import { cn } from '@/lib/utils';

import { NewEnquiryFormValues } from '../utils/schema';
import ProductItemSelector from './ProductItemSelector';


const ProductItemFormEnquiry = ({
  index,
  control,
  watch,
  setValue,
  errors,
  selectedBranch,
}: {
  index: number;
  control: Control<NewEnquiryFormValues>;
  watch: UseFormWatch<NewEnquiryFormValues>;
  setValue: UseFormSetValue<NewEnquiryFormValues>;
  errors: FieldErrors<NewEnquiryFormValues>;
  selectedBranch: number | undefined;
  categoryName: string;
}) => {


  const watchedItems = watch("items");
  const watchedInventories = watch(`items.${index}.inventories`)


  const { data: productsInvetories, isLoading: productsLoading, isFetching: productsFetching, error: productsError, refetch: refetchProductsInventory } = useGetProductsInventory({
    page: 1,
    size: 20000000000000,
    category: Number(watchedItems?.[index].category),
    business: selectedBranch,
  });


  return (

    <>
      {
        watchedInventories?.map((_, invIndex) =>

          <>
            <ProductItemSelector
              inventoryId={watch(`items.${index}.inventories.${invIndex}.product_inventory_id`)}
              setInventoryId={(inventoryId) => {
                setValue(`items.${index}.inventories.${invIndex}.product_inventory_id`, inventoryId);
              }}
              options={productsInvetories?.data!}
              disabled={productsLoading || (!productsLoading && !productsInvetories?.data.length)}
              isLoadingOptions={productsLoading}
              isFetchingOptions={productsFetching}
              errorMessage={errors.items?.[index]?.inventories?.[invIndex]?.product_inventory_id?.message}
              hasError={!!errors.items?.[index]?.inventories?.[invIndex]?.product_inventory_id}
            />

            <FormField
              control={control}
              name={`items.${index}.inventories.${0}.instruction`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      label="Instruction"
                      placeholder='Enter instruction'
                      {...field}
                      hasError={!!errors.items?.[index]?.inventories?.[invIndex]?.instruction}
                      errorMessage={errors.items?.[index]?.inventories?.[invIndex]?.instruction?.message}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`items.${index}.inventories.${invIndex}.message`}
              render={({ field }) => (
                <FormItem className='col-span-2 xl:col-span-3'>
                  <FormControl>
                    <Input
                      label="Message"
                      placeholder='Enter message'
                      {...field}
                      hasError={!!errors.items?.[index]?.inventories?.[invIndex]?.message}
                      errorMessage={errors.items?.[index]?.inventories?.[invIndex]?.message as string}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

          </>
        )
      }
    </>

  )
}

export default ProductItemFormEnquiry