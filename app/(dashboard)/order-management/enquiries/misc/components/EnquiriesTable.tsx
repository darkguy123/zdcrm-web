import React, { useState } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBooleanStateControl } from "@/hooks";
import {
  Button,
  ConfirmActionModal,
  ConfirmDeleteModal,
  LinkButton,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spinner,
} from "@/components/ui";
import { ElipsisHorizontal } from "@/icons/core";

import { TEnquiry } from "../types";
import { useUpdateEnquiryStatus } from "../api";
import { formatAxiosErrorMessage } from "@/utils/errors";
import { useQueryClient } from "@tanstack/react-query";
import { Edit, FilterSearch, I3DRotate, Trash } from "iconsax-react";
import { ORDER_STATUS_COLORS } from "../../../misc/components/OrdersTable";
import { formatUniversalDate } from "@/utils/strings";
import { CATEGORIES_ENUMS, DELIVERY_ZONES_ENUMS } from "@/constants";
import { CaretDown } from "@phosphor-icons/react";

interface EnquiriesTableProps {
  data?: TEnquiry[];
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  type?: string;
  isFiltered?: boolean;
}

export const ENQUIRY_STATUS_COLORS: Record<string, string> = {
  STD: "bg-[#F4F0FF] text-[#8C62FF]",
  FND: "bg-[#E7F7EF] text-[#0CAF60]",
  CON: "bg-[#BF6A021C] text-[#BF6A02]",
  DEL: "bg-[#bf0f021c] text-[#bf3102]",
};

export const ENQUIRY_STATUS_ENUMS: Record<string, string> = {
  STD: "STARTED DISCUSSION",
  FND: "FINALIZED DISCUSSION",
  CON: "CONVERTED",
  DEL: "DELETED",
};

