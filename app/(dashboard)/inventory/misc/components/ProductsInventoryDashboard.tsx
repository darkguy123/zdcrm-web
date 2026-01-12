"use client";

import React, { useState } from "react";
import { Search, RefreshCcw, Circle } from "lucide-react";

import {
  Input,
  SelectSingleCombo,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
  RangeAndCustomDatePicker,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
  MenubarItem,
  MenubarTrigger,
  MenubarMenu,
  Menubar,
  MenubarContent,
} from "@/components/ui";
import { Button } from "@/components/ui";
import TabBar from "@/components/TabBar";
import { useDebounce } from "@/hooks";
import { useGetAllBranches } from "@/app/(dashboard)/admin/businesses/misc/api";

import ProductsInventoryTable from "./ProductsInventoryTable";
import { useGetProductCategories, useGetProductsInventory } from "../api";
import NewProductInventorySheet from "./ProductsInventoryNew";
import { useForm } from "react-hook-form";
import { subMonths } from "date-fns";
import { DateRange } from "react-day-picker";
import { ArrowDown2, Calendar, Category2, Check, Shop } from "iconsax-react";
import { STORAGE_LOCATION_OPTIONS } from "@/constants";

export default function ProductsInventoryDashboard() {
  const { data: branches, isLoading: branchesLoading } = useGetAllBranches();
  const { data: categories, isLoading: categoriesLoading } =
    useGetProductCategories();

  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selectedCategory, setSelectedCategory] = useState<
    number | undefined
  >();
  const [selectedBranch, setSelectedBranch] = useState<number | undefined>();
  const [selectedLocation, setSelectedLocation] = useState("");

  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const monthsAgo = subMonths(new Date(), 20);

  const { control, watch, setValue } = useForm<{
    branch?: string;
    date: DateRange;
    period: "today" | "week" | "month" | "year" | "custom";
  }>({
    defaultValues: {
      branch: "all",
      date: {
        from: monthsAgo,
        to: tomorrow,
      },
      period: "today",
    },
  });

  const { data, isLoading, isFetching, error, refetch } =
    useGetProductsInventory({
      page: currentPage,
      size: pageSize,
      search: debouncedSearchText,
      category: selectedCategory,
      branch: selectedBranch,
      location: selectedLocation,
      date_from: watch("date").from?.toISOString().split("T")[0],
      date_to: watch("date").to?.toISOString().split("T")[0],
      period: watch("period"),
    });

  const handleRefresh = () => {
    refetch();
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    setCurrentPage(1);
  };

  const handleBranchChange = (branch: number) => {
    setSelectedBranch(branch);
    setCurrentPage(1);
  };

  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedBranch(undefined);
    setSelectedCategory(undefined);
    setSearchText("");
    setSelectedLocation("");
    setCurrentPage(1);
  };

  return (
    <div className='flex flex-col gap-4 w-full md:w-[92.5%] max-w-[1792px] mx-auto py-6'>
      <header className='flex justify-between items-center gap-4'>
        <div className="flex items-center gap-2 w-80 grow">
          <Input
            type="text"
            placeholder="Search by product name or inventory number"
            className="w-full focus:border min-w-[350px] text-xs !h-10"
            value={searchText}
            onChange={handleSearch}
            rightIcon={<Search className="h-5 w-5 text-[#8B909A]" />}
          />
          <Menubar className="!p-0">
            <MenubarMenu>
              <MenubarTrigger className="relative flex items-center gap-4 text-xs cursor-pointer text-[#8B909A] !h-10">
                Filter orders by <ArrowDown2 size={16} />
                {(selectedCategory || debouncedSearchText) && (
                  <Circle
                    size={10}
                    className="absolute top-0 right-0 text-[#FF4D4F] bg-[#FF4D4F] rounded-full"
                  />
                )}
              </MenubarTrigger>
              <MenubarContent>
                <MenubarSub>
                  <MenubarSubTrigger className="py-3 flex items-center gap-2">
                    <Calendar size={18} />
                    Date Range
                    {watch("date.from") &&
                      watch("date.to") &&
                      (watch("date.from")?.getTime() !==
                        monthsAgo.getTime() ||
                        watch("date.to")?.getTime() !==
                        tomorrow.getTime()) && (
                        <Circle
                          size={6}
                          className="absolute top-0 right-0 text-[#FF4D4F] bg-[#FF4D4F] rounded-full"
                        />
                      )}
                  </MenubarSubTrigger>
                  <MenubarSubContent>
                    <RangeAndCustomDatePicker
                      className="max-w-max"
                      variant="light"
                      size="thin"
                      onChange={(value) => {
                        if (
                          value.dateType === "custom" &&
                          value.from &&
                          value.to
                        ) {
                          setValue("date", {
                            from: value.from,
                            to: value.to,
                          });
                          setValue("period", "custom");
                        } else {
                          setValue(
                            "period",
                            value.dateType as
                            | "today"
                            | "week"
                            | "month"
                            | "year"
                            | "custom"
                          );
                        }
                      }}
                      value={{
                        dateType: watch("period"),
                        from: watch("date").from,
                        to: watch("date").to,
                      }}
                    />
                  </MenubarSubContent>
                </MenubarSub>

                <MenubarSub>
                  <MenubarSubTrigger className="relative py-3 flex items-center gap-2">
                    <Category2 size={18} />
                    Category
                    {selectedCategory && (
                      <Circle
                        size={6}
                        className="absolute top-0 right-0 text-[#FF4D4F] bg-[#FF4D4F] rounded-full"
                      />
                    )}
                  </MenubarSubTrigger>
                  <MenubarSubContent>
                    {categories?.map((category) => (
                      <MenubarItem
                        key={category.id}
                        onClick={() => handleCategoryChange(category.id)}
                      >
                        {selectedCategory === category.id && (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        {category.name}
                      </MenubarItem>
                    ))}
                  </MenubarSubContent>
                </MenubarSub>

                <MenubarSub>
                  <MenubarSubTrigger className="relative py-3 flex items-center gap-2">
                    <Shop size={18} />
                    Storage Location
                    {selectedCategory && (
                      <Circle
                        size={6}
                        className="absolute top-0 right-0 text-[#FF4D4F] bg-[#FF4D4F] rounded-full"
                      />
                    )}
                  </MenubarSubTrigger>
                  <MenubarSubContent>
                    {STORAGE_LOCATION_OPTIONS.map((location) => (
                      <MenubarItem
                        key={location.value}
                        onClick={() => handleLocationChange(location.value)}
                      >
                        {selectedLocation === location.value && (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        {location.label}
                      </MenubarItem>
                    ))}
                  </MenubarSubContent>
                </MenubarSub>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>

          <section className="ml-auto flex items-center gap-2">
            {(selectedBranch || selectedCategory || debouncedSearchText) && (
              <Button
                variant="outline"
                className="bg-[#FF4D4F] text-[#FF4D4F] bg-opacity-25"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            )}
            <NewProductInventorySheet />

            <Button
              variant="outline"
              className="bg-[#28C76F] text-[#1EA566] bg-opacity-25"
              onClick={handleRefresh}
            >
              <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </section>
        </div>
      </header>

      <section className="pt-6 pb-3">
        {debouncedSearchText && <h3 className="mb-4">Search Results</h3>}
        <TabBar
          tabs={[{ name: "All Inventory", count: data?.count || 0 }]}
          onTabClick={() => { }}
          activeTab={"All Inventory"}
        />
        <ProductsInventoryTable
          data={data?.data}
          isLoading={isLoading}
          isFetching={isFetching}
          error={error}
          refetch={refetch}
        />
      </section>

      <footer>
        <div className="flex items-center justify-between mt-auto py-1.5">
          <Pagination className="justify-start">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  className={currentPage === 1 ? "disabled" : ""}
                />
              </PaginationItem>
              {[...Array(data?.number_of_pages || 0)].map((_, index) => (
                <PaginationItem key={index}>
                  <PaginationLink
                    onClick={() => setCurrentPage(index + 1)}
                    isActive={currentPage === index + 1}
                  >
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, data?.number_of_pages || 1)
                    )
                  }
                // disabled={currentPage === data?.number_of_pages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          <div className="text-sm text-gray-500 w-max shrink-0">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, data?.count || 0)} of{" "}
            {data?.count || 0} entries
          </div>
        </div>
      </footer>
    </div>
  );
}
