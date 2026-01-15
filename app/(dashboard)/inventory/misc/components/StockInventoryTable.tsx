"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, LinkButton, Spinner } from "@/components/ui";
import { TStockInventoryItem, TStockVariation } from "../types/stock";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Edit } from "lucide-react";
import { useBooleanStateControl } from "@/hooks";
import { StockInventoryUpdateModal } from ".";
import Image from "next/image";

interface StockRowProps {
  item: TStockInventoryItem;
  refetch: () => void;
}

const StockRow: React.FC<StockRowProps> = ({ item, refetch }) => {
  const [selectedVariation, setSelectedVariation] =
    React.useState<TStockVariation | null>(null);
  const {
    state: isUpdateModalOpen,
    setTrue: openUpdateModal,
    setFalse: closeUpdateModal,
  } = useBooleanStateControl();

  const handleEditClick = (variation: TStockVariation) => {
    setSelectedVariation(variation);
    openUpdateModal();
  };
  return (
    <>
      {item.variations.map((variation, index) => (
        <TableRow key={`${item.id}-${index}`}>
          {index === 0 && (
            <>
              <TableCell rowSpan={item.variations.length}>{item.id}</TableCell>
              <TableCell rowSpan={item.variations.length} className="uppercase">
                {item.category.name}
              </TableCell>
              <TableCell rowSpan={item.variations.length}>
                <div className="flex items-center space-x-2">
                  <Image
                    src={item.image_one || "/img/cake.png"}
                    alt={"product image"}
                    className="h-10 w-10 rounded object-cover text-[0.65rem] leading-tight bg-gray-300 lowercase"
                    width={40}
                    height={40}
                  />
                  <span>{item.name}</span>
                </div>
              </TableCell>
            </>
          )}
          <TableCell>
            {(variation.size ? variation.size + "inches" : variation.size) ||
              variation.color ||
              variation.flavour}
          </TableCell>

          <TableCell>
            <div className="grid grid-cols-[1fr,max-content] items-center space-x-2">
              <span>{variation.quantity} In Stock</span>
              {variation.quantity <= 5 ? (
                <div className="relative h-full min-h-6 max-h-16 w-1.5 rounded-full bg-red-100">
                  <div className="absolute h-1/2 bottom-0 min-h-2 max-h-12 w-1.5 rounded-full bg-red-500"></div>
                </div>
              ) : (
                ""
              )}
            </div>
          </TableCell>
          <TableCell>{variation.location || "N/A"}</TableCell>
          <TableCell>{variation.quantity_sold}</TableCell>
          <TableCell>{format(item.update_date, "dd-MMM-yyyy")}</TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Button
                variant="unstyled"
                size="sm"
                onClick={() => handleEditClick(variation)}
                className="h-8 w-full p-0 font-medium flex items-center gap-1.5 hover:bg-gray-200 rounded-full px-2.5"
              >
                Edit
                <Edit className="h-4 w-4" />
              </Button>
              <LinkButton
                href={`/inventory/stock/${item.id}?variation=${variation.id}`}
                variant="unstyled"
                className=""
                size="sm"
              >
                {">>"}
              </LinkButton>
            </div>
          </TableCell>
        </TableRow>
      ))}
      {selectedVariation && (
        <StockInventoryUpdateModal
          isModalOpen={isUpdateModalOpen}
          closeModal={closeUpdateModal}
          stock={item}
          variation={selectedVariation}
          refetch={refetch}
        />
      )}
    </>
  );
};

interface StockInventoryTableProps {
  data?: TStockInventoryItem[];
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  refetch: () => void;
}

const StockInventoryTable: React.FC<StockInventoryTableProps> = ({
  data,
  isLoading,
  isFetching,
  error,
  refetch,
}) => {
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
                <TableHead>Stock Item ID</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock Item</TableHead>
                <TableHead>Variation</TableHead>
                <TableHead>Quantity In Stock</TableHead>
                <TableHead>Storage Location</TableHead>
                {/* <TableHead>Reorder Required</TableHead> */}
                <TableHead>Quantity Sold</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <StockRow key={item.id} item={item} refetch={refetch} />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default StockInventoryTable;
