'use client'
import React, { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Book, Edit2, Money, Trash } from 'iconsax-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';

import { Input, Button, LinkButton, Form, SelectSingleCombo, Spinner, AmountInput, Textarea } from '@/components/ui';
import { Card, CardContent } from '@/components/ui/card';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBooleanStateControl } from '@/hooks';
import { formatCurrency } from '@/utils/currency';
import { convertKebabAndSnakeToTitleCase, formatTimeString } from '@/utils/strings';
import { extractErrorMessage, formatAxiosErrorMessage } from '@/utils/errors';

import OrderSummarySkeleton from './OrderSummarySkeleton';
import OrderSummaryExportModal from './OrderSummaryExportModal';
import { useAddDiscountToOrder, useGDiscounts, useGeTOrderDetail, useUpdateOrderStatus } from '../api';




const schema = z.object({
  discount_id: z.string().optional(),
  custom_discount_amount: z.number().optional(),
});
type FormData = z.infer<typeof schema>

export default function OrderSummary() {
  const {
    state: isExportSummaaryModalOpen,
    setTrue: openExportSummaryModal,
    setFalse: closeExportSummaryModal
  } = useBooleanStateControl()

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const { handleSubmit, formState: { errors }, control, watch, setValue, register } = form;

  const router = useRouter();

  const goBack = () => {
    router.back();
  };



  const [processed, setprocessed] = useState(false)

  const order_id = useParams()?.id as string;
  const { data: order, isLoading } = useGeTOrderDetail(order_id);
  const { data: discounts, isLoading: isLoadingDiscounts } = useGDiscounts();
  const { mutate: addDiscount, isPending: isAddingDiscount } = useAddDiscountToOrder();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateOrderStatus()
  const onSubmit = (data: FormData) => {
    console.log(data);
    if (data.discount_id || data.custom_discount_amount) {
      addDiscount({ ...data, id: order_id, },
        {
          onSuccess() {
            handleStatusUpdate()
          },
        }
      );
    }
    else {
      handleStatusUpdate()
    }
  }

  const selectedDiscountAmount = discounts?.data.find((discount) => discount.id.toString() === String(watch('discount_id')))?.amount || 0;
  const handleStatusUpdate = () => {
    updateStatus({ id: order_id, status: "SOA" as "PND" | "SOA" | "SOR" | "STD" | "COM" | "CAN" },
      {
        onSuccess: (data) => {
          toast.success("Order status updated successfully");
          setprocessed(true)

        },
        onError: (error) => {
          const errorMessage = extractErrorMessage(error as unknown as any) || formatAxiosErrorMessage(error as unknown as any);
          toast.error(errorMessage), {
            duration: 5000,
          };
        }
      }
    );
  }

  const [isCustomDiscount, setIsCustomDiscount] = useState(false)

  React.useEffect(() => {
    if (!!watch('custom_discount_amount')) {
      setValue('discount_id', undefined)
    }
  }, [watch('custom_discount_amount')])

  React.useEffect(() => {
    if (!!watch('discount_id')) {
      setValue('custom_discount_amount', 0 as number);
    }
  }, [watch('discount_id')])

  // React.useEffect(() => {
  //   if (!isLoading && !!order) {
  //     setprocessed(order.status === 'STD' || order.status === 'COM' || order.status === 'CAN')
  //   }
  // }, [order, isLoading])

  if (isLoading) {
    return <OrderSummarySkeleton />;
  }


  return (
    <>
      {
        processed ?
          (
            <div className='size-full flex flex-col gap-2 items-center justify-center'>
              <Image src='/img/complete-order.png' alt='processing' width={450} height={450} />
              <h1 className='text-3xl font-medium my-1.5'>Order Added Successfully!</h1>
              <p className='font-normal font-poppins'>Processed By: Adetola Ayodeji</p>
              <LinkButton href='/order-management/orders' variant='black' size='lg' className='mt-8'>
                Back to Order Management
              </LinkButton>
            </div>
          )
          :
          <div className='flex flex-col w-full md:w[92.5%] max-w-[1280px] mr-auto p-6 xl:px-12'>
            <div className='flex items-center mb-10'>
              <Button
                variant='ghost'
                size='icon'
                className='mr-2'
                onClick={() => goBack()}>
                <ArrowLeft className='h-6 w-6 text-[#A0AEC0]' />
              </Button>
              <h1 className='text-2xl font-semibold font-manrope'>Order Summary</h1>
            </div>

            <section className='flex flex-col gap-3 bg-white p-6 rounded-2xl shadow-sm mb-10'>
              <article>
                <div className='grid grid-cols-3 gap-6 mb-6'>
                  <div>
                    <p className='text-sm  text-gray-500'>
                      Customer Name:{' '}
                      <span className='text-[#194A7A] text-base font-semibold'>
                        {order?.customer.name}
                      </span>
                    </p>
                    <p className='text-sm text-gray-500 mt-2'>
                      Phone Number: {" "}
                      <span className="text-[#194A7A] text-base font-semibold">
                        {order?.customer.phone}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>
                      Recipient Name:{' '}
                      <span className='text-base text-[#194A7A] font-semibold'>{order?.delivery.recipient_name}</span>
                    </p>
                    <p className='text-sm text-gray-500 mt-2'>
                      Phone Number: {" "}
                      <span className="text-[#194A7A] text-base font-semibold">
                        {order?.delivery.recipient_phone}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className='text-sm text-[#687588] font-medium'>
                      Order Occasion: <span className='text-base font-semibold text-[#194A7A]'>{order?.enquiry_occasion}</span>
                    </p>
                    <p className='text-sm text-gray-500 mt-2'>
                      Recipient Alternative Number: {" "}
                      <span className="text-[#194A7A] text-base font-semibold">
                        {order?.delivery.recipient_alternative_phone}
                      </span>
                    </p>
                  </div>

                </div>
              </article>
            </section>

            <section className='grid grid-cols-[1fr,0.5fr] gap-8 mb-10 '>
              <div>
                <div className="space-y-4 mt-1">
                  {
                    order?.items.map((item, index: number) => {
                      const itemCategory = item.inventories[0]?.stock_inventory?.category.name || item.product?.category.name
                      const placeHolderImage = `/img/placeholders/${itemCategory}.svg`

                      return (
                        <article key={item.id} className="flex border rounded-2xl p-6 bg-white">
                          <div className="flex flex-col gap-1.5 w-full max-w-[700px] bg-white rounded-xl">
                            <header className="flex items-start justify-between">
                              <div className="relative w-[120px] aspect-[98/88] rounded-xl bg-[#F6F6F6]">
                                <Image
                                  src={item.product.image || placeHolderImage}
                                  alt={item.product.name}
                                  fill
                                  className="object-cover rounded-md"
                                />
                              </div>

                            </header>

                            <section className="flex flex-col justify-between">
                              <h5 className="text-[#194A7A] text-lg font-medium mb-5">
                                {item.product.name}
                              </h5>
                              <div className="xl:flex">
                                <div className="space-y-2.5 text-[0.8rem]">
                                  <div className="flex items-center gap-x-5 gap-y-2 flex-wrap">
                                    <p className="flex items-center gap-1 text-[#111827] font-medium">
                                      <span className="text-[#687588]">Quantity:</span> {item.quantity} pcs
                                    </p>
                                    <p className="flex items-center gap-1 text-[#111827] font-medium">
                                      <span className="text-[#687588]">Category:</span> {item.product.category.name}
                                    </p>
                                    {item.inventories[0]?.variations[0]?.variation_details?.size && (
                                      <p className="flex items-center gap-1 text-[#111827] font-medium">
                                        <span className="text-[#687588]">Size:</span> {item.inventories[0].variations[0].variation_details.size}
                                      </p>
                                    )}
                                  </div>
                                  {item.properties.map((property, index) => (
                                    <div key={index}>
                                      {Object.entries(property).map(([key, value]) => {
                                        if (key === "id" || !value) return null
                                        if (key.includes("at_order")) return null

                                        const displayValue = typeof value === "object" && value !== null ? value.name : value

                                        return (
                                          <p key={key} className="text-[#111827] font-medium">
                                            <span className="text-[#687588]">{convertKebabAndSnakeToTitleCase(key)}:</span> {displayValue}
                                          </p>
                                        )
                                      })}
                                    </div>
                                  ))}

                                  {item.inventories[0]?.instruction && (
                                    <p className="text-[#111827] font-medium">
                                      <span className="text-[#687588]">Instructions:</span>{" "}
                                      {item.inventories[0].instruction}
                                    </p>
                                  )}
                                </div>

                                <div className="space-y-2.5 text-[0.8rem] content-center flex-1 flex justify-end">
                                  {item.inventories[0]?.message && (
                                    <p className="flex flex-col text-[#111827] font-medium text-right">
                                      <span className="text-[#687588]">Message:</span>{" "}
                                      {item.inventories[0].message}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </section>

                            <section className="flex items-center justify-between pt-1 border-t">
                              {/* <p className="text-[#111827] font-medium text-sm">
                                <span className="text-[#687588] italic font-light text-[0.8rem]">
                                  Production Cost:{" "}
                                </span>
                                {formatCurrency(Number(item.product_variation.selling_price || 0), 'NGN')}

                              </p> */}
                              <p className="font-medium text-[#194A7A] ml-auto">
                                Total Amount:{" "}
                                <span className="font-bold">
                                  {
                                    formatCurrency(
                                      (
                                        Number(item.product_variation.selling_price || 0) +
                                        item.miscellaneous
                                          .map(misc => Number(misc.cost) || 0)
                                          .reduce((acc: number, curr: number) => Number(acc) + Number(curr), 0) +
                                        item.properties.reduce((acc, property) => {
                                          const value =
                                            Number(property.glass_vase_selling_at_order || 0) +
                                            Number(property.toppings_selling_at_order || 0) +
                                            Number(property.whipped_cream_selling_at_order || 0);
                                          return acc + value;
                                        }, 0)
                                      ) * Number(item.quantity || 0),
                                      'NGN'
                                    )
                                  }
                                </span>
                              </p>
                            </section>
                          </div>
                        </article>
                      )
                    })
                  }
                </div>

                <div >
                  <div >
                  </div>
                </div>


                {/* <Form {...form}>
                  <form onSubmit={handleSubmit(onSubmit)} className='mt-16' id="discount_form">
                    <section className='flex flex-col'>
                      <header className="flex items-center gap-5 text-[#194A7A] border-b mb-4 p-1.5">
                        <div className='flex items-center justify-center p-1.5 h-10 w-10 rounded-full bg-[#F2F2F2]'>
                          <Book className='text-custom-blue' stroke="#194a7a" fill="#194a7a" size={18} />
                        </div>
                        <h3 className="text-custom-blue font-medium pb-3">Discount {" "}
                          <span className="text-[#BEBEBE text-sm font-normal">
                            (optional)
                          </span>
                        </h3>
                      </header>
                      <div>
                        <div className="flex gap-4 items-center ">
                          {
                            !isCustomDiscount &&
                            <SelectSingleCombo
                              name='discount_id'
                              className='max-w-[350px]'
                              value={form.watch('discount_id')}
                              onChange={(value) => form.setValue('discount_id', value)}
                              label='Discount Type'
                              labelKey={(item) => `${item.label} - ${formatCurrency(Number(item.amount), 'NGN')}`}
                              valueKey={'value'}
                              placeholder='Select discount type'
                              options={discounts?.data?.map((discount) => ({
                                label: discount.type,
                                value: discount.id.toString(),
                                amount: discount.amount
                              }))}
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
                      <div className='mt-16 w-[300px] self-end'>
                        <p className='font-medium mt-2 text-[#8B909A]'>
                          Subtotal (NGN):
                          {formatCurrency(Number(order?.total_amount) - Number(order?.delivery.dispatch?.delivery_price || '0'), "NGN")}
                        </p>
                        <p className='font-medium mt-2 text-[#8B909A]'>Delivery Fee: {formatCurrency(Number(order?.delivery.dispatch?.delivery_price) || 0, "NGN")}</p>
                        <p className='font-medium mt-2 text-red-500'>Discount: -{formatCurrency(Number(watch('custom_discount_amount') || selectedDiscountAmount) || 0, "NGN")}</p>
                        <p className='text-xl font-bold mt-6'>
                          Total (NGN):
                          {
                            formatCurrency(
                              Number(order?.total_amount) -
                              (watch('custom_discount_amount') || (Number(discounts?.data.find((discount) => discount.id.toString() == watch('discount_id'))?.amount) || 0)),
                              "NGN")
                          }
                        </p>
                      </div>
                    </section>
                  </form>
                </Form> */}

                <div className='mt-16 w-[300px] self-end'>
                  <p className='font-medium mt-2 text-[#8B909A]'>
                    Subtotal (NGN):
                    {formatCurrency(Number(order?.total_amount) - Number(order?.delivery.dispatch?.delivery_price || '0'), "NGN")}
                  </p>
                  <p className='font-medium mt-2 text-[#8B909A]'>Delivery Fee: {formatCurrency(Number(order?.delivery.dispatch?.delivery_price) || 0, "NGN")}</p>
                  <p className='font-medium mt-2 text-red-500'>Discount: -{formatCurrency(Number(order?.discount?.amount) || 0, "NGN")}</p>
                  {/* <p className='font-medium mt-2 text-red-500'>Discount: -{formatCurrency(Number(watch('custom_discount_amount') || selectedDiscountAmount) || 0, "NGN")}</p> */}
                  <p className='text-xl font-bold mt-6'>
                    Total (NGN): {
                      formatCurrency(
                        Number(order?.total_amount) -
                        (watch('custom_discount_amount') || (Number(discounts?.data.find((discount) => discount.id.toString() == watch('discount_id'))?.amount) || 0)),
                        "NGN")
                    }
                  </p>
                </div>
              </div>


              <div className='content-start'>
                <Card className='mb-6 border-none'>
                  <CardContent className='p-0'>
                    <div className='flex justify-between items-center mb-4 border-b py-3 px-6'>
                      <h2 className='font-semibold'>Delivery Details</h2>
                      <LinkButton href={`/order-management/orders/edit?order_id=${order?.id}#delivery-information-section`} variant='unstyled' size='sm'>
                        <Edit2 className='w-5 h-5 text-[#A0AEC0]' />
                      </LinkButton>
                    </div>
                    <div className='grid grid-cols-[max-content,1fr] gap-4 text-[0.75rem] px-4 pb-4 font-manrope'>
                      <p className="grid grid-cols-[subgrid] col-span-2 text-[#687588]">
                        Delivery Method:{' '}
                        <span className='font-semibold text-[#111827] font-manrope'>
                          Dispatch
                        </span>
                      </p>
                      <p className="grid grid-cols-[subgrid] col-span-2 text-[#687588]">
                        Primary address:{' '}
                        <span className='font-semibold text-[#111827] font-manrope'>
                          {order?.delivery.address}
                        </span>
                      </p>
                      <p className="grid grid-cols-[subgrid] col-span-2 text-[#687588]">
                        Residence Type:{' '}
                        <span className='font-semibold text-[#111827] font-manrope'>
                          {order?.delivery.residence_type}
                        </span>
                      </p>
                      <p className="grid grid-cols-[subgrid] col-span-2 text-[#687588]">
                        Delivery Fee:{' '}
                        <span className='font-semibold text-[#111827] font-manrope'>
                          {order?.delivery.dispatch?.location}{" "}
                          ({formatCurrency(Number(order?.delivery.dispatch?.delivery_price) || 0, 'NGN')})
                        </span>
                      </p>
                      <p className="grid grid-cols-[subgrid] col-span-2 text-[#687588]">
                        Delivery Zone:{' '}
                        <span className='font-semibold text-[#111827] font-manrope'>
                          {order?.delivery.zone}
                        </span>
                      </p>
                      <p className="grid grid-cols-[subgrid] col-span-2 text-[#687588]">
                        Dispatch Time: <span className='font-semibold text-[#111827] font-manrope'>
                          {!!order?.delivery.delivery_time ? formatTimeString(order?.delivery.delivery_time, 'hh:mma') : "-"}
                        </span>
                      </p>
                      <p className="grid grid-cols-[subgrid] col-span-2 text-[#687588]">
                        Delivey Date: <span className='font-semibold text-[#111827] font-manrope'>
                          {!!order?.delivery?.delivery_date ? format(order?.delivery?.delivery_date, 'dd-MMM-yyyy') : "-"}
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className='mb-6'>
                  <CardContent className='p-0'>

                    <div className='flex justify-between items-center mb-4 px-6 py-3 border-b'>
                      <h2 className='font-semibold'>Delivery Note</h2>
                      <LinkButton href={`/order-management/orders/edit?order_id=${order?.id}#delivery-information-section`} variant='unstyled' size='sm'>
                        <Edit2 className='w-5 h-5 text-[#A0AEC0]' />
                      </LinkButton>
                    </div>
                    <p className='text-sm text-gray-600 p-6 pt-0'>{
                      order?.delivery.note}</p>
                  </CardContent>
                </Card>
              </div>
            </section>


            <footer className="flex items-center justify-end gap-4 mb-10">
              <Button variant={"outline"} className="h-14 ml-auto px-16" onClick={openExportSummaryModal} disabled={isLoading} >
                Export
              </Button>
              <Button
                onClick={handleStatusUpdate}
                className='w-max bg-gray-900 hover:bg-gray-800 text-white px-8 '
                form="discount_form"
                variant="inputButton">
                Send For Processing
                {
                  (isUpdatingStatus || isAddingDiscount) && <Spinner />
                }
              </Button>
            </footer>

            {
              !!order &&
              <OrderSummaryExportModal
                isModalOpen={isExportSummaaryModalOpen}
                closeModal={closeExportSummaryModal}
                order={order!}
                discount={discounts?.data.find((discount) => discount.id.toString() == watch('discount_id'))}
              />
            }
          </div>
      }
    </>
  );
}