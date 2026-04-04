import React, { useEffect, useState } from "react";
import {
  Controller,
  useFieldArray,
  UseFormWatch,
  Control,
  UseFormSetValue,
  FieldErrors,
} from "react-hook-form";
import { TrashIcon, XIcon } from "lucide-react";

import {
  useGetCategories,
  useGetProducts,
  useGetProductsInventory,
  useGetStockInventory,
} from "@/app/(dashboard)/inventory/misc/api";
import {
  Checkbox,
  FormControl,
  FormField,
  FormItem,
  Input,
  SelectSingleCombo,
  Button,
} from "@/components/ui";

import { NewOrderFormValues } from "../utils/schema";
import OrderFormMiscellaneous from "./OrderFormMiscellaneous";
import OrderFormProductInventorySelector from "./OrderFormProductInventorySelector";
import { TProductInventoryItem } from "@/app/(dashboard)/inventory/misc/types/products";
import { TStockInventoryItem } from "@/app/(dashboard)/inventory/misc/types/stock";
import { formatCurrency } from "@/utils/currency";
import { cn } from "@/lib/utils";
import { useGetPropertyOptions } from "../api";
import CustomImagePicker from "@/app/(dashboard)/inventory/misc/components/CustomImagePicker";
import SelectMultiCombo from "@/components/ui/selectMultipleSpecialCombo";
import ProductSelector from "./OrderFormProductSelector";
import OrderFormStockInventorySelector, {
  orderItemType,
} from "./OrderFormStockInventorySelector";

interface OrderItemsSectionProps {
  control: Control<NewOrderFormValues>;
  watch: UseFormWatch<NewOrderFormValues>;
  setValue: UseFormSetValue<NewOrderFormValues>;
  register: any;
  errors: FieldErrors<NewOrderFormValues>;
  index: number;
  addNewItem: () => void;
}
type TOrderFormItem = NewOrderFormValues["items"];

export interface TFormItemSelectionOption {
  id: number;
  name: string;
  variation: string;
  stock_inventory_id: number;
  product_image?: string;
}

