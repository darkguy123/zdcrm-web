import React from 'react';
import { Controller, useFieldArray, UseFormWatch, Control, UseFormSetValue, FieldErrors } from "react-hook-form";
import { TrashIcon } from 'lucide-react';

import { useGetCategories, useGetProducts, useGetProductsInventory, useGetStockInventory } from '@/app/(dashboard)/inventory/misc/api';
import { Checkbox, FormControl, FormField, FormItem, Input, SelectSingleCombo, Button } from '@/components/ui';



import { PRODUCT_TYPES_OPTIONS } from '@/constants';
import { Label } from '@/components/ui/label';
import { TProductInventoryItem } from '@/app/(dashboard)/inventory/misc/types/products';
import { TStockInventoryItem } from '@/app/(dashboard)/inventory/misc/types/stock';
import { formatCurrency } from '@/utils/currency';
import { ConvertibleEnquiryFormValues, NewEnquiryFormValues } from '../utils/schema';
import EnquiryFormMiscellaneous from './EnquiryFormMiscellaneous';
import EnquiryFormProductInventorySelector from './EnquiryFormProductInventorySelector';
import StockItemFormEnquiry from './StockItemFormEnquiry';
import { cn } from '@/lib/utils';
import { useGetPropertyOptions } from '../../../misc/api';
import EnquiryFormMiscellaneousComplete from './EnquiryFormMiscellaneousComplete';


interface EnquiryFormItemsSectionProps {
    control: Control<ConvertibleEnquiryFormValues>
    watch: UseFormWatch<ConvertibleEnquiryFormValues>
    setValue: UseFormSetValue<ConvertibleEnquiryFormValues>
    register: any
    errors: FieldErrors<ConvertibleEnquiryFormValues>
    index: number
    addNewItem: () => void
}
type TOrderFormItem = ConvertibleEnquiryFormValues['items']

type TOrderFormItemSingle = TOrderFormItem extends (infer U)[] ? U : TOrderFormItem;

export interface TFormItemSelectionOption {
    id: number;
    name: string;
    variation: string;
    stock_inventory_id: number;
    product_image?: string;

}


