"use client";
import {
  Notepad2,
  Call,
  Calendar,
  Truck,
  Location,
  Link,
  TruckRemove,
  UserOctagon,
  Edit2,
} from "iconsax-react";
import { useParams } from "next/navigation";
import { format, formatDate } from "date-fns";
import React from "react";

import { Button, LinkButton } from "@/components/ui";
import { formatTimeString } from "@/utils/strings";

import OrderPageSkeleton from "./TrackOrderPageSkeleton";
import ProgressTimeline from "./ProgressTimeline";
import { useGeTOrderDetail } from "./misc/api";
import { formatCurrency } from "@/utils/currency";

const CompleteOrderPage = () => {
  const order_id = useParams()?.id as string;
  const { data: order, isLoading } = useGeTOrderDetail(order_id);

  const onDelivered = () => {
    console.log("Order successfully delivered!");
  };

  const orderItems = order?.items?.map((item) => item?.product_name).join(", ");

  if (isLoading) {
    return <OrderPageSkeleton />;
  }
  if (!isLoading && !order) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <h1 className="font4xl font-manrope font-medium">Order not found</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col grow h-full px-8">
      <header className="flex items-center border-b border-b-[#00000021] w-full pt-4">
        <p className="relative flex items-center gap-2 text-base text-[#111827] w-max p-1">
          <Notepad2 size={19} />
          Track order
          <span className="absolute h-[2px] w-full bottom-[-6px] left-0 bg-black" />
        </p>
      </header>
      {/* {
                !!order &&
                <section className="size-full my-auto flex flex-col items-center justify-center">
                    <ProgressTimeline
                        orderId={order?.id}
                        orderNumber={order?.order_number}
                        currentStatus={order?.delivery.status}
                        onDelivered={onDelivered}
                        order={order!}
                    />

                    <article className="grid grid-cols-[0.85fr,1fr] gap-5 justify-around p-4 px-6 border border-[#0F172B1A] rounded-3xl w-full max-w-[800px] mx-auto mt-9">
                        <section className="flex flex-col items-center justify-center gap-1 p-4 py-6 border border-black rounded-3xl">
                            <div className="flex items-center text-sm">
                                <Truck variant="Bold" size="24" className="mr-2" /> Driver
                            </div>
                            <div className="name text-[#194A7A] font-semibold text-2xl">
                                {order?.delivery.driver?.name || 'N/A'}                                
                            </div>
                            <div className="platform text-sm text-[#194A7A]">
                                Rider Platform: <a href="#" className="text-blue-400 underline">{order?.delivery.driver?.delivery_platform}</a>
                            </div>
                            <LinkButton className="mt-2 h-9 w-full text-sm max-w-[120px]" variant="black" size="md" href={`tel:${order?.delivery.driver?.phone_number}`}>
                                <Call size="20" className="mr-2" /> Call
                            </LinkButton>
                        </section>

                        <section className="flex flex-col items-center justify-around gap-4 p-4 border border-black rounded-3xl">
                            <div className="flex flex-col items-center font-poppins">
                                <p className="flex font-semibold text-[#292D32]">
                                    <Location size="24" className="mr-2" />
                                    Address
                                </p>
                                <p className="address text-sm">{order?.delivery?.address}</p>
                            </div>
                            <div className="flex flex-col items-center font-poppins">
                                <p className="flex font-semibold text-[#292D32]">
                                    <Calendar size="24" className="mr-2" />
                                    Date
                                </p>
                                <p className="text-sm">
                                    {formatDate(order?.delivery.delivery_date || '0', "dd/MMMM/yyyy")}
                                </p>
                            </div>
                        </section>
                    </article>

                  
                </section>
            } */}
      {!!order && (
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
                      )),
                    )}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between text-sm">
                  <span className="font-semibold tracking-wide">Quantity</span>
                  <span className="font-bold text-base">
                    {order?.items?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0}
                  </span>
                </div>
              </section>

              {/* ─── Driver Card (old UI behaviour) ──── */}
              <section className="flex flex-col items-center justify-center gap-1 border border-black rounded-3xl px-5 py-6 text-center">
                <div className="flex items-center text-sm mb-1 font-medium text-black">
                  <Truck
                    variant="Bold"
                    size="24"
                    className="mr-2"
                    color="#000000"
                  />{" "}
                  Driver
                </div>

                {!isLoading && !!order && order?.delivery?.driver?.name ? (
                  <>
                    <div className="font-medium text-lg md:text-xl opacity-70 text-black">
                      ID : {order?.delivery.driver?.id || "--"}
                    </div>
                    <p className="name text-[#194A7A] font-semibold text-xl md:text-2xl">
                      {order?.delivery.driver?.name}
                    </p>
                    <div className="platform text-xs font-medium md:text-sm text-[#194A7A] mt-1">
                      Rider Platform:{" "}
                      <a href="#" className="text-[#194A7A] underline">
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
                  <p className="text-sm text-gray-500 mt-2">
                    No driver assigned yet
                  </p>
                )}
              </section>

              {/* ─── Recipient / Address Card) ── */}
              <section className="flex flex-col justify-between border border-black rounded-3xl px-5 py-6">
                <div className="space-y-3 text-sm text-[#2D3748]">
                  <div className="flex items-start gap-2">
                    <UserOctagon
                      size="20"
                      className="mt-[2px]"
                      color="#292D32"
                    />
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
                              "dd, MMM yyyy",
                            )
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </article>
        </section>
      )}
    </div>
  );
};

export default CompleteOrderPage;