const OrderItemsSection: React.FC<OrderItemsSectionProps> = ({
  control,
  watch,
  setValue,
  register,
  errors,
  index,
  addNewItem,
}) => {
  const { data: categories, isLoading: categoriesLoading } = useGetCategories();
  const {
    data: products,
    isLoading: productsLoading,
    isFetching: productsFetching,
  } = useGetProducts({
    category: watch(`items.${index}.category`),
    business: watch(`business`),
  });

  const { data: propertyOptions, isLoading: isLoadingPropertyOptions } =
    useGetPropertyOptions();

  const { remove: deleteItems } = useFieldArray({
    control,
    name: `items`,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: `items.${index}.inventories`,
  });

  const selectedCategory = watch(`items.${index}.category`);
  const categoryName =
    categories?.find((cat) => cat.id === Number(selectedCategory))?.name || "";
  const matchedCategory = categories?.find(
    (cat) => cat.id === Number(selectedCategory),
  );
  const isStockInventory =
    matchedCategory?.name === "Cake" ||
    matchedCategory?.name === "Flower" ||
    matchedCategory?.name === "Cupcake";
  const isProductInventory =
    matchedCategory?.name !== "Cake" &&
    matchedCategory?.name !== "Flower" &&
    matchedCategory?.name !== "Cupcake" &&
    matchedCategory?.name !== "Combo";
  const isComboItem = matchedCategory?.name === "Combo";

  const watchedItems = watch("items");
  const watchedItemAtIndex = watch(`items.${index}`);
  const isCustomOrder = watch(`items.${index}.is_custom_order`);
  const watchedInventories = watch(`items.${index}.inventories`);

  const {
    data: productsInvetories,
    isLoading: productInventoriesLoading,
    isFetching: productInventoriesFetching,
    error: productsError,
    refetch: refetchProductsInventory,
  } = useGetProductsInventory({
    page: 1,
    size: 20000000000000,
    category: Number(watchedItems[index]?.category),
    business: watch("business"),
  });

  const {
    data: stockInvetories,
    isLoading: stockInventoriesLoading,
    isFetching: stockInventoriesFetching,
    error: stockError,
    refetch: refetchStockInventory,
  } = useGetStockInventory({
    page: 1,
    size: 20000000000000,
    category: Number(watchedItems[index]?.category),
  });

  const calcucateItemAmount = React.useCallback(
    (items: TOrderFormItem) => {
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
      ];
      const propertiesCost = allProperties.reduce((acc, item) => {
        const findItemPrice = parseInt(
          propertyOptions?.data.find((prop) => prop.id.toString() == item)
            ?.selling_price || "0",
        );
        return acc + findItemPrice;
      }, 0);

      const selectedProduct = products?.find(
        (product) => product.id === item.product_id,
      );
      if (!item.category || !selectedProduct) {
        return (0 + propertiesCost) * item.quantity + miscCost;
      } else {
        const initialCostPrice =
          Number(
            selectedProduct?.variations?.find(
              (variation) =>
                variation.id.toString() === item.product_variation_id,
            )?.selling_price,
          ) || 0;
        return (initialCostPrice + propertiesCost) * item.quantity + miscCost;
      }
    },
    [propertyOptions?.data, products],
  );

  // ✅ helper: reset inventories + properties (same as Enquiry fix)
  const resetInventoriesAndProperties = React.useCallback(() => {
    setValue(
      `items.${index}.inventories`,
      [
        {
          message: "",
          instruction: "",
          quantity_used: 0,
          variations: [],
        },
      ],
      { shouldDirty: true, shouldTouch: true },
    );

    setValue(
      `items.${index}.properties`,
      {
        layers: "",
        toppings: "",
        bouquet: "",
        glass_vase: "",
        whipped_cream_upgrade: "",
      },
      { shouldDirty: true, shouldTouch: true },
    );
  }, [index, setValue]);

  // ✅ initial default setup (keep your logic, but uses helper)
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  React.useEffect(() => {
    const currentInventories = watch(`items.${index}.inventories`);

    if (
      !currentInventories ||
      currentInventories.length === 0 ||
      (currentInventories.length === 1 &&
        currentInventories?.[0]?.variations?.length === 0 &&
        isInitialLoad)
    ) {
      resetInventoriesAndProperties();
    }

    setIsInitialLoad(false);
  }, [
    selectedCategory,
    index,
    setValue,
    watch,
    isInitialLoad,
    resetInventoriesAndProperties,
  ]);

  // ✅ main fix: when category changes, clear previous selected inventories + product fields
  const prevCategoryRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const currentCategory = selectedCategory ? Number(selectedCategory) : null;

    // first run: just store
    if (prevCategoryRef.current === null) {
      prevCategoryRef.current = currentCategory;
      return;
    }

    // actual category change
    if (prevCategoryRef.current !== currentCategory) {
      // clear inventories & properties (prevents "old stock won't delete")
      resetInventoriesAndProperties();

      // also reset product selections to avoid mismatch
      setValue(`items.${index}.product_id`, undefined as any, {
        shouldDirty: true,
        shouldTouch: true,
      });
      setValue(`items.${index}.product_variation_id`, "" as any, {
        shouldDirty: true,
        shouldTouch: true,
      });

      prevCategoryRef.current = currentCategory;
    }
  }, [selectedCategory, index, setValue, resetInventoriesAndProperties]);

  return (
    <>
      {!!watchedItemAtIndex && (
        <div className="rounded-md mb-10">
          <div className="flex items-center gap-2 mb-4 ">
            <div className="flex items-center justify-center px-4 py-1.5 bg-yellow-500 max-w-max">
              Item {index + 1}
            </div>
            <button
              type="button"
              onClick={() => {
                setValue(`items.${index}.is_custom_order`, !isCustomOrder);
              }}
              className={cn(
                "flex items-center justify-center px-3 py-1.5 bg-[#FFC600] text-[#111827] hover:opacity-90 max-w-max",
              )}
            >
              {watchedItemAtIndex?.is_custom_order
                ? "+ Regular Order"
                : "+ Custom Order"}
            </button>
            <button
              onClick={() => deleteItems(index)}
              className={cn(
                "flex items-center justify-center px-3 py-1.5 bg-red-500 text-white max-w-max",
              )}
            >
              <TrashIcon size={20} />
              <span className="sr-only">Remove</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-8 mb-8">
            <div className="flex gap-8">
              <div className="w-[30%]">
                <Controller
                  name={`items.${index}.category`}
                  control={control}
                  render={({ field }) => (
                    <SelectSingleCombo
                      {...field}
                      value={field.value ? field.value.toString() : ""}
                      label="Category"
                      options={
                        categories?.map((cat) => ({
                          label: cat.name,
                          value: cat.id.toString(),
                        })) || []
                      }
                      valueKey="value"
                      labelKey="label"
                      onChange={(value) => field.onChange(parseInt(value))}
                      isLoadingOptions={categoriesLoading}
                      hasError={!!errors.items?.[index]?.category}
                      errorMessage={errors.items?.[index]?.category?.message}
                      placeholder={
                        !watch("business")
                          ? "Select business first"
                          : "Select category"
                      }
                      disabled={!watch("business")}
                    />
                  )}
                />
              </div>

              <div className="w-[70%]">
                <Controller
                  name={`items.${index}.product_id`}
                  control={control}
                  render={({ field }) => (
                    <ProductSelector
                      {...field}
                      category={categoryName}
                      branch={watch("business")}
                      productId={field.value?.toString() || ""}
                      variationId={
                        watch(`items.${index}.product_variation_id`) || ""
                      }
                      setProductId={(value) => {
                        setValue(`items.${index}.product_id`, Number(value), {
                          shouldDirty: true,
                          shouldTouch: true,
                        });
                      }}
                      setVariationId={(value) =>
                        setValue(`items.${index}.product_variation_id`, value, {
                          shouldDirty: true,
                          shouldTouch: true,
                        })
                      }
                      options={products || []}
                      label="Product"
                      disabled={
                        !selectedCategory ||
                        (!productsLoading && !products?.length)
                      }
                      placeholder={
                        !productsLoading && !products?.length
                          ? "No products found"
                          : selectedCategory
                            ? "Select product"
                            : "Select category first"
                      }
                      isLoadingOptions={productsLoading}
                      hasError={!!errors.items?.[index]?.product_id}
                      errorMessage={errors.items?.[index]?.product_id?.message}
                    />
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {isStockInventory ? (
                <OrderFormStockInventorySelector
                  inventories={watch(`items.${index}.inventories`)}
                  setInventories={(inventories) =>
                    setValue(
                      `items.${index}.inventories`,
                      inventories as orderItemType["inventories"],
                      { shouldDirty: true, shouldTouch: true },
                    )
                  }
                  options={stockInvetories?.data!}
                  disabled={
                    !watch("business") ||
                    !watch(`items.${index}.category`) ||
                    stockInventoriesLoading ||
                    (!stockInventoriesLoading && !stockInvetories?.data.length)
                  }
                  isLoadingOptions={stockInventoriesLoading}
                  isFetchingOptions={stockInventoriesFetching}
                  hasError={
                    !!errors.items?.[index]?.inventories?.[0]?.variations
                  }
                  errorMessage={
                    errors.items?.[index]?.inventories?.[0]?.variations?.message
                  }
                />
              ) : isProductInventory ? (
                <OrderFormProductInventorySelector
                  inventories={watch(`items.${index}.inventories`)}
                  setInventories={(inventories) =>
                    setValue(
                      `items.${index}.inventories`,
                      inventories as orderItemType["inventories"],
                      { shouldDirty: true, shouldTouch: true },
                    )
                  }
                  options={productsInvetories?.data!}
                  disabled={
                    !watch("business") ||
                    !watch(`items.${index}.category`) ||
                    productInventoriesLoading ||
                    (!productInventoriesLoading &&
                      !productsInvetories?.data.length)
                  }
                  isLoadingOptions={productInventoriesLoading}
                  isFetchingOptions={productInventoriesFetching}
                  errorMessage={errors.items?.[index]?.inventories?.message}
                  hasError={!!errors.items?.[index]?.inventories}
                />
              ) : null}

              {selectedCategory && (
                <>
                  {/* STOCK INVENTORY */}
                  {isStockInventory && (
                    <>
                      {(categoryName === "Cake" ||
                        categoryName === "Cupcake") && (
                        <>
                          <Controller
                            name={`items.${index}.properties.toppings`}
                            control={control}
                            render={({ field }) => (
                              <SelectSingleCombo
                                options={
                                  propertyOptions?.data
                                    .filter(
                                      (option) => option.type === "TOPPING",
                                    )
                                    .map((option) => ({
                                      label: option.name,
                                      value: option.id,
                                      selling_price: option.selling_price,
                                    })) || []
                                }
                                labelKey={(item) =>
                                  `${item.label} (${formatCurrency(item.selling_price, "NGN")})`
                                }
                                isLoadingOptions={isLoadingPropertyOptions}
                                label="Topping"
                                valueKey="value"
                                placeholder="Select Topping"
                                {...field}
                                allowDisselect
                                hasError={
                                  !!errors.items?.[index]?.properties?.toppings
                                }
                                errorMessage={
                                  errors.items?.[index]?.properties?.toppings
                                    ?.message as string
                                }
                              />
                            )}
                          />
                          <Controller
                            name={`items.${index}.properties.whipped_cream_upgrade`}
                            control={control}
                            render={({ field }) => (
                              <SelectSingleCombo
                                options={
                                  propertyOptions?.data
                                    .filter(
                                      (option) =>
                                        option.type === "WHIPPED_CREAM",
                                    )
                                    .map((option) => ({
                                      label: option.name,
                                      value: option.id,
                                      selling_price: option.selling_price,
                                    })) || []
                                }
                                labelKey={(item) =>
                                  `${item.label} (${formatCurrency(item.selling_price, "NGN")})`
                                }
                                isLoadingOptions={isLoadingPropertyOptions}
                                label="Whipped Cream Upgrade"
                                valueKey="value"
                                placeholder="Select Whipped Cream"
                                {...field}
                                allowDisselect
                                hasError={
                                  !!errors.items?.[index]?.properties
                                    ?.whipped_cream_upgrade
                                }
                                errorMessage={
                                  errors.items?.[index]?.properties
                                    ?.whipped_cream_upgrade?.message as string
                                }
                              />
                            )}
                          />
                        </>
                      )}

                      {categoryName === "Flower" && (
                        <>
                          <Controller
                            name={`items.${index}.properties.glass_vase`}
                            control={control}
                            render={({ field }) => (
                              <SelectSingleCombo
                                options={
                                  propertyOptions?.data
                                    .filter(
                                      (option) => option.type === "GLASS_VASE",
                                    )
                                    .map((option) => ({
                                      label: option.name,
                                      value: option.id,
                                      selling_price: option.selling_price,
                                    })) || []
                                }
                                labelKey={(item) =>
                                  `${item.label} (${formatCurrency(item.selling_price, "NGN")})`
                                }
                                isLoadingOptions={isLoadingPropertyOptions}
                                label="Vase"
                                valueKey="value"
                                placeholder="Select vase"
                                {...field}
                                hasError={
                                  !!errors.items?.[index]?.properties
                                    ?.glass_vase
                                }
                                errorMessage={
                                  errors.items?.[index]?.properties?.glass_vase
                                    ?.message as string
                                }
                              />
                            )}
                          />
                        </>
                      )}

                      {(categoryName === "Cake" ||
                        categoryName === "Cupcake") && (
                        <>
                          <FormField
                            control={control}
                            name={`items.${index}.inventories.${0}.instruction`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    label="Instruction"
                                    placeholder="Enter instruction"
                                    {...field}
                                    hasError={
                                      !!errors.items?.[index]?.inventories?.[0]
                                        ?.instruction
                                    }
                                    errorMessage={
                                      errors.items?.[index]?.inventories?.[0]
                                        ?.instruction?.message
                                    }
                                    optional
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={control}
                            name={`items.${index}.inventories.${0}.message`}
                            render={({ field }) => (
                              <FormItem className="col-span-full">
                                <FormControl>
                                  <Input
                                    label="Message on Cake"
                                    placeholder="Enter message"
                                    {...field}
                                    hasError={
                                      !!errors.items?.[index]?.inventories?.[0]
                                        ?.message
                                    }
                                    errorMessage={
                                      errors.items?.[index]?.inventories?.[0]
                                        ?.message as string
                                    }
                                    optional
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                    </>
                  )}

                  {/* PRODUCT INVENTORY */}
                  {categoryName !== "Cake" && categoryName !== "Cupcake" && (
                    <FormField
                      control={control}
                      name={`items.${index}.inventories.${0}.instruction`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              label="Instruction"
                              placeholder="Enter instruction"
                              {...field}
                              hasError={!!errors.items?.[index]?.inventories}
                              errorMessage={
                                errors.items?.[index]?.inventories?.message
                              }
                              optional
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}

              {isCustomOrder && (
                <CustomImagePicker
                  control={control}
                  name={`items.${index}.custom_image`}
                  errors={errors}
                  hasError={!!errors.items?.[index]?.custom_image}
                  errorMessage={
                    errors.items?.[index]?.custom_image?.message as string
                  }
                />
              )}

              <div>
                <label htmlFor="">Quantity</label>
                <div className="flex items-center justify-start gap-2 h-14">
                  <button
                    type="button"
                    onClick={() => {
                      const newQuantity = watch("items")?.[index].quantity - 1;
                      if (newQuantity >= 1) {
                        setValue(`items.${index}.quantity`, newQuantity, {
                          shouldDirty: true,
                          shouldTouch: true,
                        });
                      }
                    }}
                    className="flex items-center justify-center border border-[#0F172B] text-lg text-center p-2 leading-3"
                  >
                    -
                  </button>
                  <span className="w-9 text-center">
                    {watch("items")?.[index].quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const newQuantity = watch("items")?.[index].quantity + 1;
                      setValue(`items.${index}.quantity`, newQuantity, {
                        shouldDirty: true,
                        shouldTouch: true,
                      });
                    }}
                    className="flex items-center justify-center border border-[#0F172B] text-lg text-center p-2 leading-3"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          <OrderFormMiscellaneous
            index={index}
            control={control}
            register={register}
            errors={errors}
          />

          <footer className="flex items-center justify-between border-t pt-2 mt-4">
            <p className="flex items-center gap-1.5 font-semibold text-2xl text-custom-blue">
              <span>Amount: </span>
              <span>
                {formatCurrency(
                  calcucateItemAmount([watch(`items.${index}`)]),
                  "NGN",
                )}
              </span>
            </p>

            <Button onClick={addNewItem} type="button">
              + Add Item
            </Button>
          </footer>
        </div>
      )}
    </>
  );
};

export default OrderItemsSection;
