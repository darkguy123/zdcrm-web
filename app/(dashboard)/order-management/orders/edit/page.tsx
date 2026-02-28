"use client";
import React from "react";
import Image from "next/image";
import {
  Controller,
  FieldErrors,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { Money, TruckTime, ShoppingBag } from "iconsax-react";
import { Plus, UserIcon } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";


import useCloudinary from '@/hooks/useCloudinary';
import {
  Accordion,
  AccordionContent,
  AccordionTrigger,
  AccordionItem,
  Input,
  SingleDatePicker,
  SelectSingleCombo,
  SelectBranchCombo,
  Button,
  FilePicker,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Form,
  TimePicker,
  SelectMultipleSpecialCombo,
  Spinner,
  ConfirmActionModal,
  AmountInput,
} from "@/components/ui";
import {
  DISPATCH_METHOD_OPTIONS,
  ENQUIRY_CHANNEL_OPTIONS,
  ENQUIRY_OCCASION_OPTIONS,
  ENQUIRY_PAYMENT_OPTIONS,
  ZONES_OPTIONS,
} from "@/constants";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetCategories, useGetProducts } from "@/app/(dashboard)/inventory/misc/api";
import FormError from "@/components/ui/formError";
import { formatCurrency } from "@/utils/currency";
import { useBooleanStateControl } from "@/hooks";
import { extractErrorMessage } from "@/utils/errors";
import { useLoading } from "@/contexts";
import SelectSingleSimple from "@/components/ui/selectSingleSimple";

import { NewOrderFormValues, NewOrderSchema } from "../../misc/utils/schema";
import OrderFormItemsSection from "../../misc/components/OrderFormItemsSection";
import { useCreateOrder, useGeTOrderDeliveryLocations, useGeTOrderDetail } from "../../misc/api";
import { useGetAllBranches } from "@/app/(dashboard)/admin/businesses/misc/api";
import { TOrder } from "../../misc/types";
import { useGetAllBusiness } from "@/mutations/business.mutation";



