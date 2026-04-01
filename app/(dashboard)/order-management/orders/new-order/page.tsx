"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { Money, Trash, TruckTime } from "iconsax-react";
import { Plus, UserIcon } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";

import useCloudinary from "@/hooks/useCloudinary";
import {
  Accordion,
  AccordionContent,
  AccordionTrigger,
  AccordionItem,
  Input,
  SingleDatePicker,
  SelectSingleCombo,
  Button,
  FilePicker,
  FormControl,
  FormField,
  FormItem,
  Form,
  TimePicker,
  Spinner,
  Textarea,
  AmountInput,
} from "@/components/ui";
import { SelectBranchCombo } from "@/components/ui";
import {
  DISPATCH_METHOD_OPTIONS,
  ENQUIRY_CHANNEL_OPTIONS,
  ENQUIRY_OCCASION_OPTIONS,
  ENQUIRY_PAYMENT_OPTIONS,
  ZONES_OPTIONS,
} from "@/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useGetCategories,
  useGetProducts,
} from "@/app/(dashboard)/inventory/misc/api";
import FormError from "@/components/ui/formError";
import { formatCurrency } from "@/utils/currency";
import { extractErrorMessage } from "@/utils/errors";

import { NewOrderFormValues, NewOrderSchema } from "../../misc/utils/schema";
import OrderFormItemsSection from "../../misc/components/OrderFormItemsSection";
import { useCreateOrder, useGeTOrderDeliveryLocations } from "../../misc/api";
import { TOrder } from "../../misc/types";
import { useLoading } from "@/contexts";
import SelectSingleSimple from "@/components/ui/selectSingleSimple";
import { useGetAllBranches } from "@/app/(dashboard)/admin/businesses/misc/api";
import { useGetAllBusiness } from "@/mutations/business.mutation";
import { useGetAllDiscounts } from "@/app/(dashboard)/admin/discount/misc/api";