const EnquiryFormItemsSection: React.FC<EnquiryFormItemsSectionProps> = ({
    control,
    watch,
    setValue,
    register,
    errors,
    index,
    addNewItem

}) => {
    const { data: categories, isLoading: categoriesLoading } = useGetCategories();
    const { data: propertyOptions, isLoading: isLoadingPropertyOptions } = useGetPropertyOptions();
    const { data: products, isLoading: productsLoading, isFetching: productsFetching } = useGetProducts({
        category: watch(`items.${index}.category`)
    });

    const { remove: deleteItems } = useFieldArray({
        control,
        name: `items`
    });
    const { fields, append, remove } = useFieldArray({
        control,
        name: `items.${index}.inventories`
    });
    const selectedCategory = watch(`items.${index}.category`);
    const categoryName = categories?.find(cat => cat.id === Number(selectedCategory))?.name || '';
    const matchedCategory = categories?.find(cat => cat.id === Number(selectedCategory));
    const isStockInventory = matchedCategory?.name === 'Cake' || matchedCategory?.name === 'Flower' || matchedCategory?.name === 'Cupcake';
    const isProductInventory = matchedCategory?.name !== 'Cake' && matchedCategory?.name !== 'Flower' && matchedCategory?.name !== 'Cupcake' && matchedCategory?.name !== 'Combo';
    const isComboItem = matchedCategory?.name === 'Combo';

    React.useEffect(() => {
        setValue(`items.${index}.product_id`, 0);
        const prevItems = watch('items');
        setValue(`items.${index}`,
            {
                ...prevItems,
                category: selectedCategory,
                product_id: 0,
                product_variation_id: '',
                properties: {},
                quantity: 1,
                inventories: [{ variations: [] },]
            }
        );

    }, [index, selectedCategory, setValue]);

    // TOrderFormItemSingle
    const watchedItems = watch("items") || [] as TOrderFormItem[];
    const watchedItemAtIndex = watch(`items.${index}`)
    const watchedInventories = watch(`items.${index}.inventories`)

    const { data: productsInvetories, isLoading: productInventoriesLoading, isFetching: productInventoriesFetching, error: productsError, refetch: refetchProductsInventory } = useGetProductsInventory({
        page: 1,
        size: 20000000000000,
        category: Number(watchedItems[index]?.category),
        business: watch('branch'),
    });

    const { data: stockInvetories, isLoading: stockLoading, isFetching: stockFetching, error: stockError, refetch: refetchStockInventory } = useGetStockInventory({
        page: 1,
        size: 20000000000000,
        category: Number(watchedItems[index]?.category),
    });


    const handleProductVariationChange = (selectedItems: Array<TFormItemSelectionOption & { quantity: number }>) => {
        const newInventories = selectedItems.reduce((acc: any[], item) => {
            const existingInventory = acc.find(inv => inv.stock_inventory_id === item.stock_inventory_id);
            if (existingInventory) {
                existingInventory.variations.push({
                    stock_variation_id: item.id,
                    quantity: item.quantity
                });
            } else {
                acc.push({
                    stock_inventory_id: item.stock_inventory_id,
                    variations: [{
                        stock_variation_id: item.id,
                        quantity: item.quantity
                    }],
                    properties: {}
                });
            }
            return acc;
        }, []);
        if (newInventories.length == 0) {
            newInventories.push({
                variations: [],
                properties: {}
            });
        }
        setValue(`items.${index}.inventories`, newInventories);
    };

    const productVariations = stockInvetories?.data?.flatMap(product =>
        product.variations.map(variation => ({
            id: variation.id,
            stock_inventory_id: product.id,
            product_image: product.image_one,
            name: product.name,
            variation: variation.size ||  variation.flavour,
            category: product.category.name,
        }))
    ) || [];


    const calcucateStockItemAmount = React.useCallback((items: TOrderFormItem, inventories: TStockInventoryItem[]) => {
        const item = items?.[0];
        if (!item) return 0
        const miscellaneous = item.miscellaneous || [];
        const miscCost = miscellaneous.reduce((acc, misc) => acc + misc.cost, 0);

        if (!item.category || !item.inventories) {
            return 0;
        } else {
            const inventoriesIds = item.inventories.map(inv => inv?.stock_inventory_id);
            const allInventoriesSelected = inventoriesIds.every(inv => inv !== undefined);
            if (!allInventoriesSelected) {
                return 0;
            } else {
                const itemInventories = inventories.filter(inv => inventoriesIds.includes(inv.id));

                const selectedVariations = items?.map(item => item.inventories.map(inv => inv?.variations?.map(variation => {
                    const selected = itemInventories.flatMap(inv =>
                        inv.variations.find(varr => variation.stock_variation_id == varr.id)
                    );
                    return { id: variation.stock_variation_id, quantity: variation.quantity, cost_price: selected?.[0]?.selling_price || 0 };
                }))).flat(2);

                console.log("selectedVariations", selectedVariations);
                console.log("form items", item);

                const totalVariationCost = selectedVariations.reduce((acc, variation) => {
                    return acc + (Number(variation?.cost_price || '0') * (variation?.quantity || 1));
                }, 0);

                return (totalVariationCost * item.quantity) + miscCost;
            }
        }
    }, [watchedItemAtIndex]);


    const calculateProductItemAmount = React.useCallback((items: TOrderFormItem, inventories: TProductInventoryItem[]) => {
        const item = items?.[0];
        if (!item) return 0;
        const miscellaneous = item.miscellaneous || [];
        const miscCost = miscellaneous.reduce((acc, misc) => acc + misc.cost, 0);
        const allProperties = [
            item?.properties?.bouquet,
            item?.properties?.layers,
            item?.properties?.glass_vase,
            item?.properties?.toppings,
            item?.properties?.whipped_cream_upgrade,
        ]
        console.log(allProperties, "PROPS")
        const propertiesCost = allProperties.reduce((acc, item) => {
            const findItemPrice = parseInt(propertyOptions?.data.find(prop => prop.id.toString() == item)?.selling_price.toString() || '0')
            console.log(findItemPrice, "PRICES")
            return acc + findItemPrice
        }, 0)

        return miscCost + propertiesCost
    }, [watchedItemAtIndex])







    return (
        <>
            {
                !!watchedItemAtIndex &&
                <div className="rounded-md mb-10">
                    <div className="flex items-center gap-2 mb-4 ">

                        <div
                            className='flex items-center justify-center px-4 py-1.5 bg-yellow-500 max-w-max'
                        >
                            Item {index + 1}
                        </div>
                        <button
                            onClick={() => deleteItems(index)}
                            className={cn('flex items-center justify-center px-3 py-1.5 bg-red-500 text-white max-w-max', index == 0 && "hidden")}
                        >
                            <TrashIcon size={20} />
                            <span className="sr-only">
                                Remove
                            </span>
                        </button>
                    </div>

                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
                        <Controller
                            name={`items.${index}.category`}
                            control={control}
                            render={({ field }) => (
                                <SelectSingleCombo
                                    {...field}
                                    value={field.value ? field.value.toString() : ''}
                                    label="Category"
                                    options={categories?.map(cat => ({ label: cat.name, value: cat.id.toString() })) || []}
                                    valueKey='value'
                                    labelKey="label"
                                    placeholder='Category'
                                    onChange={(value) => field.onChange(parseInt(value))}
                                    isLoadingOptions={categoriesLoading}
                                    hasError={!!errors.items?.[index]?.category}
                                    errorMessage={errors.items?.[index]?.category?.message}
                                />
                            )}
                        />
                        <Controller
                            name={`items.${index}.product_id`}
                            control={control}
                            render={({ field }) => (
                                <SelectSingleCombo
                                    {...field}
                                    value={field.value ? field.value.toString() : ''}
                                    options={products?.map(prod => ({ label: prod.name, value: prod.id.toString() })) || []}
                                    valueKey='value'
                                    labelKey="label"
                                    label="Product Name"
                                    disabled={!selectedCategory || (!productsLoading && !products?.length)}
                                    placeholder={
                                        (!productsLoading && !products?.length) ?
                                            'No products found' :
                                            selectedCategory ?
                                                'Select product' :
                                                'Select category first'
                                    }
                                    onChange={(value) => field.onChange(parseInt(value))}
                                    isLoadingOptions={productsLoading}
                                    hasError={!!errors.items?.[index]?.product_id}
                                    errorMessage={errors.items?.[index]?.product_id?.message}
                                />
                            )}
                        />
                        <div>
                            <label htmlFor="">Quantity</label>
                            <div className="flex items-center justify-start gap-2 h-14">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newQuantity = (watch('items')?.[index]?.quantity ?? 0) - 1;
                                        if (newQuantity >= 1) {
                                            setValue(`items.${index}.quantity`, newQuantity);
                                        }
                                    }}
                                    className="flex items-center justify-center border border-[#0F172B] text-lg text-center p-2 leading-3"
                                >
                                    -
                                </button>
                                <span className="w-9 text-center">
                                    {watch('items')?.[index].quantity}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newQuantity = (watch('items')?.[index]?.quantity ?? 0) + 1;
                                        setValue(`items.${index}.quantity`, newQuantity);
                                    }}
                                    className="flex items-center justify-center border border-[#0F172B] text-lg text-center p-2 leading-3"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                        {
                            selectedCategory &&
                            <>
                                {
                                    isStockInventory &&
                                    <>
                                        < StockItemFormEnquiry
                                            options={productVariations}
                                            onChange={handleProductVariationChange}
                                            label="Stock"
                                            disabled={!selectedCategory || (!productsLoading && productsFetching && !products?.length)}
                                            placeholder={
                                                (!productsLoading && !products?.length) ?
                                                    'No products found' :
                                                    selectedCategory ?
                                                        'Select stock   ' :
                                                        'Select category first'
                                            }
                                            isLoadingOptions={productsLoading}
                                            hasError={!!errors.items?.[index]?.inventories}
                                            errorMessage={errors.items?.[index]?.inventories?.message}
                                        />



                                        {
                                            categoryName === 'Cake' && (
                                                <>
                                                    <Controller
                                                        name={`items.${index}.properties.layers`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <SelectSingleCombo
                                                                options={propertyOptions?.data.filter(option => option.type === 'LAYER').map(option => ({ label: option.name, value: option.id })) || []}
                                                                isLoadingOptions={isLoadingPropertyOptions}
                                                                label="Layers"
                                                                valueKey="value"
                                                                labelKey="label"
                                                                placeholder="Select layers"
                                                                {...field}
                                                                hasError={!!errors.items?.[index]?.properties?.layers}
                                                                errorMessage={errors.items?.[index]?.properties?.layers?.message as string}

                                                            />
                                                        )}
                                                    />

                                                    <Controller
                                                        name={`items.${index}.properties.toppings`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <SelectSingleCombo
                                                                options={propertyOptions?.data.filter(option => option.type === 'TOPPING').map(option => ({ label: option.name, value: option.id })) || []}
                                                                isLoadingOptions={isLoadingPropertyOptions}
                                                                label="Topping"
                                                                valueKey="value"
                                                                labelKey="label"
                                                                placeholder="Select Topping"
                                                                {...field}
                                                                hasError={!!errors.items?.[index]?.properties?.toppings}
                                                                errorMessage={errors.items?.[index]?.properties?.toppings?.message as string}

                                                            />
                                                        )}
                                                    />

                                                    <Controller
                                                        name={`items.${index}.properties.whipped_cream_upgrade`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <Label htmlFor="Whipped Cream Upgrade" className='flex flex-col gap-4'>
                                                                <span className='text-sm text-[#0F172B] font-poppins font-medium'>
                                                                    Whipped Cream Upgrade
                                                                </span>
                                                                <Checkbox
                                                                    id="Whipped Cream Upgrade"
                                                                    value={field.value ? 'true' : 'false'}
                                                                    className='h-7 w-7'
                                                                    iconClass="h-5 w-5"
                                                                    onCheckedChange={(value) => field.onChange(value)}
                                                                />
                                                            </Label>
                                                        )}
                                                    />
                                                </>

                                            )
                                        }
                                        {
                                            categoryName === 'Flower' && (
                                                <>

                                                    <Controller
                                                        name={`items.${index}.properties.bouquet`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <SelectSingleCombo
                                                                options={
                                                                    PRODUCT_TYPES_OPTIONS.Flowers.bouquets
                                                                }
                                                                label="Size"
                                                                valueKey="value"
                                                                labelKey="name"
                                                                placeholder="Select bouquet"
                                                                {...field}
                                                                hasError={!!errors.items?.[index]?.properties?.bouquet}
                                                                errorMessage={errors.items?.[index]?.properties?.bouquet?.message as string}

                                                            />
                                                        )}
                                                    />

                                                </>

                                            )
                                        }


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
                                                            hasError={!!errors.items?.[index]?.inventories?.[0]?.instruction}
                                                            errorMessage={errors.items?.[index]?.inventories?.[0]?.instruction?.message}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        {
                                            (categoryName === 'Cake' || categoryName === 'Cupcake') &&
                                            <FormField
                                                control={control}
                                                name={`items.${index}.inventories.${0}.message`}
                                                render={({ field }) => (
                                                    <FormItem className='col-span-full'>
                                                        <FormControl>
                                                            <Input
                                                                label="Message on Cake"
                                                                placeholder='Enter message'
                                                                {...field}
                                                                hasError={!!errors.items?.[index]?.inventories?.[0]?.message}
                                                                errorMessage={errors.items?.[index]?.inventories?.[0]?.message as string}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        }


                                    </>

                                }


                                {/* /////////////////////////////////////////////////////////////////////////////////// */}
                                {/* /////////////////////////////////////////////////////////////////////////////////// */}
                                {/* /////////////                    PRODUCT INVENTORY                 //////////////// */}
                                {/* /////////////////////////////////////////////////////////////////////////////////// */}
                                {/* /////////////////////////////////////////////////////////////////////////////////// */}
                                {
                                    !isStockInventory && !isComboItem && fields.map((_, invIndex) => (
                                        <>
                                            {
                                                watchedInventories.map((_, invIndex) =>

                                                    <>
                                                        <EnquiryFormProductInventorySelector
                                                            inventoryId={watch(`items.${index}.inventories.${invIndex}.product_inventory_id`)}
                                                            setInventoryId={(inventoryId) => {
                                                                setValue(`items.${index}.inventories.${invIndex}.product_inventory_id`, inventoryId);
                                                            }}
                                                            options={productsInvetories?.data!}
                                                            disabled={productInventoriesLoading || (!productInventoriesLoading && !productsInvetories?.data.length)}
                                                            isLoadingOptions={productInventoriesLoading}
                                                            isFetchingOptions={productInventoriesFetching}
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

                                                    </>
                                                )
                                            }
                                        </>

                                    ))
                                }
                            </>
                        }



                    </div>


                    <EnquiryFormMiscellaneousComplete
                        index={index}
                        control={control}
                        register={register}
                        errors={errors}
                    />

                    <footer className="flex items-center justify-between border-t pt-2 mt-4">
                        <p className='flex items-center gap-1.5 font-semibold text-2xl text-custom-blue'>

                            <span>Amount: </span>
                            <span>
                                {
                                    formatCurrency(
                                        isStockInventory ?
                                            calcucateStockItemAmount([watch(`items.${index}`)], stockInvetories?.data!)
                                            :
                                            isProductInventory ?
                                                calculateProductItemAmount([watch(`items.${index}`)], productsInvetories?.data!)
                                                :
                                                0, "NGN")
                                }
                            </span>
                        </p>

                        {

                        }
                        <Button
                            // variant="outline"
                            onClick={addNewItem}
                            type="button"
                        >
                            + Add Item
                        </Button>
                    </footer>
                </div>
            }
        </>
    );
};

export default EnquiryFormItemsSection;