const NewOrderPage = () => {

  const order_id = useSearchParams().get('order_id');

  const { data: orderData, isLoading: isLoadingOrderData } = useGeTOrderDetail(order_id ?? '')
  const { data: branches, isLoading: branchesLoading } = useGetAllBranches();
  const { data: businesses, isLoading: businessesLoading } = useGetAllBusiness();
  const { data: categories, isLoading: categoriesLoading } = useGetCategories();
  const { data: products, isLoading: productsLoading } = useGetProducts();
  const { data: dispatchLocations, isLoading: dispatchLocationsLoading } = useGeTOrderDeliveryLocations();

  const form = useForm<NewOrderFormValues>({
    resolver: zodResolver(NewOrderSchema),
    defaultValues: {
      business: branches?.data?.[0].id,
      customer: { name: "", phone: "", email: "" },
      delivery: {
        zone: "LM",
        method: "Dispatch",
        delivery_date: format(new Date(), 'yyyy-MM-dd'),
        address: "",
        recipient_name: "",
        recipient_phone: ""
      },
      enquiry_channel: "",
      enquiry_occasion: "",
      items: [
        {
          category: categories?.[0].id,
          product_id: products?.[0].id,
          quantity: 1,
          properties: {},
          inventories: [{
            variations: [],
          }],
        }
      ],
      payment_status: "UP",
      payment_options: "not_paid_go_ahead",
      payment_currency: "NGN",
    }
  });

  const { control, handleSubmit, formState: { errors }, watch, setValue, getValues, register, reset } = form;

  React.useEffect(() => {
    if (!isLoadingOrderData && !!orderData) {
      reset({
        customer: {
          name: orderData.customer.name,
          phone: orderData.customer.phone,
          email: orderData.customer.email ?? undefined
        },
        enquiry_channel: orderData.enquiry_channel,
        enquiry_occasion: orderData.enquiry_occasion,
        // social_media_details: orderData.social_media_details,
        business: orderData?.branch?.id,
        delivery: {
          zone: (orderData.delivery?.zone as "LM" | "LC" | "LI" | "OT" | "ND") ?? "LM",
          method: orderData.delivery?.method as "Dispatch" | "Pickup",
          dispatch: orderData.delivery?.dispatch?.id?.toString() ?? "",
          address: orderData.delivery?.address ?? "",
          recipient_name: orderData.delivery?.recipient_name ?? "",
          recipient_phone: orderData.delivery?.recipient_phone ?? "",
          recipient_alternative_phone: orderData.delivery?.recipient_alternative_phone ?? "",
          residence_type: orderData.delivery?.residence_type ?? "",
          delivery_date: orderData.delivery?.delivery_date ?? format(new Date(), 'yyyy-MM-dd'),
          delivery_time: orderData.delivery?.delivery_time ?? "15:00",
          note: orderData.delivery?.note ?? "",
          fee: orderData.delivery?.fee ? parseInt(orderData.delivery?.fee) : undefined,
          is_custom_delivery: orderData.delivery?.is_custom_delivery ?? false,
        },
        message: orderData.message ?? "",
        items: orderData.items?.map(item => ({
          category: item.product?.category.id,
          product_id: item.product.id,
          quantity: item.quantity,
          properties: item.properties.reduce((acc, prop) => ({
            ...acc,
            ...(prop.toppings && { toppings: prop.toppings?.id?.toString() }),
            ...(prop.glass_vase && { glass_vase: prop.glass_vase?.id?.toString() }),
            // Add other properties here only if they exist on 'Property'
          }), {}),
          inventories: item.inventories.map(inventory => ({
            stock_inventory_id: inventory.stock_inventory?.id,
            product_inventory_id: inventory.product_inventory?.id,
            variations: inventory.variations?.map(variation => ({
              stock_variation_id: variation.id,
              quantity: variation.quantity,
            }))
          }))
        })) ?? [],
        payment_options: orderData.payment_options as
          | "not_paid_go_ahead"
          | "paid_website_card"
          | "paid_naira_transfer"
          | "paid_pos"
          | "paid_usd_transfer"
          | "paid_paypal"
          | "cash_paid"
          | "part_payment_cash"
          | "part_payment_transfer"
          | "paid_bitcoin"
          | "not_received_paid"
          | undefined,
        payment_currency: orderData.payment_currency as "NGN" | "USD",
        payment_proof: orderData.payment_proof,
        payment_receipt_name: orderData.payment_receipt_name || '',
        amount_paid_in_usd: orderData.amount_paid_in_usd?.toString() || undefined,
        initial_amount_paid: orderData.initial_amount_paid?.toString() || undefined,
      });
    }
  }, [orderData, isLoadingOrderData, reset]);
  console.log(errors)

  const addNewItem = () => {
    const prevItems = watch('items')
    setValue('items', [
      ...prevItems,
      {
        category: categories?.[0].id || 1,
        product_id: products?.[0].id || 0,
        product_variation_id: '',
        quantity: 1,
        properties: {},
        inventories: [{
          variations: [],
        }],
      }
    ])
  };

  const router = useRouter();
  const selectedPaymentOption = watch("payment_options");
  React.useEffect(() => {
    // "not_received_paid"
    if (selectedPaymentOption == "paid_usd_transfer" || selectedPaymentOption == "paid_naira_transfer" || selectedPaymentOption == "cash_paid" || selectedPaymentOption == "paid_website_card"
      || selectedPaymentOption == "paid_pos" || selectedPaymentOption == "paid_paypal" || selectedPaymentOption == "paid_bitcoin") {
      setValue('payment_status', 'FP')
    } else if (selectedPaymentOption == "part_payment_cash" || selectedPaymentOption == "part_payment_transfer") {
      setValue('payment_status', 'PP')
    } else {
      setValue('payment_status', 'UP')
    }
  }, [selectedPaymentOption, setValue])

  const { uploadToCloudinary } = useCloudinary()
  const { isUploading } = useLoading();
  const [createdOrder, setCreatedOrder] = React.useState<TOrder | null>(null);
  const {
    state: isSuccessModalOpen,
    setTrue: openSuccessModal,
    setFalse: closeSuccessModal,
  } = useBooleanStateControl()

  // const router = useRouter()
  const { mutate, isPending } = useCreateOrder()
  const onSubmit = async (data: NewOrderFormValues) => {
    let payment_proof: string | undefined
    const PdfFile = data.payment_proof
    if (data.payment_proof) {
      const data = await uploadToCloudinary(PdfFile)
      payment_proof = data.secure_url
    }

    const processedItems = await Promise.all(
      data.items.map(async (item) => {
        let custom_image: string | undefined
        if (item.custom_image) {
          const uploadResult = await uploadToCloudinary(item.custom_image)
          custom_image = uploadResult.secure_url
        }
        return {
          ...item,
          custom_image,
        }
      }),
    )
    const dataToSubmit = {
      ...data,
      items: processedItems,
      payment_proof: PdfFile ? payment_proof : undefined,
    }

    mutate(dataToSubmit, {
      onSuccess(data) {
        toast.success("Created successfully");
        router.push(`/order-management/orders/${data.data.id}/order-summary`)
        setCreatedOrder(data?.data);
      },
      onError(error: unknown) {
        const errMessage = extractErrorMessage((error as any)?.response?.data as any);
        toast.error(errMessage, { duration: 7500 });
      }
    })
  };
  const routeToOrderDetails = () => {
    router.push(`/order-management/orders/${createdOrder?.id}`);
  }

  const resetForm = () => {
    reset();
  }
  const isCustomDelivery = watch(`delivery.is_custom_delivery`);
  const toggleCustomDelivery = () => {
    setValue('delivery.is_custom_delivery', !isCustomDelivery);
  }
  const watchedClientPhoneNumber = watch('customer.phone')

  if (isLoadingOrderData || !orderData) {
    return <div className="w-full h-full flex items-center justify-center"><Spinner /></div>
  }

  return (
    <div className="px-8 md:pt-12 w-full md:w-[92.5%] max-w-[1792px] mx-auto">
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Accordion
            type="multiple"
            defaultValue={["client-information", "website-order", "order-information", "delivery-information", "order-Instruction", "payment-information",]}
            className="w-full"
          >


            {/* /////////////////////////////////////////////////////////////////////////////// */}
            {/* /////////////                CLIENT INFORMATION                 ///////////// */}
            {/* /////////////////////////////////////////////////////////////////////////////// */}
            <AccordionItem value="client-information">
              <AccordionTrigger className="py-4 flex">
                <div className="flex items-center gap-5 text-[#194A7A]">
                  <div className="flex items-center justify-center p-1.5 h-10 w-10 rounded-full bg-[#F2F2F2]">
                    <UserIcon className="text-custom-blue" stroke="#194a7a" fill="#194a7a" size={18} />
                  </div>
                  <h3 className="text-custom-blue font-medium">Client Information</h3>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-10 pt-8 pb-14 w-full">
                  <FormField
                    control={control}
                    name="customer.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            label="Client's Phone Number"
                            hasError={!!errors.customer?.phone}
                            errorMessage={errors.customer?.phone?.message}
                            placeholder="Enter client phone number"
                            {...field}
                          />
                        </FormControl>
                        {
                          watchedClientPhoneNumber?.length == 11 && <Link href="/order-management/client-history">View history</Link>
                        }
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="customer.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            label="Client's Name"
                            hasError={!!errors.customer?.name}
                            errorMessage={errors.customer?.name?.message}
                            placeholder="Enter client name"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="customer.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            label="Client's Email"
                            hasError={!!errors.customer?.email}
                            errorMessage={errors.customer?.email?.message}
                            placeholder="Enter client email"
                            {...field}
                            optional
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="enquiry_occasion"
                    render={({ field }) => (
                      <FormItem>
                        <SelectSingleCombo
                          options={ENQUIRY_OCCASION_OPTIONS}
                          valueKey="value"
                          label="Enquiry Occasion"
                          labelKey="label"
                          placeholder="Select enquiry occasion"
                          {...field}
                          hasError={!!errors.enquiry_occasion}
                          errorMessage={errors.enquiry_occasion?.message}
                          optional
                        />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="enquiry_channel"
                    render={({ field }) => (
                      <FormItem>
                        <SelectSingleCombo
                          options={ENQUIRY_CHANNEL_OPTIONS}
                          label="Enquiry Channel"
                          valueKey="value"
                          labelKey="label"
                          placeholder="Select enquiry channel"
                          hasError={!!errors.enquiry_channel}
                          errorMessage={errors.enquiry_channel?.message}
                          {...field}
                        />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="social_media_details"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            label="Social Media Details"
                            hasError={!!errors.social_media_details}
                            errorMessage={errors.social_media_details?.message}
                            placeholder="Enter social media details"
                            optional
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>



            {/* /////////////////////////////////////////////////////////////////////////////// */}
            {/* /////////////                WEBSITE INFORMATION                 ///////////// */}
            {/* /////////////////////////////////////////////////////////////////////////////// */}

            {
              orderData?.is_external_order &&

              <AccordionItem value="website-order">
                <AccordionTrigger className="py-4">
                  <div className="flex items-center gap-5">
                    <div className="h-10 w-10 flex items-center justify-center bg-custom-white rounded-full">
                      <Image src="/img/book.svg" alt="" width={24} height={24} />
                    </div>
                    <p className="text-custom-blue font-medium">Website Order Details</p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="flex flex-col pt-3 pb-14 gap-y-8">
                  {orderData?.metadata?.line_items?.length ? (
                    <div className="flex flex-col gap-6">
                      {orderData.metadata.line_items.map((item: any, index: number) => (
                        <div
                          key={item.id || index}
                          className="border rounded-lg p-6 flex flex-col gap-4"
                        >
                          {/* Product Name */}
                          <div className="flex justify-between gap-4">
                            <p className="font-semibold text-lg text-custom-blue">
                              {item.name}
                            </p>
                            <p className="text-sm font-medium whitespace-pre">
                              Quantity: {item.quantity}
                            </p>
                          </div>

                          {/* Meta Data (Options) */}
                          {item.meta_data?.length > 0 && (
                            <div className="flex flex-col gap-2 text-sm [&>div:not(:last-child)]:border-b">
                              {item.meta_data.map((meta: any, metaIndex: number) => (
                                <div
                                  key={meta.id || metaIndex}
                                  className="flex justify-between pb-1 border-gray-200"
                                >
                                  <span className="text-gray-600 capitalize">
                                    {meta.key?.replaceAll("_", " ")}
                                  </span>
                                  <span className="font-medium text-right">
                                    {typeof meta.value === "object"
                                      ? JSON.stringify(meta.value)
                                      : meta.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Total */}
                          <div className="flex justify-between pt-2 font-semibold">
                            <span>Total</span>
                            <span>
                              {formatCurrency(
                                Number(item.total),
                                orderData.payment_currency as 'NGN' | 'USD'
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No website order data found.</p>
                  )}
                </AccordionContent>

              </AccordionItem>

            }


            {/* /////////////////////////////////////////////////////////////////////////////// */}
            {/* /////////////                  ORDER INFORMATION                  ///////////// */}
            {/* /////////////////////////////////////////////////////////////////////////////// */}
            <AccordionItem value="order-information">
              <AccordionTrigger className="py-4">
                <div className="flex items-center gap-5">
                  <div className="h-10 w-10 flex items-center justify-center bg-custom-white rounded-full">
                    <Image src="/img/book.svg" alt="" width={24} height={24} />
                  </div>
                  <p className="text-custom-blue font-medium">Order Details</p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="flex flex-col pt-3 pb-14 gap-y-8">
                <section className="flex items-center justify-between gap-10">
                  {
                    (!!watch('items') && !!watch('items')?.length) &&
                    <Controller
                      name="business"
                      control={control}
                      render={({ field }) => (
                        <SelectSingleCombo
                          name="business" // ✅ REQUIRED — fixes the type error
                          label="Business"
                          value={field.value?.toString() || ""}
                          onChange={(val) => field.onChange(Number(val))}
                          options={
                            businesses?.map((b) => ({
                              label: b.name,
                              value: b.id.toString(),
                            })) || []
                          }
                          valueKey="value"
                          labelKey="label"
                          className="!h-10 min-w-40"
                          placeholder="Select Business"
                          isLoadingOptions={businessesLoading}
                          hasError={!!errors.business}
                          errorMessage={errors.business?.message}
                          variant="inputButton"
                        />
                      )}
                    />
                  }
                  {
                    !watch('items')?.length &&
                    <div className="w-full h-48 flex items-center justify-center">
                      <Button size="inputButton" onClick={addNewItem} className="w-full max-w-[300px]" type="button">
                        Add Item
                      </Button>
                    </div>
                  }
                </section>
                <section className="flex flex-col gap-y-12 lg:gap-y-20">
                  {
                    watch('items')?.map((_, index) => {
                      return (
                        <OrderFormItemsSection
                          key={index}
                          index={index}
                          control={control}
                          watch={watch}
                          errors={errors}
                          register={register}
                          setValue={setValue}
                          addNewItem={addNewItem}
                        />
                      )
                    })
                  }
                </section>
              </AccordionContent>
            </AccordionItem>


            {/* /////////////////////////////////////////////////////////////////////////////// */}
            {/* /////////////                 DELIVERY INFORMATION                ///////////// */}
            {/* /////////////////////////////////////////////////////////////////////////////// */}
            <AccordionItem value="delivery-information">
              <AccordionTrigger className="py-4 flex">
                <div className="flex items-center gap-5 text-[#194A7A]">
                  <div className="flex items-center justify-center p-1.5 h-10 w-10 rounded-full bg-[#F2F2F2]">
                    <TruckTime className="text-custom-blue" stroke="#194a7a" size={18} />
                  </div>
                  <h3 className="text-custom-blue font-medium">Delivery Details</h3>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-5">
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-10 pt-8 pb-14 w-full">
                  <FormField
                    control={control}
                    name="delivery.method"
                    render={({ field }) => (
                      <FormItem>
                        <SelectSingleCombo
                          label="Delivery Method"
                          options={DISPATCH_METHOD_OPTIONS}
                          {...field}
                          valueKey={"value"}
                          labelKey={"label"}
                          placeholder="Select delivery method"
                          hasError={!!errors.delivery?.method}
                          errorMessage={errors.delivery?.method?.message}
                        />
                      </FormItem>
                    )}
                  />
                  {
                    watch('delivery.method') === "Dispatch" &&
                    <>
                      <FormField
                        control={control}
                        name="delivery.address"
                        render={({ field }) => (
                          <FormItem
                            className="col-span-full md:col-span-2"
                          >
                            <FormControl>
                              <Input
                                className=""
                                label="Delivery Address"
                                {...field}
                                hasError={!!errors.delivery?.address}
                                errorMessage={errors.delivery?.address?.message}
                                placeholder="Enter delivery address"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name="delivery.zone"
                        render={({ field }) => (
                          <FormItem>


                            <SelectSingleCombo
                              label="Delivery Zone"
                              options={ZONES_OPTIONS}
                              {...field}
                              valueKey={"value"}
                              labelKey={"label"}
                              placeholder="Select delivery zone"
                              hasError={!!errors.delivery?.zone}
                              errorMessage={errors.delivery?.zone?.message}

                            />


                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name="delivery.dispatch"
                        render={({ field }) => (
                          <FormItem>
                            {
                              isCustomDelivery ?
                                <Input
                                  label="Delivery Fee"
                                  {...register('delivery.fee', { valueAsNumber: true })}
                                  hasError={!!errors.delivery?.fee}
                                  errorMessage={errors.delivery?.fee?.message}
                                  placeholder="Enter delivery fee"
                                />
                                :
                                <SelectSingleCombo
                                  label="Dispatch Location"
                                  {...field}
                                  value={field.value?.toString() || ''}
                                  isLoadingOptions={dispatchLocationsLoading}
                                  options={dispatchLocations?.data?.map(loc => ({ label: loc.location, value: loc.id.toString(), price: loc.delivery_price })) || []}
                                  valueKey={"value"}
                                  // labelKey={"label"}
                                  labelKey={(item) => `${item.label} (${formatCurrency(item.price, 'NGN')})`}
                                  placeholder="Select dispatch location"
                                  hasError={!!errors.delivery?.dispatch}
                                  errorMessage={errors.delivery?.dispatch?.message}
                                />
                            }
                            <button
                              className="bg-custom-blue rounded-none px-4 py-1.5 text-xs text-white"
                              onClick={toggleCustomDelivery}
                              type="button"
                            >
                              {
                                !isCustomDelivery ? "+ Custom Delivery" : "- Regular Delivery"
                              }
                            </button>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name="delivery.residence_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <SelectSingleSimple
                                options={[
                                  { value: "Home", label: "Home" },
                                  { value: "Office", label: "Office" },
                                  { value: "School", label: "School" },
                                  { value: "Church", label: "Church" },
                                  { value: "Hospital", label: "Hospital" },
                                  { value: "Hotel", label: "Hotel" },
                                  { value: "Others", label: "Others" },
                                ]}
                                valueKey="value"
                                labelKey="label"
                                label="Residence Type"
                                hasError={!!errors.delivery?.residence_type}
                                errorMessage={errors.delivery?.residence_type?.message}
                                placeholder="Enter residence type"
                                optional
                                {...field}
                                onChange={(value) => field.onChange(value)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </>
                  }

                  <FormField
                    control={control}
                    name="delivery.delivery_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <SingleDatePicker
                          label="Delivery Date"
                          defaultDate={new Date(field.value ?? new Date())}
                          value={format(new Date(field.value ?? new Date()), 'yyyy-MM-dd')}
                          onChange={(newValue) => setValue('delivery.delivery_date', format(newValue, 'yyyy-MM-dd'))}
                          placeholder="Select delivery date"
                          disablePastDates={true}
                        />
                        {
                          errors.delivery?.delivery_date &&
                          <FormError errorMessage={errors.delivery?.delivery_date?.message as string}
                          />
                        }
                      </FormItem>
                    )}
                  />

                  <TimePicker
                    label="Dispatch Time"
                    control={control}
                    name="delivery.delivery_time"
                    hasError={!!errors.delivery?.delivery_time}
                    errorMessage={errors.delivery?.delivery_time?.message}

                  // placeholder="Select delivery date"
                  />

                  <FormField
                    control={control}
                    name="delivery.recipient_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            label="Recipient's Name"
                            {...field}
                            hasError={!!errors.delivery?.recipient_name}
                            errorMessage={errors.delivery?.recipient_name?.message}
                            placeholder="Enter recipient name"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="delivery.recipient_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            label="Recipient's Phone Number"
                            {...field}
                            hasError={!!errors.delivery?.recipient_phone}
                            errorMessage={errors.delivery?.recipient_phone?.message}
                            placeholder="Enter recipient phone number"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="delivery.recipient_alternative_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            label="Recipient's Alt Phone Number"
                            {...field}
                            hasError={!!errors.delivery?.recipient_alternative_phone}
                            errorMessage={errors.delivery?.recipient_alternative_phone?.message}
                            placeholder="Enter recipient alternative phone number"
                            optional
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />




                  <FormField
                    control={control}
                    name="delivery.note"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormControl>
                          <Input
                            label="Delivery Note"
                            {...field}
                            hasError={!!errors.delivery?.note}
                            errorMessage={errors.delivery?.note?.message}
                            placeholder="Enter delivery note"
                            optional
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                </div>
              </AccordionContent>
            </AccordionItem>


            {/* /////////////////////////////////////////////////////////////////////////////// */}
            {/* /////////////////////////////////////////////////////////////////////////////// */}
            {/* /////////////                  ORDER INSTRUCTION                  ///////////// */}
            {/* /////////////////////////////////////////////////////////////////////////////// */}
            {/* /////////////////////////////////////////////////////////////////////////////// */}
            <AccordionItem value="order-Instruction">
              <AccordionTrigger className="py-4">
                <div className="flex items-center gap-5">
                  <div className="h-10 w-10 flex items-center justify-center bg-custom-white rounded-full">
                    <Image src="/img/book.svg" alt="" width={24} height={24} />
                  </div>
                  <p className="text-custom-blue font-medium">
                    Message on Order
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-8 pb-14">
                <Input
                  label="Message on Order"
                  hasError={!!errors.message}
                  errorMessage={errors.message?.message as string}
                  placeholder="Enter message on order"
                  {...register("message")}
                  optional
                />
              </AccordionContent>
            </AccordionItem>



            {/* /////////////////////////////////////////////////////////////////////////////// */}
            {/* /////////////                  PAYMENT INFORMATION                  ///////////// */}
            {/* /////////////////////////////////////////////////////////////////////////////// */}
            <AccordionItem value="payment-information">
              <AccordionTrigger className="py-4">
                <div className="flex items-center gap-5">
                  <div className="h-10 w-10 flex items-center justify-center bg-custom-white rounded-full">
                    <Money
                      className="text-custom-blue"
                      stroke="#194a7a"
                      size={18}
                    />
                  </div>
                  <p className="text-custom-blue font-medium">Payment</p>
                </div>
              </AccordionTrigger>

              <AccordionContent>
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-10 pt-8 pb-14 w-full">
                  <Controller
                    name="payment_options"
                    control={control}
                    render={({ field }) => (
                      <SelectSingleCombo
                        {...field}
                        label="Payment Option"
                        valueKey="value"
                        labelKey="label"
                        options={ENQUIRY_PAYMENT_OPTIONS}
                        placeholder="Select Payment Option"
                        hasError={!!errors.payment_options}
                        errorMessage={errors.payment_options?.message}
                      />
                    )}
                  />

                  {(selectedPaymentOption === "paid_usd_transfer" || selectedPaymentOption === "paid_paypal" || selectedPaymentOption === "paid_bitcoin") && (
                    <Controller
                      name="amount_paid_in_usd"
                      control={control}
                      render={({ field }) => (
                        <Input
                          label="Amount Paid (USD)"
                          id="amount_paid_in_usd"
                          placeholder="Enter amount paid in USD"
                          className="col-span-3"
                          {...field}
                          hasError={!!errors.amount_paid_in_usd}
                          errorMessage={errors.amount_paid_in_usd?.message}
                        />
                      )}
                    />
                  )}

                  {(selectedPaymentOption === "part_payment_cash" || selectedPaymentOption === "part_payment_transfer") && (
                    <Controller
                      name="initial_amount_paid"
                      control={control}
                      render={({ field }) => (
                        <Input
                          label="Initial Amount Paid"
                          placeholder="Enter initial amount paid"
                          id="initial_amount_paid"
                          className=""
                          pattern="^[0-9]*$"
                          {...field}
                          hasError={!!errors.initial_amount_paid}
                          errorMessage={errors.initial_amount_paid?.message}
                        />
                      )}
                    />
                  )}

                  {!(selectedPaymentOption === "paid_usd_transfer" || selectedPaymentOption === "paid_paypal" || selectedPaymentOption === "paid_bitcoin") && (
                    <Controller
                      name="payment_currency"
                      control={control}
                      render={({ field }) => (
                        <SelectSingleCombo
                          {...field}
                          label="Currency"
                          valueKey="value"
                          labelKey="label"
                          options={[
                            { value: "NGN", label: "NGN" },
                            { value: "USD", label: "USD" },
                          ]}
                          placeholder="Select Currency"
                          hasError={!!errors.payment_currency}
                          errorMessage={errors.payment_currency?.message}
                        />
                      )}
                    />
                  )}

                  {
                    watch('payment_options') !== "not_paid_go_ahead" &&
                    <>
                      <FilePicker
                        onFileSelect={(file) => setValue("payment_proof", file!)}
                        hasError={!!errors.payment_proof}
                        errorMessage={errors.payment_proof?.message as string}
                        maxSize={10}
                        label="Upload Payment Proof"
                      />
                      <Controller
                        name="payment_receipt_name"
                        control={control}
                        render={({ field }) => (
                          <Input
                            label="Payment Receipt Name"
                            id="payment_receipt_name"
                            placeholder="Enter name in payment receipt"
                            className="col-span-3"
                            {...field}
                            hasError={!!errors.payment_receipt_name}
                            errorMessage={errors.payment_receipt_name?.message}
                          />
                        )}
                      />
                    </>
                  }
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <footer className="flex py-16">
            <Button
              type="submit"
              variant="default"
              size="lg"
              className="flex items-center gap-2 ml-auto"
              disabled={isPending || isUploading}
            >
              Update Order
              {
                (isPending || isUploading) && <Spinner size={20} />
              }
            </Button>
          </footer>
        </form>
      </Form>


      <ConfirmActionModal
        isModalOpen={isSuccessModalOpen}
        icon={<ShoppingBag className="text-[#37d67a]" size={60} />}
        customTitleText="Success"
        heading="Order updated successfully"
        subheading="Order has been updated successfully"
        customConfirmText="View Order"
        customCancelText="Create New Order"
        confirmFn={routeToOrderDetails}
        closeModal={closeSuccessModal}
        cancelAction={resetForm}
      />
    </div>
  );
};

export default NewOrderPage;