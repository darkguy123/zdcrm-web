import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Button, LinkButton, Spinner } from "@/components/ui";
import { TProductInventoryItem, TProductVariation } from "../types/products";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Edit } from "lucide-react";
import { useBooleanStateControl } from "@/hooks";
import { ProductsInventoryUpdateModal } from ".";
import Image from "next/image";

interface OrderRowProps {
  product: TProductInventoryItem;
  refetch: () => void;
}

const OrderRow: React.FC<OrderRowProps> = ({ product, refetch }) => {
  const [selectedVariation, setSelectedVariation] =
    React.useState<TProductVariation | null>(null);
  const {
    state: isUpdateModalOpen,
    setTrue: openUpdateModal,
    setFalse: closeUpdateModal,
  } = useBooleanStateControl();

  const handleEditClick = (variation: TProductVariation) => {
    setSelectedVariation(variation);
    openUpdateModal();
  };
  return (
    <>
      {product.variations.map((variation, index) => (
        <TableRow key={`${product.id}-${index}`}>
          {index === 0 && (
            <>
              <TableCell rowSpan={product.variations.length}>
                {product.id}
              </TableCell>
              <TableCell
                rowSpan={product.variations.length}
                className="uppercase"
              >
                {product.category.name}
              </TableCell>
              <TableCell rowSpan={product.variations.length}>
                <div className="flex products-center space-x-2">
                  <Image
                    src={product.image_one || "/img/cake.png"}
                    alt={"product image"}
                    className="h-10 w-10 rounded object-cover text-[0.65rem] leading-tight bg-gray-300 lowercase"
                    width={40}
                    height={40}
                  />
                  <span>{product.name}</span>
                </div>
              </TableCell>
            </>
          )}
          <TableCell>
            {variation.size ? variation.size : variation.size}
          </TableCell>
          <TableCell>
            <div className="grid grid-cols-[1fr,max-content] products-center space-x-2">
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
          <TableCell>{variation.quantity_sold}</TableCell>
          <TableCell>{/* // */}</TableCell>
          <TableCell>{variation.location}</TableCell>
          <TableCell>{format(product.update_date, "dd-MMM-yyyy")}</TableCell>
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
                href={`/inventory/gifts/${product.id}?variation=${variation.id}`}
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
        <ProductsInventoryUpdateModal
          isModalOpen={isUpdateModalOpen}
          closeModal={closeUpdateModal}
          product={product}
          variation={selectedVariation}
          refetch={refetch}
        />
      )}
    </>
  );
};

interface ProductsInventoryTableProps {
  data?: TProductInventoryItem[];
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  refetch: () => void;
}
const ProductsInventory: React.FC<ProductsInventoryTableProps> = ({
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
      <div className="flex products-center justify-center w-full h-full min-h-[50vh] py-[10vh]">
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
        <div className="md:rounded-lg"></div>
        <Table>
          <TableHeader className="sticky top-0 z-50 bg-grey-1">
            <TableRow>
              <TableHead>Gift ID</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Gift Name</TableHead>
              <TableHead>Variation</TableHead>
              <TableHead>Quantity In Stock</TableHead>
              <TableHead>Re-order Required</TableHead>
              <TableHead>Cost Price/Unit</TableHead>
              <TableHead>Storage Location</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((product) => (
              <OrderRow
                key={product.id}
                product={product}
                refetch={refetch}
              />
            ))}
            {!isLoading && data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No products found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

      </div>
    </div>
  );
};

export default ProductsInventory;
