'use client'
import { useParams } from 'next/navigation'
import React from 'react'
import Image from "next/image";
import { format } from "date-fns";


import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { CaretLeft } from "@phosphor-icons/react";
import { EditPenIcon } from "@/icons/core";
import ConfirmActionModal from "@/components/ui/confirmActionModal";
import { useBooleanStateControl } from "@/hooks";
import { LinkButton, Spinner, SuccessModal } from "@/components/ui";
import { convertKebabAndSnakeToTitleCase, formatTimeString } from '@/utils/strings';

import EnquiryDiscussCard from '../misc/components/EnquiryDiscussCard';
import { ConfirmPaymentModal } from '../misc/components';
import { useGetEnquiryDetail } from '../misc/api'
import { formatCurrency } from '@/utils/currency';
import { Edit } from 'lucide-react';


const EnquiryDetailsPage = () => {
    const enquiry_id = useParams().id
    const { data, isLoading, refetch } = useGetEnquiryDetail(enquiry_id as string)

    // console.log(data)

    const discount_amount = Number(data?.discount || '0');
    const customDiscountAmount = Number(data?.custom_discount_amount || '0');
    const subtotal = Number(data?.total_selling_price || 0);
    const deliveryFee = Number(data?.delivery?.dispatch?.delivery_price) || 0;
    const total = Number(data?.total_amount || 0) - (discount_amount || customDiscountAmount) + deliveryFee;
    const tax = total - subtotal - deliveryFee;


    const {
        state: isConfirmModalOpen,
        setTrue: openConfirmModal,
        setFalse: closeConfirmModal,
    } = useBooleanStateControl();




    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <Spinner />
            </div>
        )
    }

    return (
        <div className="w-full md:w-[92.5%] max-w-[1792px] mx-auto p-4 space-y-9 ">
            <header className="flex items-center mb-6 gap-4">
                <LinkButton
                    href="/order-management/enquiries"
                    variant="ghost"
                    size="icon"
                    className="mr-2"
                >
                    <CaretLeft className="h-6 w-6 text-[#A0AEC0]" />
                </LinkButton>
                <h1 className="text-xl font-semibold font-manrope">Enquiry Summary</h1>
                <LinkButton
                    href={`./edit?enquiry_id=${data?.id}`}
                    className="w-max ml-auto"
                    size={"thin"}
                >
                    <span className="flex items-center gap-2 py-3">
                        <Edit size={20} />
                        Edit
                    </span>
                </LinkButton>
            </header>

            <div className="flex items-start gap-8">
                <Card className="w-full max-w-[518px] rounded-xl px-6 py-4">
                    <header className="flex justify-between items-center">
                        <h2 className="font-semibold font-manrope text-sm">
                            Customer Details
                        </h2>
                        <LinkButton href={`./edit?enquiry_id=${enquiry_id}`} variant="unstyled" className='!p-0'>
                            <EditPenIcon className="h-5 w-5 text-[#A0AEC0]" />
                        </LinkButton>
                    </header>
                    <Separator />

                    <div className="flex flex-col justify-between px-0 py-6">
                        <div className=" space-y-3">
                            <div className="flex items-center gap-1">
                                <h2 className="text-sm font-medium text-[#687588]">
                                    Customer Name:
                                </h2>
                                <p className="font-medium text-custom-blue">
                                    {data?.customer?.name}
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
                                <h2 className="text-sm font-medium text-[#687588]">Email:</h2>
                                <p className="font-medium text-custom-blue">{data?.customer?.email}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <h2 className="text-sm font-medium text-[#687588]">
                                    Phone Number:
                                </h2>
                                <p className="font-medium text-custom-blue">{data?.customer?.phone}</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center gap-1 mt-4">
                            <div className="flex items-center gap-1">
                                <p className="text-sm font-medium text-[#687588]">
                                    Enquiry Occasion:
                                </p>
                                <p className="font-medium text-custom-blue">
                                    {data?.enquiry_occasion}
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
                                <p className="text-sm font-medium text-[#687588]">
                                    Enquiry Channel:
                                </p>
                                <p className="font-medium text-custom-blue">{data?.enquiry_channel}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="flex flex-col w-96 space-y-4 ">
                    <Card className="flex-1 space-y-4 p-5 rounded-xl">
                        <div className="flex justify-between items-center">
                            <h2 className="font-semibold font-manrope text-sm">
                                Delivery Details
                            </h2>
                            <LinkButton href={`./edit?enquiry_id=${enquiry_id}`} variant="unstyled" className='!p-0'>
                                <EditPenIcon className="h-5 w-5 text-[#A0AEC0]" />
                            </LinkButton>
                        </div>

                        <Separator />

                        <div className="flex items-center gap-5">
                            <h3 className="text-sm text-gray-500">Delivery Date</h3>
                            <p className="text-[0.825rem] font-manrope">
                                {format(new Date(data?.delivery.delivery_date || 0), "dd-MMM-yyyy")}
                            </p>
                        </div>
                    </Card>

                    <Card className="flex-1 space-y-2 p-5 rounded-xl">
                        <div className="flex justify-between items-center">
                            <h2 className="font-semibold font-manrope text-sm">
                                Delivery Note
                            </h2>
                            {/* <p className="text-[0.825rem] font-manrope">
                                {data?.delivery.note}
                            </p> */}
                        </div>

                        <Separator />

                        <div className="flex items-center gap-5">
                            <h3 className="text-sm text-gray-500">Delivery Note</h3>
                            <p className="text-[0.825rem] font-manrope">{data?.delivery.note}</p>
                        </div>
                    </Card>
                </div>

                <Card className="space-y-2 p-5 rounded-xl w-60">
                    <header className="flex justify-between items-center">
                        <h2 className="font-semibold font-manrope text-sm">
                            Dispatch Time
                        </h2>
                        <LinkButton href={`./edit?enquiry_id=${enquiry_id}#delivery`} variant="unstyled" className='!p-0'>
                            <EditPenIcon className="h-5 w-5 text-[#A0AEC0]" />
                        </LinkButton>
                    </header>

                    <Separator />

                    <div className="flex items-center gap-5">
                        <p className="text-[0.825rem] font-manrope">
                            {!!data?.delivery.delivery_time ? formatTimeString(data?.delivery.delivery_time, 'hh:mma') : "-"}
                        </p>
                    </div>
                </Card>
            </div>

            <Accordion
                type="single"
                collapsible
                className="w-full"
                defaultValue="item-1"
            >
                <AccordionItem value="item-1">
                    <AccordionTrigger className="">
                        <div className="flex items-center gap-5">
                            <div className="h-10 w-10 flex items-center justify-center bg-custom-white rounded-full">
                                <Image src="/img/book.svg" alt="" width={24} height={24} />
                            </div>
                            <p className="text-custom-blue font-medium">Items</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-8">
                        {
                            data?.items.map((item, index) => {
                                const itemCategory = item.inventories[0]?.stock_inventory?.category.name || item.inventories[0]?.product_inventory?.category.name
                                const placeHolderImage = `/img/placeholders/${itemCategory}.svg`

                                return (
                                    <Card className="py-6 px-10 rounded-xl max-w-2xl" key={index}>
                                        <div className="flex items-center justify-between">
                                            <h2 className="font-semibold mb-4 text-sm font-manrope">
                                                Item {index + 1}
                                            </h2>
                                            {/* <EditPenIcon className="h-5 w-5 text-[#A0AEC0] cursor-pointer" /> */}
                                        </div>

                                        <Separator className="mb-2" />

                                        <div className="flex gap-10">
                                            <div className="flex flex-col shrink-0">
                                                <div className="bg-white-grey rounded-[6px] w-fit">
                                                    <Image
                                                        src={item.product.image || placeHolderImage}
                                                        alt={item.product.name || "Product"}
                                                        className="w-24 h-24 object-cover rounded-md p-2 text-xxs"
                                                        width={100}
                                                        height={100}
                                                    />
                                                </div>

                                                <p className="text-custom-blue font-medium text-sm max-w-[150px] text-balance">
                                                    {item.product?.name || item.inventories[0]?.stock_inventory?.name}
                                                </p>
                                            </div>
                                            <div className="space-y-3 text-sm">
                                                <div className="flex items-center gap-x-5 gap-y-2 flex-wrap">
                                                    <p className="flex items-center gap-1 text-[#111827] font-medium">
                                                        <span className="text-[#687588]">Quantity:</span> {item.quantity} pcs
                                                    </p>
                                                    <p className="flex items-center gap-1 text-[#111827] font-medium">
                                                        <span className="text-[#687588]">Category:</span> {item.inventories[0]?.stock_inventory?.category.name || item.inventories[0]?.product_inventory?.category.name}

                                                    </p>
                                                    <p className="flex items-center gap-1 text-[#111827] font-medium">
                                                        <span className="text-[#687588]">Size:</span> {item.inventories[0]?.variations[0]?.variation_details?.size}
                                                    </p>
                                                    <p className="flex items-center gap-1 text-[#111827] font-medium">
                                                        <span className="text-[#687588]">Layers:</span> {item.product_variation?.layer}
                                                    </p>
                                                </div>
                                                {
                                                    item.inventories[0]?.variations[0]?.variation_details?.flavour &&
                                                    <p className="text-[#111827] font-medium">
                                                        <span className="text-[#687588]">Flavour:</span>{" "}
                                                        {item.inventories[0]?.variations[0]?.variation_details?.flavour}
                                                    </p>
                                                }
                                                <div className="grid gap-1">
                                                    {item.properties.map((property, index) => (
                                                        <div key={index}>
                                                            {Object.entries(property).map(([key, value]) => {
                                                                if (key === "id" || !value) return null

                                                                const displayValue = typeof value === "object" && value !== null ? value.name : value

                                                                return (
                                                                    <p key={key} className="text-[#111827] font-medium">
                                                                        <span className="text-[#687588]">{convertKebabAndSnakeToTitleCase(key)}:</span> {displayValue}
                                                                    </p>
                                                                )
                                                            })}
                                                        </div>
                                                    ))}
                                                </div>


                                                <p className="text-[#111827] font-medium">
                                                    <span className="text-[#687588]">Message {item.product.category.name == "Cake" && "on cake"}:</span>{" "}
                                                    {data?.message}
                                                </p>

                                                <p className="text-[#111827] font-medium">
                                                    <span className="text-[#687588]">Branch:</span>{" "}
                                                    {data?.branch?.name}
                                                </p>

                                            </div>
                                        </div>

                                        <Separator className="mt-7 mb-4" />

                                        <div className="flex items-end justify-end mb-3 w-full">
                                            <p className="font-semibold text-[#194A7A]">Amount: </p>
                                            <p className="font-semibold text-[#194A7A]">
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
                                                                        Number(property.bouquet_selling_at_order || 0) +
                                                                        Number(property.glass_vase_selling_at_order || 0) +
                                                                        Number(property.toppings_selling_at_order || 0) +
                                                                        Number(property.layers_selling_at_order || 0) +
                                                                        Number(property.whipped_cream_selling_at_order || 0);
                                                                    return acc + value;
                                                                }, 0)
                                                            ) * Number(item.quantity || 0),
                                                            'NGN'
                                                        )
                                                    }
                                                </span>
                                            </p>
                                        </div>
                                    </Card>

                                )
                            })
                        }

                        <div className="flex justify-end">
                            <div className="w-full divide-y">
                                <div className="flex justify-between py-1.5 px-4">
                                    <span className="text-[#8E8E8E]">Sub total</span>
                                    <span>{formatCurrency(subtotal, 'NGN')}</span>
                                </div>
                                {/* <div className="flex justify-between py-1.5 px-4">
                                           <span className="text-[#8E8E8E]">Tax</span>
                                           <span>{formatCurrency(tax, 'NGN')}</span>
                                       </div> */}
                                <div className="flex justify-between py-1.5 px-4">
                                    <span className="text-[#8E8E8E]">Discount</span>
                                    <span className="text-red-500">-{formatCurrency(discount_amount || customDiscountAmount, 'NGN')}</span>
                                </div>
                                <div className="flex justify-between pt-1.5 pb-5 px-4">
                                    <span className="text-[#8E8E8E]">Delivery Fee</span>
                                    <span>{formatCurrency(deliveryFee, 'NGN')}</span>
                                </div>
                                <div className="flex justify-between font-semibold text-lg border-t border-t-[#31A5F9] pt-2 mt-3">
                                    <span>Total</span>
                                    <span>{formatCurrency(total, 'NGN')}</span>
                                </div>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            <Accordion
                type="single"
                collapsible
                className="w-full"
                defaultValue="item-1"
            >
                <AccordionItem value="item-1">
                    <AccordionTrigger className="">
                        <div className="flex items-center gap-5">
                            <div className="h-10 w-10 flex items-center justify-center bg-custom-white rounded-full">
                                <Image src="/img/book.svg" alt="" width={24} height={24} />
                            </div>
                            <p className="text-custom-blue font-medium">Discussion</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <EnquiryDiscussCard
                            isExpanded
                            discussions={data?.discussions}
                            enquiry={data}
                            refetch={refetch}
                        />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>


            <div className="flex justify-end py-8">
                {
                    (data?.status === "STD" || data?.status === "FND") &&
                    <Button variant="black" onClick={openConfirmModal} size="lg">
                        Confirm for processing
                    </Button>
                }
            </div>

            <Separator />

            <footer className="flex items-center justify-between w-full text-sm text-gray-500 mb-8">
                {
                    data?.status === "STD" ? (
                        <p className="text-black font-medium font-poppins">
                            Enquiry Logged by: {data?.created_by?.name}
                        </p>

                    )
                        :
                        data?.status === "FND" ?
                            (
                                <p className="text-black font-medium font-poppins">
                                    Enquiry Finalized by: {data?.finalized_by?.name}
                                </p>
                            )
                            :
                            (
                                <p className="text-black font-medium font-poppins">
                                    Enquiry Confimed by: {data?.converted_by?.name}
                                </p>
                            )
                }
                <p className="text-black font-medium font-poppins">
                    Placed on: {format(new Date(data?.create_date || 0), "do MMMM, yyyy | h:mmaaa")}
                </p>
            </footer>

            {
                data &&
                <ConfirmPaymentModal
                    isModalOpen={isConfirmModalOpen}
                    closeModal={closeConfirmModal}
                    enquiryId={enquiry_id as string}
                    total_amount_due={Number(data?.total_production_cost || 0)}
                />
            }
        </div>
    )
}

export default EnquiryDetailsPage