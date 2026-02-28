"use client";
import React, { useState } from "react";
import Image from "next/image";
import {
  Controller,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { Money, TruckTime, Box, Trash } from "iconsax-react";
import { Plus, UserIcon } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

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
  Spinner,
  ConfirmActionModal,
  AmountInput,
  Textarea,
} from "@/components/ui";
import {
  DISPATCH_METHOD_OPTIONS,
  ENQUIRY_CHANNEL_OPTIONS,
  ENQUIRY_OCCASION_OPTIONS,
} from "@/constants";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetCategories, useGetProducts } from "@/app/(dashboard)/inventory/misc/api";
import FormError from "@/components/ui/formError";
import { formatCurrency } from "@/utils/currency";
import { useBooleanStateControl } from "@/hooks";
import { extractErrorMessage } from "@/utils/errors";

import { useRouter, useSearchParams } from "next/navigation";
import { NewEnquiryFormValues, NewEnquirySchema } from "../misc/utils/schema";
import { useCreateEnquiry, useGetEnquiryDetail, useUpdateEnquiry } from "../misc/api";
import { useGeTOrderDeliveryLocations } from "../../misc/api";
import EnquiryFormItemsSection from "../misc/components/EnquiryFormItemsSection";
import { formatTimeString } from "@/utils/strings";
import Link from "next/link";
import { useGetAllBranches } from "@/app/(dashboard)/admin/businesses/misc/api";
import SelectSingleSimple from "@/components/ui/selectSingleSimple";
import { useGetAllDiscounts } from "@/app/(dashboard)/admin/discount/misc/api";
import { useGetAllBusiness } from "@/mutations/business.mutation";