export default function EnquiriesTable({
  data,
  isLoading,
  isFetching,
  error,
  type = "active",
  isFiltered,
}: EnquiriesTableProps) {
  const [selectedEnquiry, setSelectedEnquiry] = useState<TEnquiry | null>(null);

  const handleOpen = (enquiry: TEnquiry) => {
    setSelectedEnquiry(enquiry);
  };

  const {
    state: isConfirmDeleteModalOpen,
    setTrue: openConfirmDeleteModal,
    setFalse: closeConfirmDeleteModal,
  } = useBooleanStateControl();

  const {
    state: isConfirmRestoreModalOpen,
    setTrue: openConfirmRestoreModal,
    setFalse: closeConfirmRestoreModal,
  } = useBooleanStateControl();
  const {
    state: isConfirmPermanentDeleteModalOpen,
    setTrue: openConfirmPermanentDeleteModal,
    setFalse: closeConfirmPermanentDeleteModal,
  } = useBooleanStateControl();


  const { mutate, isPending } = useUpdateEnquiryStatus();
  const queryClient = useQueryClient();
  const confirmUpdateEnquiryStatus = (status: "DEL" | "STD") => {
    if (selectedEnquiry) {
      mutate(
        { id: selectedEnquiry.id, status },
        {
          onSuccess: () => {
            toast.success("Enquiry deleted successfully");
            closeConfirmRestoreModal();
            closeConfirmDeleteModal();
          },
          onError: (error) => {
            const errorMessage = formatAxiosErrorMessage(
              error as unknown as any
            );
            toast.error(`Failed to delete enquiry : ${errorMessage}`);
          },
        }
      );
    }
  };
  const updateEnquiryStatus = (new_status: "STD" | "DEL" | "FND" | "CON") => {
    if (selectedEnquiry) {
      mutate(
        { id: selectedEnquiry?.id || 0, status: new_status },
        {
          onSuccess: () => {
            toast.success("Enquiry status updated successfully");
            queryClient.invalidateQueries({
              queryKey: ["enquiry-details"],
            });
          },
        }
      );
    }
  };

  const tableRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const checkForScrolling = React.useCallback(() => {
    requestAnimationFrame(() => {
      if (tableRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = tableRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
      }
    });
  }, []);

  React.useEffect(() => {
    const tableElement = tableRef.current;
    if (tableElement) {
      tableElement.addEventListener("scroll", checkForScrolling);
      window.addEventListener("resize", checkForScrolling);
      checkForScrolling();
    }

    return () => {
      if (tableElement) {
        tableElement.removeEventListener("scroll", checkForScrolling);
      }
      window.removeEventListener("resize", checkForScrolling);
    };
  }, [checkForScrolling]);

  React.useEffect(() => {
    checkForScrolling();
  }, [data, checkForScrolling]);

  const scrollTable = (direction: "left" | "right") => {
    if (tableRef.current) {
      const scrollAmount = 300;
      const currentScroll = tableRef.current.scrollLeft;
      const newScroll =
        direction === "left"
          ? currentScroll - scrollAmount
          : currentScroll + scrollAmount;

      tableRef.current.scrollTo({
        left: newScroll,
        behavior: "smooth",
      });

      setTimeout(checkForScrolling, 300);
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center w-full h-full min-h-[50vh] py-[10vh]">
        <Spinner />
      </div>
    );
  if (error) return <div>Error fetching data</div>;
  if (!data) return null;

  return (
    <div className="relative">
      <div className="flex items-center gap-4 h-3">
        <div className={cn("overflow-hidden rounded-full mb-1 grow")}>
          <div
            className={cn(
              "bg-[#F8F9FB] h-1 w-full overflow-hidden",
              isFetching && !isLoading && "bg-blue-200"
            )}
          >
            <div
              className={cn(
                "h-full w-full origin-[0_50%] animate-indeterminate-progress rounded-full bg-primary opacity-0 transition-opacity",
                isFetching && !isLoading && "opacity-100"
              )}
            ></div>
          </div>
        </div>
        <section className="flex items-center gap-2 shrink-0 px-5 -translate-y-full">
          <Button
            className="z-10 h-7 w-7"
            onClick={() => scrollTable("left")}
            variant="light"
            size="icon"
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            className="z-10 h-7 w-7"
            onClick={() => scrollTable("right")}
            variant="light"
            size="icon"
            disabled={!canScrollRight}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </section>
      </div>

      <div ref={tableRef} className="overflow-auto max-h-[600px] noscrollbar">
        <div className="md:rounded-lg">
          <Table>
            <TableHeader className="sticky top-0 z-30 bg-grey-1">
              <TableRow>
                <TableHead className="min-w-[150px]">Enquiry ID</TableHead>
                <TableHead className="min-w-[150px]">Delivery Zone</TableHead>
                <TableHead className="min-w-[175px] max-w-[500px]">
                  Delivery Date
                </TableHead>
                <TableHead className="min-w-[200px] max-w-[500px]">
                  Client Details
                </TableHead>
                <TableHead className="min-w-[230px]">Enquiry Items</TableHead>
                <TableHead className="min-w-[150px]">Category</TableHead>
                <TableHead className="min-w-[150px]">Status</TableHead>
                <TableHead className="min-w-[200px]">
                  Recipient Details
                </TableHead>
                <TableHead className="w-[170px]">Order Notes</TableHead>
                <TableHead className="min-w-[150px]">Created On</TableHead>
                <TableHead className="min-w-[150px]">
                  {type == "active" ? "Last Update" : "Deleted On"}
                </TableHead>
                <TableHead className=""></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((enquiry, index) => {
                return (
                  <TableRow key={enquiry.id}>
                    <TableCell className="">
                      <div className="font-medium !min-w-max">
                        {enquiry.enquiry_number ?? "--"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {enquiry.created_by?.name}
                      </div>
                    </TableCell>
                    <TableCell className="">
                      <div>
                        {enquiry?.delivery.zone
                          ? DELIVERY_ZONES_ENUMS[enquiry?.delivery.zone]
                          : "-"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {enquiry.branch?.name ?? ""}
                      </div>
                    </TableCell>
                    <TableCell className=" uppercase">
                      {formatUniversalDate(enquiry?.delivery.delivery_date)}
                    </TableCell>

                    <TableCell>
                      <div className="font-medium !min-w-max">
                        {enquiry.customer.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {enquiry.customer.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      {enquiry.items.map((item, idx) => (
                        <div key={idx} className="!min-w-max">
                          {item.product.name}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-max">
                        {enquiry.items?.map((item) => (
                          <Badge
                            key={item.id}
                            variant="outline"
                            className={cn(
                              "flex items-center justify-center bg-transparent text-[#A7A7A7] font-normal rounded-sm h-5 w-5"
                            )}
                          >
                            {CATEGORIES_ENUMS[item?.product?.category?.name]}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="min-w-full max-w-max grid grid-cols-[1fr,0.5fr] items-center ">
                        <Popover>
                          <PopoverTrigger className="flex items-center gap-1">
                            <Badge
                              className={cn(
                                ORDER_STATUS_COLORS[enquiry.status] ||
                                "bg-[#E7F7EF] text-[#0CAF60]",
                                "rounded-md w-max"
                              )}
                            >
                              {ENQUIRY_STATUS_ENUMS[enquiry.status]}
                              <CaretDown className="h-4 w-4" />
                            </Badge>
                            {isPending &&
                              selectedEnquiry?.id == enquiry?.id && (
                                <Spinner size={18} />
                              )}
                          </PopoverTrigger>
                          <PopoverContent className="flex flex-col gap-0.5 max-w-max p-2">
                            {[
                              { label: "Started Discussion", value: "STD" },
                              { label: "Finalized Discussion", value: "FND" },
                            ].map((option) => (
                              <button
                                key={option.value}
                                value={option.value}
                                onClick={() => {
                                  setSelectedEnquiry(enquiry);
                                  updateEnquiryStatus(
                                    option.value as
                                    | "STD"
                                    | "FND"
                                    | "CON"
                                    | "DEL"
                                  );
                                }}
                                className="py-1.5 px-3 hover:!bg-primary hover:!text-white cursor-pointer rounded-lg border hover:border-transparent text-xs"
                              >
                                {option.label}
                              </button>
                            ))}
                          </PopoverContent>
                        </Popover>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>{enquiry?.delivery?.recipient_name}</div>
                      <div className="text-sm text-gray-500">
                        {enquiry?.delivery?.recipient_phone}
                      </div>
                    </TableCell>

                    <TableCell className="w-max max-w-[350px] min-w-[180px]">
                      {enquiry.message?.substring(0, 50)}
                      {enquiry.message && enquiry.message.length > 50 && "..."}
                    </TableCell>

                    <TableCell className="">
                      {format(
                        new Date(enquiry.create_date),
                        "EEE, do MMMM yyyy"
                      )}
                    </TableCell>
                    <TableCell className="">
                      <div>
                        {format(
                          new Date(enquiry.update_date),
                          "EEE, do MMMM yyyy"
                        )}
                      </div>
                      {type !== "active" && (
                        <div className="text-sm text-gray-500">
                          {enquiry.deleted_by?.name}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="max-h-fit">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="p-0">
                            <ElipsisHorizontal className="h-6 w-6" />
                            {/* <span className="sr-only">Open menu</span> */}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="py-0 px-0 w-[235px]"
                        >
                          {type === "active" ? (
                            <>
                              <DropdownMenuItem>
                                <Link
                                  href={`./enquiries/edit?enquiry_id=${enquiry.id}`}
                                  className="w-full"
                                >
                                  <span className="flex items-center gap-2 pl-6 py-3">
                                    <Edit size={20} />
                                    Edit Enquiry
                                  </span>
                                </Link>
                              </DropdownMenuItem>

                              <DropdownMenuItem>
                                <Link
                                  href={`./enquiries/${enquiry.id}`}
                                  className="w-full"
                                >
                                  <span className="flex items-center gap-2 pl-6 py-3">
                                    <I3DRotate size={24} />
                                    Enquiry Details
                                  </span>
                                </Link>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onSelect={() => {
                                  setSelectedEnquiry(enquiry);
                                  openConfirmDeleteModal();
                                }}
                                className="cursor-pointer"
                              >
                                <span className="flex items-center gap-2 pl-6  py-3">
                                  <Trash size={24} />
                                  Delete Enquiry
                                </span>
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <>
                              <DropdownMenuItem
                                onSelect={() => {
                                  setSelectedEnquiry(enquiry);
                                  openConfirmRestoreModal();
                                }}
                                className="cursor-pointer"
                              >
                                <span className="flex items-center gap-2 pl-6  py-3">
                                  Restore Enquiry
                                </span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => {
                                  setSelectedEnquiry(enquiry);
                                  openConfirmPermanentDeleteModal();
                                }}
                                className="cursor-pointer"
                              >
                                <span className="flex items-center gap-2 pl-6  py-3">
                                  Delete Permanently
                                </span>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {data.length === 0 && !isFiltered && (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-[50vh] py-[10vh]">
          <Inbox size={60} />
          <div className="text-[#494949] text-center text-lg font-medium font-manrope max-w-sm text-balance">
            No Enquiry Found
          </div>
          <LinkButton
            href="./enquiries/new-enquiry"
            className="px-10 h-14 mt-4"
          >
            Create Enquiry
          </LinkButton>
        </div>
      )}
      {data.length === 0 && isFiltered && (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-[50vh] py-[10vh]">
          <FilterSearch size={60} />
          <div className="text-[#494949] text-center text-lg font-medium font-manrope max-w-sm text-balance">
            No enquiries match your filters. Clear filters and try again
          </div>
        </div>
      )}
      <ConfirmDeleteModal
        isModalOpen={isConfirmDeleteModalOpen}
        closeModal={closeConfirmDeleteModal}
        deleteFn={() => confirmUpdateEnquiryStatus("DEL")}
        isDeleting={isPending}
        heading="Delete Enquiry"
        subheading="This action means order enquiry be removed."
      />
      <ConfirmDeleteModal
        isModalOpen={isConfirmPermanentDeleteModalOpen}
        closeModal={closeConfirmPermanentDeleteModal}
        deleteFn={() => { }}
        isDeleting={isPending}
        customTitleText="Confirm Permanent Delete"
        heading="Delete Permanently"
        subheading="Warning, this action is irreversible and all data relating to this enquiry will be lost forever."
      />
      <ConfirmActionModal
        isModalOpen={isConfirmRestoreModalOpen}
        closeModal={closeConfirmRestoreModal}
        confirmFn={() => confirmUpdateEnquiryStatus("STD")}
        heading="Restore Enquiry"
        isConfirming={isPending}
        subheading="This action will restore this enquiry and add it to the enquiry list."
      />
    </div>
  );
}
