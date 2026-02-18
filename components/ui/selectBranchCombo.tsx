"use client";

import * as React from "react";
import { SearchIcon, ArrowLeft, CheckIcon, Circle } from "lucide-react";

import { cn } from "@/lib/utils";
import { convertKebabAndSnakeToTitleCase } from "@/utils/strings";
import { SmallSpinner } from "@/icons/core";

import {
  Button,
  buttonVariants,
  Popover,
  PopoverContent,
  PopoverTrigger,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
  MenubarItem,
} from ".";
import { Label } from "./label";
import FormError from "./formError";

import axios from "@/utils/axios";
import {
  useGetAllBusinesses,
  useGetBusinessBranches,
} from "@/app/(dashboard)/admin/businesses/misc/api";
import { Category2 } from "iconsax-react";

interface BranchSelectorProps {
  value: string | boolean | undefined;
  onChange: (value: string) => void;
  name?: string;
  noLabel?: boolean;
  dropdownItem?: boolean;
  placeholder?: string;
  className?: string;
  containerClass?: string;
  labelClass?: string;
  itemClass?: string;
  withIcon?: boolean;
  isLoadingOptions?: boolean;
  triggerColor?: string;
  hasError?: boolean;
  errorMessage?: string;
  optional?: boolean;
  variant?:
  | "inputButton"
  | "link"
  | "default"
  | "light"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "black"
  | "unstyled"
  | "yellow"
  | null;
  size?:
  | "default"
  | "unstyled"
  | "inputButton"
  | "thin"
  | "sm"
  | "md"
  | "lg"
  | "icon"
  | null;
}

type Business = {
  id: string;
  name: string;
};

type Branch = {
  id: string;
  name: string;
};