const NewEnquiryPage = () => {
  const enquiry_id = useSearchParams().get('enquiry_id');

  const { data: enquiryData, isLoading: isLoadingEnquiryData } = useGetEnquiryDetail(enquiry_id ?? '')
  const { data: branches, isLoading: branchesLoading } = useGetAllBranches();
  const { data: businesses, isLoading: businessesLoading } = useGetAllBusiness();
  const { data: categories, isLoading: categoriesLoading } = useGetCategories();
  const { data: products, isLoading: productsLoading } = useGetProducts();
  const { data: dispatchLocations, isLoading: dispatchLocationsLoading } = useGeTOrderDeliveryLocations();
  const { data: discounts, isLoading: isLoadingDiscounts } = useGetAllDiscounts();
  const [isCustomDiscount, setIsCustomDiscount] = useState(false)

  const form = useForm<NewEnquiryFormValues>({
    resolver: zodResolver(NewEnquirySchema),
  });

  const { control, handleSubmit, formState: { errors }, watch, setValue, getValues, register, reset } = form;
  const { append } = useFieldArray({
    control,
    name: "items"
  });


  React.useEffect(() => {
    if (!isLoadingEnquiryData && !!enquiryData) {
      const resetData: Partial<NewEnquiryFormValues> = {
        customer: {
          name: enquiryData.customer?.name || "",
          phone: enquiryData.customer?.phone || "",
          email: enquiryData.customer?.email || "",
        },
        enquiry_channel: enquiryData.enquiry_channel || "",
        enquiry_occasion: enquiryData.enquiry_occasion || "",
        social_media_details: enquiryData.social_media_details || "",
        branch: enquiryData.branch?.id,
        message: enquiryData.message || "",
        delivery: {
          zone: enquiryData.delivery?.zone || "LM" as "LM" | "LC" | "LI" | "ND",
          method: enquiryData.delivery?.method as "Dispatch" | "Pickup" | undefined,
          dispatch: enquiryData.delivery?.dispatch?.id?.toString() || "",
          address: enquiryData.delivery?.address || "",
          recipient_name: enquiryData.delivery?.recipient_name || "",
          recipient_phone: enquiryData.delivery?.recipient_phone || "",
          recipient_alternative_phone: enquiryData.delivery?.recipient_alternative_phone || "",
          residence_type: enquiryData.delivery?.residence_type || "",
          note: enquiryData.delivery?.note || "",
          fee: enquiryData.delivery?.fee ? Number(enquiryData.delivery.fee) : undefined,
          is_custom_delivery: enquiryData.delivery?.is_custom_delivery || false,
          delivery_date: enquiryData.delivery?.delivery_date
            ? format(new Date(enquiryData.delivery.delivery_date), "yyyy-MM-dd")
            : format(new Date(), "yyyy-MM-dd"),
          delivery_time: enquiryData.delivery?.delivery_time
            ? formatTimeString(enquiryData.delivery.delivery_time, "HH:mm")
            : "15:00",
        },
        items:
          enquiryData.items?.map((item) => ({
            category: item.product?.category?.id || 1,
            product_id: item.product?.id || 0,
            product_variation_id: item.product_variation?.id?.toString() || "",
            quantity: item.quantity || 1,
            properties: {
              layers: item.properties?.[0]?.layers?.id?.toString(),
              toppings: item.properties?.[0]?.toppings?.id?.toString(),
              bouquet: item.properties?.[0]?.bouquet?.id?.toString(),
              glass_vase: item.properties?.[0]?.glass_vase?.id?.toString(),
            },
            inventories: item.inventories?.map((inventory) => ({
              stock_inventory_id: inventory.stock_inventory?.id,
              product_inventory_id: inventory.product_inventory?.id,
              message: inventory.message || "",
              instruction: inventory.instruction || "",
              variations:
                inventory.variations?.map((variation) => ({
                  stock_variation_id: !!inventory.stock_inventory ? Number(variation.variation_details?.id) : undefined,
                  product_inventory_variation_id: !!inventory.product_inventory
                    ? Number(variation.variation_details?.id)
                    : undefined,
                  quantity: Number(variation.quantity) || 1,
                })) || [],
            })) || [{ variations: [] }],
          })) || [],
      }

      reset(resetData)
    }
  }, [enquiryData, isLoadingEnquiryData, reset])

  console.log(errors)

  const addNewItem = () => {
    append({
      category: categories?.[0].id || 1,
      product_id: products?.[0].id || 0,
      product_variation_id: '',
      quantity: 1,
      properties: {},
      inventories: [{
        variations: [],
      }],
    });
  };

  const router = useRouter();
  const {
    state: isSuccessModalOpen,
    setTrue: openSuccessModal,
    setFalse: closeSuccessModal,
  } = useBooleanStateControl()
  const { mutate, isPending } = useUpdateEnquiry()

  const { uploadToCloudinary } = useCloudinary();
  const onSubmit = async (data: NewEnquiryFormValues) => {
    const processedItems = !!data.items ? await Promise.all(
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
      })
    ) : [];
    const dataToSubmit = {
      ...data,
      items: processedItems,
    }
    mutate({ id: enquiry_id ?? '', data: dataToSubmit }, {
      onSuccess(data) {
        toast.success("Enquiry created successfully");
        openSuccessModal();
      },
      onError(error: unknown) {
        const errMessage = extractErrorMessage((error as any)?.response?.data as any);
        toast.error(errMessage, { duration: 7500 });
      }
    })
  };

  const routeToEnquiryDetails = () => {
    router.push(`/order-management/enquiries/${enquiry_id}`);
  }

  const resetForm = () => {
    reset();
  }
  const isCustomDelivery = watch(`delivery.is_custom_delivery`);
  const toggleCustomDelivery = () => {
    setValue('delivery.is_custom_delivery', !isCustomDelivery);
  }

  // console.log(getValues('items'))
  const watchedClientPhoneNumber = watch('customer.phone')

  if (isLoadingEnquiryData || !enquiryData) {
    return <div className="w-full h-full flex items-center justify-center"><Spinner /></div>
  }



  return (
    <div className="px-8 md:pt-12 w-full md:w-[92.5%] max-w-[1792px] mx-auto">
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Accordion
            type="multiple"
            defaultValue={["client-information", "Enquiry-information", "delivery-information", "Enquiry-Instruction", "payment-information",]}
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
                          watchedClientPhoneNumber?.length == 11 && <Link href={`/order-management/client-history/${watchedClientPhoneNumber}`}>View history</Link>
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
                            {...field}
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
            {/* /////////////                  Enquiry INFORMATION                  ///////////// */}
            {/* /////////////////////////////////////////////////////////////////////////////// */}
            <AccordionItem value="Enquiry-information">
              <AccordionTrigger className="py-4">
                <div className="flex items-center gap-5">
                  <div className="h-10 w-10 flex items-center justify-center bg-custom-white rounded-full">
                    <Image src="/img/book.svg" alt="" width={24} height={24} />
                  </div>
                  <p className="text-custom-blue font-medium">Enquiry Details</p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="flex flex-col pt-3 pb-14 gap-y-8">
                <section className="flex items-center justify-between gap-10">
                  {
                    (!!watch('items') && !!watch('items')?.length) &&
                    <Controller
                      name="branch"
                      control={control}
                      render={({ field }) => (
                        <SelectSingleCombo
                          name="branch" // ✅ REQUIRED — fixes the type error
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
                          hasError={!!errors.branch}
                          errorMessage={errors.branch?.message}
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
                        <EnquiryFormItemsSection
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
                          optional
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
                                optional
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
                              options={[
                                {
                                  value: "LM",
                                  label: "Lagos Mainland (LM)",
                                },
                                {
                                  value: "LC",
                                  label: "Lagos Central (LC)",
                                },
                                {
                                  value: "LI",
                                  label: "Lagos Island (LI)",
                                },
                              ]}
                              {...field}
                              valueKey={"value"}
                              labelKey={"label"}
                              placeholder="Select delivery zone"
                              hasError={!!errors.delivery?.zone}
                              errorMessage={errors.delivery?.zone?.message}
                              optional
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
                                  optional
                                />
                                :
                                <SelectSingleCombo
                                  label="Dispatch Location"
                                  {...field}
                                  value={field.value?.toString() || ''}
                                  isLoadingOptions={dispatchLocationsLoading}
                                  options={dispatchLocations?.data?.map(loc => ({ label: loc.location, value: loc.id.toString(), price: loc.delivery_price })) || []}
                                  valueKey={"value"}
                                  labelKey={(item) => `${item.label} (${formatCurrency(item.price, 'NGN')})`}
                                  placeholder="Select dispatch location"
                                  hasError={!!errors.delivery?.dispatch}
                                  errorMessage={errors.delivery?.dispatch?.message}
                                  optional
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
                          optional
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
                    optional
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
                            optional
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
                            placeholder="Enter recipient name"
                            optional
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
            {/* /////////////                  Enquiry INSTRUCTION                  ///////////// */}
            {/* /////////////////////////////////////////////////////////////////////////////// */}
            {/* /////////////////////////////////////////////////////////////////////////////// */}
            <AccordionItem value="Enquiry-Instruction">
              <AccordionTrigger className="py-4">
                <div className="flex items-center gap-5">
                  <div className="h-10 w-10 flex items-center justify-center bg-custom-white rounded-full">
                    <Image src="/img/book.svg" alt="" width={24} height={24} />
                  </div>
                  <p className="text-custom-blue font-medium">
                    Message on Enquiry
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-8 pb-14">
                <Input
                  label="Message on Enquiry"
                  hasError={!!errors.message}
                  errorMessage={errors.message?.message as string}
                  placeholder="Enter message on Enquiry"
                  {...register("message")}
                  optional
                />
              </AccordionContent>
            </AccordionItem>



            {/* /////////////////////////////////////////////////////////////////////////////// */}
            {/* /////////////////////////////////////////////////////////////////////////////// */}
            {/* /////////////                  Discount section                  ////////////// */}
            {/* /////////////////////////////////////////////////////////////////////////////// */}
            {/* /////////////////////////////////////////////////////////////////////////////// */}
            <AccordionItem value="Discount-information">
              <AccordionTrigger className="py-4">
                <div className="flex items-center gap-5">
                  <div className="h-10 w-10 flex items-center justify-center bg-custom-white rounded-full">
                    <Image src="/img/book.svg" alt="" width={24} height={24} />
                  </div>
                  <p className="text-custom-blue font-medium">
                    Discount (optional)
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-8 pb-14">
                <div>
                  <div className="flex gap-4 items-center ">
                    {
                      !isCustomDiscount &&
                      <SelectSingleCombo
                        name='discount_id'
                        className='max-w-[350px]'
                        value={watch('discount_id')?.toString() || ''}
                        onChange={(value) => setValue('discount_id', Number(value))}
                        label='Discount Type'
                        labelKey={(item) => `${item.label} - ${formatCurrency(Number(item.amount), 'NGN')}`}
                        valueKey={'value'}
                        placeholder='Select discount type'
                        options={discounts?.data?.map((discount) => ({
                          label: discount.type,
                          value: discount.id.toString(),
                          amount: discount.amount
                        })) || []}
                        isLoadingOptions={isLoadingDiscounts}
                      />
                    }


                    <Button
                      onClick={() => setIsCustomDiscount((prev) => !prev)}
                      className="mt-6 !h-12"
                      type="button"
                    >
                      {
                        isCustomDiscount ?
                          "Use Regular Discounts" :
                          "Enter Custom Amount"
                      }
                    </Button>
                  </div>

                  {
                    isCustomDiscount &&
                    <div className="space-y-5">
                      <AmountInput
                        label="Discount Amount"
                        className='max-w-[350px]'
                        hasError={!!errors.custom_discount_amount}
                        errorMessage={errors.custom_discount_amount?.message}
                        placeholder="Enter discount amount"
                        {...register('custom_discount_amount')}
                      />
                      <Textarea
                        className='max-w-[350px]'
                        placeholder='Enter discount reason'
                        label="Discount Reason"
                      // {...register('custom_discount_reason')}
                      />
                    </div>
                  }
                  <Button
                    type="button"
                    className='flex items-center gap-1 mt-4 text-[#d8636d] bg-red-100'
                    onClick={() => setValue('discount_id', undefined)}
                  >
                    <Trash className='w-5 h-5 text-[#d8636d]' />

                    Remove discount
                  </Button>
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
              disabled={isPending}
            >
              Proceed
              {
                isPending && <Spinner size={20} />
              }
            </Button>
          </footer>
        </form>
      </Form>

      <ConfirmActionModal
        isModalOpen={isSuccessModalOpen}
        icon={<Box className="text-[#37d67a]" size={60} />}
        customTitleText="Success"
        heading="Enquiry updated successfully"
        subheading="Enquiry has been updated successfully"
        customConfirmText="View Enquiry"
        customCancelText="Create New Enquiry"
        confirmFn={routeToEnquiryDetails}
        closeModal={closeSuccessModal}
        cancelAction={resetForm}
      />
    </div>
  );
};

export default NewEnquiryPage;