const NewOrderPage = () => {
  const { data: branches, isLoading: branchesLoading } = useGetAllBranches();
  const { data: businesses, isLoading: businessesLoading } =
    useGetAllBusiness();

  const { data: categories, isLoading: categoriesLoading } = useGetCategories();
  const { data: products, isLoading: productsLoading } = useGetProducts();
  const { data: dispatchLocations, isLoading: dispatchLocationsLoading } =
    useGeTOrderDeliveryLocations();
  const { data: discounts, isLoading: isLoadingDiscounts } =
    useGetAllDiscounts();
  const [isCustomDiscount, setIsCustomDiscount] = useState(false);

  const form = useForm<NewOrderFormValues>({
    resolver: zodResolver(NewOrderSchema),
    defaultValues: {
      business: branches?.data?.[0].id,
      customer: {
        name: "",
        phone: "",
        alternative_phone: "",
        email: "",
      },
      delivery: {
        zone: "LM",
        method: "Dispatch",
        delivery_date: format(new Date(), "yyyy-MM-dd"),
        delivery_time: format(
          new Date(Date.now() + 2 * 60 * 60 * 1000),
          "HH:mm",
        ),
        address: "",
        recipient_name: "",
        recipient_phone: "",
        recipient_alternative_phone: "",
        residence_type: "",
      },
      discount_id: undefined,
      custom_discount_amount: undefined,
      enquiry_channel: "",
      enquiry_occasion: "",
      items: [
        {
          category: categories?.[0].id,
          product_id: products?.[0].id,
          product_variation_id: "",
          quantity: 1,
          properties: {},
          inventories: [
            {
              variations: [],
            },
          ],
        },
      ],
      payment_status: "UP",
      payment_options: "not_paid_go_ahead",
      payment_currency: "NGN",
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    register,
    reset,
  } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  console.log(errors);

  const addNewItem = () => {
    append({
      category: categories?.[0].id || 1,
      product_id: products?.[0].id || 0,
      product_variation_id: "",
      quantity: 1,
      properties: {},
      inventories: [],
    });
  };

  const router = useRouter();
  const selectedPaymentOption = watch("payment_options");
  React.useEffect(() => {
    // "not_received_paid"
    if (
      selectedPaymentOption == "paid_usd_transfer" ||
      selectedPaymentOption == "paid_naira_transfer" ||
      selectedPaymentOption == "cash_paid" ||
      selectedPaymentOption == "paid_website_card" ||
      selectedPaymentOption == "paid_pos" ||
      selectedPaymentOption == "paid_paypal" ||
      selectedPaymentOption == "paid_bitcoin"
    ) {
      setValue("payment_status", "FP");
    } else if (
      selectedPaymentOption == "part_payment_cash" ||
      selectedPaymentOption == "part_payment_transfer"
    ) {
      setValue("payment_status", "PP");
    } else {
      setValue("payment_status", "UP");
    }
  }, [selectedPaymentOption, setValue]);

  const { uploadToCloudinary } = useCloudinary();
  const { isUploading } = useLoading();
  const [createdOrder, setCreatedOrder] = React.useState<TOrder | null>(null);

  const { mutate, isPending } = useCreateOrder();
  const onSubmit = async (data: NewOrderFormValues) => {
    let payment_proof: string | undefined;
    const PdfFile = data.payment_proof;
    if (data.payment_proof) {
      const data = await uploadToCloudinary(PdfFile);
      payment_proof = data.secure_url;
    }

    const processedItems = await Promise.all(
      data.items.map(async (item) => {
        let custom_image: string | undefined;
        if (item.custom_image && item.is_custom_order) {
          const uploadResult = await uploadToCloudinary(item.custom_image);
          custom_image = uploadResult.secure_url;
        }
        return {
          ...item,
          custom_image,
        };
      }),
    );
    const dataToSubmit = {
      ...data,
      items: processedItems,
      payment_proof: PdfFile ? payment_proof : undefined,
    };

    mutate(dataToSubmit, {
      onSuccess(data) {
        toast.success("Created successfully");
        router.push(`/order-management/orders/${data.data.id}/order-summary`);
        // setCreatedOrder(data?.data);
      },
      onError(error: unknown) {
        const errMessage = extractErrorMessage(
          (error as any)?.response?.data as any,
        );
        toast.error(errMessage, { duration: 7500 });
      },
    });
  };

  const isCustomDelivery = watch(`delivery.is_custom_delivery`);
  const toggleCustomDelivery = () => {
    setValue("delivery.is_custom_delivery", !isCustomDelivery);
  };
  const watchedClientPhoneNumber = watch("customer.phone");
  const watchedClientAlternativePhoneNumber = watch(
    "customer.alternative_phone",
  );
  const isDispatchOrder = watch("delivery.method") === "Dispatch";

  // console.log(getValues("items"));

  return (
    <div className="px-8 md:pt-12 w-full md:w-[92.5%] max-w-[1792px] mx-auto">
      <Form {...form}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
            }
          }}
        >
          <Accordion
            type="multiple"
            defaultValue={[
              "client-information",
              "order-information",
              "delivery-information",
              "order-Instruction",
              "payment-information",
            ]}
            className="w-full"
          >
            {/* /////////////////////////////////////////////////////////////////////////////// */}
            {/* /////////////                CLIENT INFORMATION                 ///////////// */}
            {/* /////////////////////////////////////////////////////////////////////////////// */}
            <AccordionItem value="client-information">
              <AccordionTrigger className="py-4 flex">
                <div className="flex items-center gap-5 text-[#194A7A]">
                  <div className="flex items-center justify-center p-1.5 h-10 w-10 rounded-full bg-[#F2F2F2]">
                    <UserIcon
                      className="text-custom-blue"
                      stroke="#194a7a"
                      fill="#194a7a"
                      size={18}
                    />
                  </div>
                  <h3 className="text-custom-blue font-medium">
                    Client Information
                  </h3>
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
                        {watchedClientPhoneNumber?.length == 11 && (
                          <Link href="/order-management/client-history">
                            View history
                          </Link>
                        )}
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="customer.alternative_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            label="Client's Alt Phone Number"
                            hasError={!!errors.customer?.alternative_phone}
                            errorMessage={
                              errors.customer?.alternative_phone?.message
                            }
                            placeholder="Enter client alternative phone number"
                            {...field}
                          />
                        </FormControl>
                        {watchedClientAlternativePhoneNumber?.length == 11 && (
                          <Link href="/order-management/client-history">
                            View history
                          </Link>
                        )}
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
            {/* /////////////                  ORDER INFORMATION                  ///////////// */}
            {/* /////////////////////////////////////////////////////////////////////////////// */}
            <AccordionItem value="order-information">
              <AccordionTrigger className="py-4">
                <div className="flex items-center gap-5">
                  <div className="h-10 w-10 flex items-center justify-center bg-custom-white rounded-full">
                    <img src="/img/book.svg" alt="" width={24} height={24} />
                  </div>
                  <p className="text-custom-blue font-medium">Order Details</p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="flex flex-col pt-3 pb-14 gap-y-8">
                <section className="flex items-center justify-between gap-10">
                  {!!watch("items") && !!watch("items")?.length && (
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
                  )}
                  {!watch("items")?.length && (
                    <div className="w-full h-48 flex items-center justify-center">
                      <Button
                        size="inputButton"
                        onClick={addNewItem}
                        className="w-full max-w-[300px]"
                        type="button"
                      >
                        Add Item
                      </Button>
                    </div>
                  )}
                </section>
                <section className="flex flex-col gap-y-12 lg:gap-y-20">
                  {watch("items")?.map((_, index) => {
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
                    );
                  })}
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
                    <TruckTime
                      className="text-custom-blue"
                      stroke="#194a7a"
                      size={18}
                    />
                  </div>
                  <h3 className="text-custom-blue font-medium">
                    Delivery Details
                  </h3>
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
                  {watch("delivery.method") === "Dispatch" && (
                    <>
                      <FormField
                        control={control}
                        name="delivery.address"
                        render={({ field }) => (
                          <FormItem className="col-span-full md:col-span-2">
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
                            {isCustomDelivery ? (
                              <Input
                                label="Delivery Fee"
                                {...register("delivery.fee", {
                                  valueAsNumber: true,
                                })}
                                hasError={!!errors.delivery?.fee}
                                errorMessage={errors.delivery?.fee?.message}
                                placeholder="Enter delivery fee"
                              />
                            ) : (
                              <SelectSingleCombo
                                label="Dispatch Location"
                                {...field}
                                value={field.value?.toString() || ""}
                                isLoadingOptions={dispatchLocationsLoading}
                                options={
                                  dispatchLocations?.data?.map((loc) => ({
                                    label: loc.location,
                                    value: loc.id.toString(),
                                    price: loc.delivery_price,
                                  })) || []
                                }
                                valueKey={"value"}
                                // labelKey={"label"}
                                labelKey={(item) =>
                                  `${item.label} (${formatCurrency(
                                    item.price,
                                    "NGN",
                                  )})`
                                }
                                placeholder="Select dispatch location"
                                hasError={!!errors.delivery?.dispatch}
                                errorMessage={
                                  errors.delivery?.dispatch?.message
                                }
                              />
                            )}
                            <button
                              className="bg-custom-blue rounded-none px-4 py-1.5 text-xs text-white"
                              onClick={toggleCustomDelivery}
                              type="button"
                            >
                              {!isCustomDelivery
                                ? "+ Custom Delivery"
                                : "- Regular Delivery"}
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
                                errorMessage={
                                  errors.delivery?.residence_type?.message
                                }
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
                  )}

                  <FormField
                    control={control}
                    name="delivery.delivery_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <SingleDatePicker
                          label="Delivery Date"
                          value={
                            field.value ? new Date(field.value) : undefined
                          }
                          onChange={(date) =>
                            field.onChange(format(date, "yyyy-MM-dd"))
                          }
                          placeholder="Select delivery date"
                          disablePastDates
                          optional
                        />

                        {errors.delivery?.delivery_date && (
                          <FormError
                            errorMessage={
                              errors.delivery?.delivery_date?.message as string
                            }
                          />
                        )}
                      </FormItem>
                    )}
                  />

                  <TimePicker
                    label={isDispatchOrder ? "Dispatch Time" : "Pickup Time"}
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
                            label={
                              isDispatchOrder
                                ? "Recipient's Name"
                                : "Pickup Contact Name"
                            }
                            {...field}
                            hasError={!!errors.delivery?.recipient_name}
                            errorMessage={
                              errors.delivery?.recipient_name?.message
                            }
                            placeholder={
                              isDispatchOrder
                                ? "Enter recipient name"
                                : "Enter pickup contact name"
                            }
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
                            label={
                              isDispatchOrder
                                ? "Recipient's Phone Number"
                                : "Pickup Contact Phone Number"
                            }
                            {...field}
                            hasError={!!errors.delivery?.recipient_phone}
                            errorMessage={
                              errors.delivery?.recipient_phone?.message
                            }
                            placeholder={
                              isDispatchOrder
                                ? "Enter recipient phone number"
                                : "Enter pickup contact phone number"
                            }
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
                            label={
                              isDispatchOrder
                                ? "Recipient's Alt Phone Number"
                                : "Pickup Contact Alt Phone Number"
                            }
                            {...field}
                            hasError={
                              !!errors.delivery?.recipient_alternative_phone
                            }
                            errorMessage={
                              errors.delivery?.recipient_alternative_phone
                                ?.message
                            }
                            placeholder={
                              isDispatchOrder
                                ? "Enter recipient alternative phone number"
                                : "Enter pickup contact alternative phone number"
                            }
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
                  placeholder="Enter Optional Card Message"
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

                  {(selectedPaymentOption === "paid_usd_transfer" ||
                    selectedPaymentOption === "paid_paypal" ||
                    selectedPaymentOption === "paid_bitcoin") && (
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

                  {(selectedPaymentOption === "part_payment_cash" ||
                    selectedPaymentOption === "part_payment_transfer") && (
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

                  {!(
                    selectedPaymentOption === "paid_usd_transfer" ||
                    selectedPaymentOption === "paid_paypal" ||
                    selectedPaymentOption === "paid_bitcoin"
                  ) && (
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

                  {watch("payment_options") !== "not_paid_go_ahead" && (
                    <>
                      <FilePicker
                        onFileSelect={(file) =>
                          setValue("payment_proof", file!)
                        }
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
                  )}
                </div>
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
                    {!isCustomDiscount && (
                      <SelectSingleCombo
                        name="discount_id"
                        className="max-w-[350px]"
                        value={watch("discount_id")?.toString() || ""}
                        onChange={(value) =>
                          setValue("discount_id", Number(value))
                        }
                        label="Discount Type"
                        labelKey={(item) =>
                          `${item.label} - ${formatCurrency(Number(item.amount), "NGN")}`
                        }
                        valueKey={"value"}
                        placeholder="Select discount type"
                        options={
                          discounts?.data?.map((discount) => ({
                            label: discount.type,
                            value: discount.id.toString(),
                            amount: discount.amount,
                          })) || []
                        }
                        isLoadingOptions={isLoadingDiscounts}
                      />
                    )}

                    <Button
                      onClick={() => setIsCustomDiscount((prev) => !prev)}
                      className="mt-6 !h-12"
                      type="button"
                    >
                      {isCustomDiscount
                        ? "Use Regular Discounts"
                        : "Enter Custom Amount"}
                    </Button>
                  </div>

                  {isCustomDiscount && (
                    <div className="space-y-5">
                      <AmountInput
                        label="Discount Amount"
                        className="max-w-[350px]"
                        hasError={!!errors.custom_discount_amount}
                        errorMessage={errors.custom_discount_amount?.message}
                        placeholder="Enter discount amount"
                        {...register("custom_discount_amount")}
                      />
                      <Textarea
                        className="max-w-[350px]"
                        placeholder="Enter discount reason"
                        label="Discount Reason"
                        // {...register('custom_discount_reason')}
                      />
                    </div>
                  )}
                  <Button
                    type="button"
                    className="flex items-center gap-1 mt-4 text-[#d8636d] bg-red-100"
                    onClick={() => setValue("discount_id", undefined)}
                  >
                    <Trash className="w-5 h-5 text-[#d8636d]" />
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
              disabled={isPending || isUploading}
            >
              Proceed
              {(isPending || isUploading) && <Spinner size={20} />}
            </Button>
          </footer>
        </form>
      </Form>
    </div>
  );
};

export default NewOrderPage;
