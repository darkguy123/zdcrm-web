"use client";

import React, { useState, useEffect } from "react";
import { Search, RefreshCcw, Check } from 'lucide-react';
import {
  Button,
  Input,
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
  RangeAndCustomDatePicker,
} from "@/components/ui";
import StockInventoryTable from "./StockInventoryTable";
import TabBar from "@/components/TabBar";
import { ArrowDown2 } from "iconsax-react";
import { useGetStockCategories, useGetStockInventory } from "../api";
import NewInventorySheet from "./StockInventoryNew";
import { useDebounce } from "@/hooks";
import { subMonths } from "date-fns";
import { useForm } from "react-hook-form";
import { DateRange } from "react-day-picker";

export default function StockInventoryDashboard() {
  const [activeTab, setActiveTab] = useState("All Stock Inventory");
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selectedVariation, setSelectedVariation] = useState<string | undefined>();

  const debouncedSearchText = useDebounce(searchText, 300);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();

  const { data: categories, isLoading: categoriesLoading } = useGetStockCategories();
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
      period: 'today',
    },
  });
  const { data, isLoading, isFetching, error, refetch } = useGetStockInventory({
    page: currentPage,
    size: pageSize,
    search: debouncedSearchText,
    category: selectedCategory,
    variation: selectedVariation,
    date_from: watch('date').from?.toISOString().split('T')[0],
    date_to: watch('date').to?.toISOString().split('T')[0],
    period: watch('period'),
  });

  const tabs = [{ name: "All Stock Inventory", count: data?.count || 0 }];

  const handleRefresh = () => {
    refetch();
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  const handleVariationChange = (variation: string) => {
    setSelectedVariation(variation);
    setCurrentPage(1);
  };
  const clearFilters = () => {
    setSelectedCategory(undefined);
    setSearchText("");
    setCurrentPage(1);
  }


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


          <Menubar>
            <MenubarMenu>
              <MenubarTrigger className="flex items-center gap-4 text-xs cursor-pointer text-[#8B909A]">
                Filter by Category <ArrowDown2 size={16} />
              </MenubarTrigger>
              <MenubarContent>
                {
                  categories?.map((category) => (
                    <MenubarItem key={category.id} onClick={() => handleCategoryChange(category.id)}>
                      {
                        selectedCategory === category.id && <Check className='mr-2 h-4 w-4' />
                      }
                      {category.name}
                    </MenubarItem>
                  ))
                }
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>
        
        <div className="flex items-center gap-2">


          <RangeAndCustomDatePicker
            className="max-w-max"
            variant="light"
            size="thin"
            onChange={(value) => {
              if (value.dateType === 'custom' && value.from && value.to) {
                setValue('date', { from: value.from, to: value.to });
                setValue('period', 'custom');
              } else {
                setValue('period', value.dateType as "today" | "week" | "month" | "year" | "custom");
              }
            }}
            value={{
              dateType: watch('period'),
              from: watch('date').from,
              to: watch('date').to
            }}
          /> {
            (selectedCategory || debouncedSearchText) && (
              <Button
                variant='outline'
                className='bg-[#FF4D4F] text-[#FF4D4F] bg-opacity-25'
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            )
          }
          <NewInventorySheet />
          <Button
            variant="outline"
            className="bg-[#28C76F] text-[#1EA566] bg-opacity-25"
            onClick={handleRefresh}
          >
            <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </header>

      <section className="pt-6 pb-3">
        {debouncedSearchText && <h3 className="mb-4">Search Results</h3>}
        <TabBar
          tabs={tabs}
          onTabClick={setActiveTab}
          activeTab={activeTab}
        />
        <StockInventoryTable data={data?.data} isLoading={isLoading} isFetching={isFetching} error={error} refetch={refetch} />
      </section>

      <footer >
        <div className="flex items-center justify-between mt-auto py-1.5">
          <Pagination className="justify-start">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? 'disabled' : ''}
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
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, data?.number_of_pages || 1))}
                // disabled={currentPage === data?.number_of_pages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          <div className="text-sm text-gray-500 w-max shrink-0">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, data?.count || 0)} of {data?.count || 0} entries
          </div>
        </div>
      </footer>
    </div>
  );
}