const SelectBranchCombo = ({
  value,
  onChange,
  name = '',
  noLabel = false,
  dropdownItem,
  placeholder = "Select branch",
  className,
  containerClass,
  itemClass,
  withIcon,
  isLoadingOptions,
  triggerColor,
  hasError,
  errorMessage,
  optional,
  variant = "inputButton",
  size = "inputButton",
}: BranchSelectorProps) => {
  const [isOpen, setOpen] = React.useState(false);
  const [view, setView] = React.useState<"businesses" | "branches">(
    "businesses"
  );
  const [selectedBusiness, setSelectedBusiness] =
    React.useState<Business | null>(null);
  const [searchText, setSearchText] = React.useState<string>("");
  const { data: allBusinessesResp, isLoading: isLoadingBusinesses } =
    useGetAllBusinesses();
  const { data: branchesResp, isLoading: isLoadingBranches } =
    useGetBusinessBranches({
      business_id: selectedBusiness ? Number(selectedBusiness.id) : undefined,
      page: 1,
      size: 100,
      search: searchText,
    });
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const [width, setWidth] = React.useState<string>("50%");
  React.useEffect(() => {
    if (triggerRef?.current) {
      setWidth(`${triggerRef.current.clientWidth}px`);
    }
  }, [triggerRef?.current?.clientWidth]);

  // reset view when opening
  React.useEffect(() => {
    if (!isOpen) return;
    setView("businesses");
    setSelectedBusiness(null);
    setFetchError(null);
  }, [isOpen]);

  const fetchBranches = (business: Business) => {
    setFetchError(null);
    setSelectedBusiness(business);
    setView("branches");
  };

  const handleSelectBranch = (branchId: string) => {
    onChange(String(branchId));
    if (!dropdownItem) {
      setOpen(false);
    }
  };

  const businessesList: Business[] = React.useMemo(() => {
    const raw = allBusinessesResp ?? null;
    const dataArray = raw
      ? Array.isArray(raw)
        ? raw
        : raw?.data ?? raw?.data ?? []
      : [];
    return (dataArray as any[]).map((item) => ({
      id: String(item.id ?? item.business_id ?? item._id ?? ""),
      name: String(item.name ?? item.business_name ?? item.title ?? ""),
    }));
  }, [allBusinessesResp]);

  const filteredBusinesses = React.useMemo(() => {
    if (!businessesList) return [];
    if (!searchText.trim()) return businessesList;
    return businessesList.filter((b) =>
      String(b.name).toLowerCase().includes(searchText.toLowerCase())
    );
  }, [businessesList, searchText]);

  const branchesList: Branch[] = React.useMemo(() => {
    const raw = branchesResp ?? null;
    const dataArray = raw
      ? Array.isArray(raw)
        ? raw
        : raw?.data ?? raw?.data ?? []
      : [];
    return (dataArray as any[]).map((item) => ({
      id: String(item.id ?? item.business_id ?? item._id ?? ""),
      name: String(item.name ?? item.branch_name ?? item.title ?? ""),
    }));
  }, [branchesResp]);

  const filteredBranches = React.useMemo(() => {
    if (!branchesList) return [];
    if (!searchText.trim()) return branchesList;
    return branchesList.filter((b) =>
      String(b.name).toLowerCase().includes(searchText.toLowerCase())
    );
  }, [branchesList, searchText]);

  const displayLabel = React.useMemo(() => {
    if (value && branchesList) {
      const found = branchesList.find((b) => String(b.id) == String(value));
      if (found) return found.name;
    }
    // fallback: try to find branch across loaded businesses
    if (value && businessesList) {
      return placeholder;
    }
    return placeholder;
  }, [value, branchesList, businessesList, placeholder]);

  // For dropdown mode, render as nested MenubarSub
  if (dropdownItem) {
    return (
      <MenubarSub>
        <MenubarSubTrigger className="relative py-3 flex items-center gap-2">
          <Category2 size={18} />
          Branch
          {value && (
            <Circle
              size={6}
              className="absolute top-0 right-0 text-[#FF4D4F] bg-[#FF4D4F] rounded-full"
            />
          )}
        </MenubarSubTrigger>
        <MenubarSubContent>
          {isLoadingBusinesses && (
            <MenubarItem disabled>
              <SmallSpinner color="#000000" /> Loading businesses...
            </MenubarItem>
          )}
          {!isLoadingBusinesses &&
            businessesList &&
            businessesList.length > 0 &&
            businessesList.map((business) => (
              <MenubarSub key={business.id}>
                <MenubarSubTrigger
                  onMouseEnter={() => {
                    setSelectedBusiness(business);
                    setView("branches");
                  }}
                >
                  {business.name}
                </MenubarSubTrigger>
                <MenubarSubContent>
                  {selectedBusiness?.id === business.id && isLoadingBranches && (
                    <MenubarItem disabled>
                      <SmallSpinner color="#000000" /> Loading branches...
                    </MenubarItem>
                  )}
                  {selectedBusiness?.id === business.id &&
                    !isLoadingBranches &&
                    branchesList &&
                    branchesList.length > 0 &&
                    branchesList.map((branch) => (
                      <MenubarItem
                        key={branch.id}
                        onClick={() => handleSelectBranch(branch.id)}
                      >
                        {String(branch.id) === String(value) && (
                          <CheckIcon className="mr-2 h-4 w-4" />
                        )}
                        {branch.name}
                      </MenubarItem>
                    ))}
                  {selectedBusiness?.id === business.id &&
                    !isLoadingBranches &&
                    (!branchesList || branchesList.length === 0) && (
                      <MenubarItem disabled>No branches available</MenubarItem>
                    )}
                </MenubarSubContent>
              </MenubarSub>
            ))}
          {!isLoadingBusinesses &&
            (!businessesList || businessesList.length === 0) && (
              <MenubarItem disabled>No businesses available</MenubarItem>
            )}
        </MenubarSubContent>
      </MenubarSub>
    );
  }

  // For non-dropdown mode, render as Popover (existing implementation)

  return (
    <div className={cn("inputdiv", withIcon && "withicon", containerClass)}>
      <Popover open={isOpen} onOpenChange={setOpen}>
        <div className="flex flex-col gap-2">
          {/* <Label
            className={cn(
              "text-sm text-[#0F172B] font-poppins font-medium",
              noLabel && "sr-only"
            )}
            htmlFor={name || "branch-select"}
          >
            Branch
            {!optional && <span className="text-red-400 font-medium"> *</span>}
          </Label> */}
          <PopoverTrigger asChild>
            <Button
              variant={variant}
              size={dropdownItem ? "thin" : size}
              className={cn(
                "flex w-full items-center justify-between gap-2 text-left text-sm transition duration-300",
                className, dropdownItem && "!px-0"
              )}
              onMouseOver={() => {
                if (dropdownItem) {
                  setOpen(true);
                }
              }}
              onMouseLeave={() => {
                if (dropdownItem) {
                  setOpen(false);
                }
              }}
              type="button"
              role="combobox"
              onClick={() => setOpen(!isOpen)}
              ref={triggerRef}
              disabled={isLoadingOptions}
            >
              <div className="grow flex items-center gap-2">
                {dropdownItem && <Category2 size={18} />}
                <span
                  className={cn(
                    "!overflow-hidden text-sm w-full font-normal",
                    value && branchesList && branchesList.length && dropdownItem
                      ? ""
                      : dropdownItem
                        ? ""
                        : "!text-[#A4A4A4]"
                  )}
                >
                  {isLoadingOptions ? "Loading options..." : displayLabel}
                </span>
              </div>
              <svg
                className={cn(
                  "ml-2  shrink-0 opacity-70 transition-transform duration-300",
                  dropdownItem ? "-rotate-90" : isOpen ? "rotate-180" : ""
                )}
                fill="none"
                height={7}
                viewBox="0 0 12 7"
                width={12}
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  className={cn("fill-label-text")}
                  clipRule="evenodd"
                  d="M8.357 5.522a3.333 3.333 0 0 1-4.581.126l-.133-.126L.41 2.089A.833.833 0 0 1 1.51.84l.078.07L4.82 4.342c.617.617 1.597.65 2.251.098l.106-.098L10.411.91a.833.833 0 0 1 1.248 1.1l-.07.079-3.232 3.433Z"
                  fill={triggerColor || "#032282"}
                  fillRule="evenodd"
                />
              </svg>
            </Button>
          </PopoverTrigger>
        </div>

        <PopoverContent
          className={cn(
            "p-0 overflow-hidden",
            triggerRef?.current && `min-w-max`,
            isLoadingOptions && "hidden"
          )}
          style={{ width }}
        >
          <div className="">
            <div className="relative px-6">
              <SearchIcon className="absolute top-1/2 left-2 -translate-y-1/2 text-[#032282] h-4 w-4" />
              <input
                className="focus:!ring-0 !ring-0 bg-transparent pl-5 p-3 !outline-none text-sm placeholder:text-[#86898ec7] border-b border-[#E6E6E6] w-full rounded-none"
                placeholder={placeholder || "Search"}
                type="text"
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            {(isLoadingBusinesses || isLoadingBranches) && (
              <button
                className="flex items-center justify-center gap-2 text-main-solid py-2 font-medium"
                disabled
              >
                <SmallSpinner color="#000000" /> Loading...
              </button>
            )}

            <div className="flex flex-col gap-1.5 px-5 py-3 max-h-[450px] overflow-y-auto">
              {fetchError && (
                <div className="text-sm text-red-500 px-3">{fetchError}</div>
              )}

              {view === "businesses" &&
                (!isLoadingBusinesses &&
                  businessesList &&
                  businessesList.length > 0 ? (
                  (filteredBusinesses || businessesList).map((b) => (
                    <button
                      key={b.id}
                      className={cn(
                        "text-xs relative flex select-none items-center rounded-md px-3 py-2 outline-none aria-selected:bg-blue-100/70 aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                        itemClass,
                        "hover:bg-blue-100 w-full text-sm",
                        "py-2 hover:!bg-primary hover:!text-white cursor-pointer rounded-lg border hover:border-transparent"
                      )}
                      onClick={() => fetchBranches(b)}
                    >
                      <span className="flex-1 text-left">{b.name}</span>
                      <svg
                        className="h-4 w-4 text-gray-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  ))
                ) : (
                  <div className={cn("text-[0.8125rem]", itemClass)}>
                    {!isLoadingBusinesses
                      ? "There's no business to select from"
                      : null}
                  </div>
                ))}

              {view === "branches" && (
                <>
                  <div className="flex items-center gap-2 px-1 pb-2">
                    <button
                      className="p-1"
                      onClick={() => {
                        setView("businesses");
                        setSelectedBusiness(null);
                        setSearchText("");
                      }}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="text-sm font-medium">
                      {selectedBusiness?.name}
                    </div>
                  </div>

                  {!isLoadingBranches &&
                    branchesList &&
                    branchesList.length > 0 ? (
                    (filteredBranches || branchesList).map((br) => (
                      <button
                        key={br.id}
                        className={cn(
                          "text-xs relative flex select-none items-center rounded-md px-3 py-2 outline-none aria-selected:bg-blue-100/70 aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                          itemClass,
                          "hover:bg-blue-100 w-full text-sm",
                          "py-2 hover:!bg-primary hover:!text-white cursor-pointer rounded-lg border hover:border-transparent"
                        )}
                        onClick={() => handleSelectBranch(br.id)}
                      >
                        <CheckIcon
                          className={cn(
                            "mr-2 h-4 w-4",
                            br.id == String(value) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {br.name}
                      </button>
                    ))
                  ) : (
                    <div className={cn("text-[0.8125rem]", itemClass)}>
                      {!isLoadingBranches
                        ? "There's no branch to select from"
                        : null}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {hasError && errorMessage && <FormError errorMessage={errorMessage} />}
    </div>
  );
};

export default SelectBranchCombo;
