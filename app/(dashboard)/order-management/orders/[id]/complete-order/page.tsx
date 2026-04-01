"use client";
import { Notepad2, ArrowLeft2, UserOctagon, Call, Calendar, Truck, Location, Link as LinkIcon, TruckRemove, Edit2, ArrowRight2 } from 'iconsax-react';
import React from 'react';
import { Button, LinkButton } from '@/components/ui';
import { useParams, useRouter } from 'next/navigation';
import ProgressTimeline from './ProgressTimeline';
import { useGeTOrderDetail, useUpdateDeliveryStatus } from '../../../misc/api';
import { formatTimeString } from '@/utils/strings';
import OrderPageSkeleton from './CompleteOrderPageSkeleton';
import { format, formatDate } from 'date-fns';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils/currency';
import Link from 'next/link';

const CompleteOrderPage = () => {
    const order_id = useParams()?.id as string;
    const { data: order, isLoading } = useGeTOrderDetail(order_id);


    const router = useRouter();
    const goBack = () => {
        router.push('./confirm-delivery');
    }

    const onDelivered = () => {
        console.log("Order successfully delivered!");
        // Add any additional logic here
    };

    const { mutate: updateStatus } = useUpdateDeliveryStatus(order_id);
    const handleStatusUpdate = (status: string) => {
        updateStatus({ id: order_id, status });
    };

    const copyDeliveryLink = () => {
        if (typeof window !== "undefined") {
            const baseUrl = window.location.origin;
            navigator.clipboard.writeText(`${baseUrl}/track-order/${encodeURIComponent(order?.order_number ?? '')}`);
            toast.success("Delivery link copied to clipboard");
        }
    };

    const orderItems = order?.items
        ?.map(item => item.product?.name)
        .join(", ");


    if (isLoading) {
        return <OrderPageSkeleton />;
    }

    return (
        <div className="flex flex-col grow min-h-full px-8 pb-8">
            <header className="flex justify-between border-b border-b-[#00000021] w-full pt-4">
                <div className='flex items-center'>
                    <Button
                        variant='ghost'
                        size='icon'
                        className='mr-2'
                        onClick={() => goBack()}>
                        <ArrowLeft2 className='h-6 w-6 text-[#A0AEC0]' />
                    </Button>
                    <p className='relative flex items-center gap-2 text-base text-[#111827] w-max p-1'>
                        <Notepad2 size={19} />
                        Complete order
                        <span className="absolute h-[2px] w-full bottom-[-6px] left-0 bg-black" />
                    </p>
                </div>
                <Link
                    className='flex items-center gap-1 font-medium'
                    href='/order-management/delivery'>
                    Back to Delivery
                    <ArrowRight2 className='h-6 w-6 text-[#A0AEC0]' />
                </Link>
            </header>
            {
                !!order &&
                <section className="size-full my-auto pt-12 flex flex-col items-center justify-center">
                    <ProgressTimeline
                        orderId={order?.id}
                        orderNumber={order?.order_number}
                        currentStatus={order?.delivery.status}
                        onDelivered={onDelivered}
                        order={order!}
                    />

                    <article className="w-full max-w-[1000px] mx-auto mt-9 border border-[#D9D9D9] rounded-3xl px-6 py-5">
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-5">
                            {/* ─── Order Card (from “new UI”) ─────────────────────────────── */}
                            <section className="flex flex-col gap-4 justify-between border border-black rounded-3xl px-5 py-6">
                                <div>
                                    <div className="flex items-center text-sm mb-3 text-[#4A5568]">
                                        <Notepad2 size="20" className="mr-2" color="#292D32" />
                                        <span className="font-medium text-black">Order</span>
                                    </div>

                                    <div className="space-y-1 text-base text-[#0F172B] font-semibold pl-2">
                                        {orderItems}
                                        {order?.items?.flatMap((item, index) =>
                                            item.miscellaneous?.map((misc, miscIndex) => (
                                                <p key={`misc-${index}-${miscIndex}`}>
                                                    {misc.description}
                                                </p>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="mt-5 flex items-center justify-between text-sm">
                                    <span className="font-semibold tracking-wide">TOTAL</span>
                                    <span className="text-[#E11D28] font-bold text-base">
                                        {formatCurrency(Number(order?.total_amount) || 0, 'NGN')}
                                    </span>
                                </div>
                            </section>

                            {/* ─── Driver Card (old UI behaviour) ──── */}
                            <section className="flex flex-col items-center justify-center gap-1 border border-black rounded-3xl px-5 py-6 text-center">
                                <div className="flex items-center text-sm mb-1 font-medium text-black">
                                    <Truck variant="Bold" size="24" className="mr-2" color="#000000" />{" "}
                                    Driver
                                </div>

                                {!isLoading && !!order && order?.delivery?.driver?.name ? (
                                    <>
                                        <div className="font-medium text-lg md:text-xl opacity-70 text-black">
                                            ID : {order?.delivery.driver?.id || '--'}
                                        </div>
                                        <p className="name text-[#194A7A] font-semibold text-xl md:text-2xl">
                                            {order?.delivery.driver?.name}
                                        </p>
                                        <div className="platform text-xs font-medium md:text-sm text-[#194A7A] mt-1">
                                            Rider Platform:{" "}
                                            <a
                                                href="#"
                                                className="text-[#194A7A] underline"
                                            >
                                                {order?.delivery.driver?.delivery_platform}
                                            </a>
                                        </div>
                                        <div className="font-medium text-sm md:text-lg mt-1 opacity-70 text-black">
                                            Phone No :{" "}
                                            <a
                                                href={`tel:${order?.delivery.driver?.phone_number}`}
                                                className="text-black no-underline"
                                            >
                                                {order?.delivery.driver?.phone_number}
                                            </a>
                                        </div>
                                    </>
                                ) : (
                                    <LinkButton
                                        className="mt-2 h-9 w-full text-sm max-w-[190px]"
                                        variant="black"
                                        size="md"
                                        href={`confirm-delivery`}
                                    >
                                        <Edit2 size="20" className="mr-2" /> Edit Driver Details
                                    </LinkButton>
                                )}
                            </section>

                            {/* ─── Recipient / Address Card) ── */}
                            <section className="flex flex-col justify-between border border-black rounded-3xl px-5 py-6">
                                <div className="space-y-3 text-sm text-[#2D3748]">
                                    <div className="flex items-start gap-2">
                                        <UserOctagon size="20" className="mt-[2px]" color="#292D32" />
                                        <div>
                                            <p className="font-semibold text-xs uppercase tracking-wide text-[#292D32]">
                                                Recipient Name
                                            </p>
                                            <p className="font-medium text-sm text-[#1A202C]">
                                                {order?.delivery?.recipient_name ?? "—"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <Call size="20" className="mt-[2px]" color="#292D32" />
                                        <div>
                                            <p className="font-semibold text-xs uppercase tracking-wide text-[#292D32]">
                                                Recipient Phone
                                            </p>
                                            <p className="font-medium text-sm text-[#1A202C]">
                                                {order?.delivery?.recipient_phone ?? "—"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <Location size="20" className="mt-[2px]" color="#292D32" />
                                        <div>
                                            <p className="font-semibold text-xs uppercase tracking-wide text-[#292D32]">
                                                Address
                                            </p>
                                            <p className="text-sm font-medium text-[#1A202C]">
                                                {order?.delivery?.address ?? "—"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <Truck size="20" className="mt-[2px]" color="#292D32" />
                                        <div>
                                            <p className="font-semibold text-xs uppercase tracking-wide text-[#292D32]">
                                                Delivery Zone
                                            </p>
                                            <p className="text-sm font-medium text-[#1A202C]">
                                                {order?.delivery?.zone ?? "—"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <Calendar size="20" className="mt-[2px]" color="#292D32" />
                                        <div>
                                            <p className="font-semibold text-xs uppercase tracking-wide text-[#292D32]">
                                                Expected Date
                                            </p>
                                            <p className="text-sm font-medium text-[#1A202C]">
                                                {order?.delivery?.delivery_date
                                                    ? format(
                                                        new Date(order.delivery.delivery_date),
                                                        "dd, MMM yyyy"
                                                    )
                                                    : "—"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </article>


                    {/* Share Delivery Link Section */}
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button className="px-8 h-14" onClick={copyDeliveryLink}>
                            <LinkIcon size="24" className="mr-2" /> Share Delivery Link
                        </Button>
                        <Button variant="destructive" className="px-8 h-14" onClick={() => handleStatusUpdate("CANCELLED")}>
                            <TruckRemove size="24" className="mr-2" /> Cancel Order
                        </Button>
                    </div>
                </section>

            }
        </div>
    )
}

export default CompleteOrderPage

