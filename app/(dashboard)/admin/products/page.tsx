"use client"

import React, { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CiSearch } from "react-icons/ci"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MdOutlineModeEdit } from "react-icons/md"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { IoChevronUp } from "react-icons/io5"
import { SelectSingleCombo, Spinner, SuccessModal } from "@/components/ui"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import ErrorModal from "@/components/ui/modal-error"
import { extractErrorMessage } from "@/utils/errors"
import { useBooleanStateControl, useDebounce } from "@/hooks"
import { cn } from "@/lib/utils"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { PlusCircle, Trash2 } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { useCreateProduct, useGetAllProducts, useUpdateProduct } from "./misc/api"
import { productSchema, TProductItem } from "./misc/types"
import { APIAxios } from "@/utils/axios"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { formatCurrency } from "@/utils/currency"
import useCloudinary from "@/hooks/useCloudinary"
import { useGetCategories } from "../../inventory/misc/api"
import { SmallSpinner } from "@/icons/core"
import { useUpdateProductVariationStatus } from "./misc/api/editProduct"
import { Copy } from "iconsax-react"
import { useGetAllBusiness } from "@/mutations/business.mutation"
import Image from "next/image"

interface ProductFormValues {
  branch: string
  name: string
  business_id: number
  category_id: number
  category_name: string
  external_id: string
  is_active: boolean
  image: {
    file?: File | null
    url: string
  }
  variations: {
    size: string
    layer?: string
    max_flowers?: number
    cost_price: string
    selling_price: string
    id?: number // For existing variations
  }[]
}

const useEditVariation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ productId, variationId, data }: { productId: number; variationId: number; data: any }) => {
      const response = await APIAxios.put(`/inventory/${variationId}/update-product-variation/`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GET_ALL_PRODUCTS"] })
    },
  })
}

const useDeleteVariation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ productId, variationId }: { productId: number; variationId: number }) => {
      const response = await APIAxios.delete(`/inventory/${variationId}/delete-product-variation/`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GET_ALL_PRODUCTS"] })
    },
  })
}

const useAddVariation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ productId, data }: { productId: number; data: any }) => {
      const response = await APIAxios.post(`/inventory/${productId}/add-variation/`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GET_ALL_PRODUCTS"] })
    },
  })
}

const Page = () => {
  const { data: branches, isLoading: branchesLoading } = useGetAllBusiness()

  // Boolean states
  const isSheetOpen = useBooleanStateControl(false)
  const isVariationSheetOpen = useBooleanStateControl(false)
  const isSuccessModal = useBooleanStateControl(false)
  const isErrorModal = useBooleanStateControl(false)
  const isInitialLoading = useBooleanStateControl(true)

  // Regular states
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(25)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [errorMessage, setErrorMessage] = React.useState("")
  const [successMessage, setSuccessMessage] = React.useState("")
  const [editingProductId, setEditingProductId] = React.useState<number | null>(null)
  const [editingVariationData, setEditingVariationData] = React.useState<{
    productId: number
    variation?: any
    categoryName: string
  } | null>(null)

  const debouncedSearchText = useDebounce(searchTerm, 300)

  // API hooks
  const { data: categories } = useGetCategories()
  const createProductMutation = useCreateProduct()
  const updateProductMutation = useUpdateProduct()
  const { mutate: updateVariationStatus, isPending: isUpdatingVariationStatus } = useUpdateProductVariationStatus()

  const {
    data: productsData,
    isLoading: isLoadingProducts,
    isFetching,
    error: productsError,
  } = useGetAllProducts({
    paginate: true,
    page: currentPage,
    size: pageSize,
    search: debouncedSearchText || undefined,
  })

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),

    defaultValues: {
      branch: "all",
      name: "",
      business_id: 0,
      category_id: 0,
      category_name: "",
      external_id: "",
      is_active: true,
      image: {
        file: null,
        url: "",
      },
      variations: [
        {
          id: 0,
          size: "",
          layer: undefined,
          max_flowers: undefined,
          cost_price: "",
          selling_price: "",
        },
      ],
    },
  })

  // Separate form for variation editing
  const variationForm = useForm({
    defaultValues: {
      size: "",
      layer: "",
      max_flowers: 0,
      cost_price: "",
      selling_price: "",
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variations",
  })

  // Watch for category changes to update category_name
  const selectedCategoryId = form.watch("category_id")
  const selectedBranch = form.watch("branch")

  const branchValueSafe = React.useMemo(() => {
    if (!selectedBranch) return "";
    if (!Array.isArray(branches) || branches.length === 0) return "";

    return branches.some(
      (b) => String(b.id) === String(selectedBranch)
    )
      ? String(selectedBranch)
      : "";
  }, [selectedBranch, branches]);


  // Update category_name when category_id changes
  useEffect(() => {
    if (selectedCategoryId && categories) {
      const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId)
      if (selectedCategory) {
        form.setValue("category_name", selectedCategory.name)
      }
    }
  }, [selectedCategoryId, categories, form])

  // Reset form when sheet is closed
  useEffect(() => {
    if (!isSheetOpen.state) {
      form.reset({
        branch: "all",
        name: "",
        business_id: 0,
        category_id: 0,
        category_name: "",
        external_id: "",
        is_active: true,
        image: { file: null, url: "" },
        variations: [
          {
            id: 0,
            size: "",
            layer: undefined,
            max_flowers: undefined,
            cost_price: "",
            selling_price: "",
          },
        ],
      })

      setEditingProductId(null)
    }
  }, [isSheetOpen.state, form])

  // Reset variation form when sheet is closed
  useEffect(() => {
    if (!isVariationSheetOpen.state) {
      variationForm.reset()
      setEditingVariationData(null)
    }
  }, [isVariationSheetOpen.state, variationForm])

  // Set initial loading state
  useEffect(() => {
    if (productsData || productsError) {
      isInitialLoading.setFalse()
    }
  }, [productsData, productsError, isInitialLoading])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const { uploadToCloudinary } = useCloudinary()

  const handleEditClick = (product: TProductItem) => {
    // Transform the product data to match our form structure
    const formVariations = product.variations.map((variation) => {
      return {
        id: variation.id,
        size: variation.size || "",
        layer: variation.layer || undefined,
        max_flowers: variation.max_flowers || undefined,
        cost_price: variation.cost_price || "0",
        selling_price: variation.selling_price || "0",
      }
    })

    // If no variations, add a default one
    if (formVariations.length === 0) {
      formVariations.push({
        size: "",
        cost_price: "0",
        selling_price: "0",
        layer: undefined,
        max_flowers: undefined,
        id: 0,
      })
    }

    // Set up the form with existing product data
    form.reset({
      branch: product.business?.id.toString() || "all",
      name: product.name,
      category_id: product.category.id,
      category_name: product.category.name,
      external_id: product.external_id || "",
      is_active: product.is_active,
      image: {
        file: null,
        url: product.image || "",
      },
      variations: formVariations,
    })

    setEditingProductId(product.id)
    isSheetOpen.setTrue()
  }

  // New function to handle product duplication
  const handleDuplicateProduct = (product: TProductItem) => {
    // Transform the product data to match our form structure, but remove IDs for duplication
    const formVariations = product.variations.map((variation) => {
      return {
        size: variation.size || "",
        layer: variation.layer || undefined,
        max_flowers: variation.max_flowers || undefined,
        cost_price: variation.cost_price || "0",
        selling_price: variation.selling_price || "0",
        // Don't include ID for new variations
      }
    })

    // If no variations, add a default one
    if (formVariations.length === 0) {
      formVariations.push({
        size: "",
        cost_price: "0",
        selling_price: "0",
        layer: undefined,
        max_flowers: undefined,
      })
    }

    // Set up the form with duplicated product data
    form.reset({
      branch: product.branch?.id.toString() || "all",
      name: `${product.name} (Copy)`, // Add "(Copy)" to indicate it's a duplicate
      category_id: product.category.id,
      category_name: product.category.name,
      external_id: "", // Clear external_id for new product
      is_active: product.is_active,
      image: {
        file: null,
        url: product.image || "",
      },
      variations: formVariations,
    })

    // Don't set editingProductId since this is a new product
    setEditingProductId(null)
    isSheetOpen.setTrue()
  }

  // New function to handle variation duplication
  const handleDuplicateVariation = (product: TProductItem, variation: any) => {
    // Set up the variation form with duplicated data
    variationForm.reset({
      size: `${variation.size} (Copy)`, // Add "(Copy)" to indicate it's a duplicate
      layer: variation.layer || "",
      max_flowers: variation.max_flowers || 0,
      cost_price: variation.cost_price || "0",
      selling_price: variation.selling_price || "0",
    })

    setEditingVariationData({
      productId: product.id,
      categoryName: product.category.name,
    })

    isVariationSheetOpen.setTrue()
  }

  // Helper function to determine category type
  const getCategoryType = (categoryName: string): "Cake" | "Flower" | "Other" => {
    if (categoryName.toLowerCase() == "cake") return "Cake"
    if (categoryName.toLowerCase().includes("flower")) return "Flower"
    return "Other"
  }

  // mutation hooks
  const editVariationMutation = useEditVariation()
  const deleteVariationMutation = useDeleteVariation()
  const addVariationMutation = useAddVariation()

  const onSubmit = async (data: ProductFormValues) => {
    // console.log("selected branch", selectedBranch)

    try {
      let imageUrl = data.image.url

      // If there's a file, upload it to Cloudinary
      if (data.image.file) {
        const uploadResult = await uploadToCloudinary(data.image.file)
        imageUrl = uploadResult.secure_url
      }

      const createSubmissionData = {
        name: data.name,
        category_id: data.category_id,
        external_id: data.external_id,
        is_active: data.is_active,
        image: imageUrl,
        business_id: Number.parseInt(data.branch),
      }


      const editSubmissionData = {
        name: data.name,
        category: data.category_id, // 👈 retain category for edit
        external_id: data.external_id,
        is_active: data.is_active,
        image: imageUrl,
        business: Number.parseInt(data.branch),
      }

      if (editingProductId) {
        updateProductMutation.mutate(
          {
            id: editingProductId,
            data: editSubmissionData,
          },
          {
            onSuccess: () => {
              // Handle variations separately
              data.variations.forEach((variation) => {
                // Determine if it's a cake or flower based on the category
                const categoryName = data.category_name
                const isCake = categoryName.toLowerCase() == "cake"
                const isFlower = categoryName.toLowerCase().includes("flower")

                // If variation has an ID, it's an existing one to update
                if (variation.id) {
                  editVariationMutation.mutate({
                    productId: editingProductId,
                    variationId: variation.id,
                    data: {
                      size: variation.size,
                      cost_price: variation.cost_price,
                      selling_price: variation.selling_price,
                      ...(isCake ? { layer: variation.layer } : {}),
                      ...(isFlower ? { max_flowers: variation.max_flowers } : {}),
                    },
                  })
                } else {
                  // Otherwise it's a new variation to add
                  addVariationMutation.mutate({
                    productId: editingProductId,
                    data: {
                      size: variation.size,
                      cost_price: variation.cost_price,
                      selling_price: variation.selling_price,
                      ...(isCake ? { layer: variation.layer } : {}),
                      ...(isFlower ? { max_flowers: variation.max_flowers } : {}),
                    },
                  })
                }
              })

              setSuccessMessage("Product updated successfully")
              // form.reset()
              isSuccessModal.setTrue()
              isSheetOpen.setFalse()
            },
            onError: (error: unknown) => {
              const errMessage = extractErrorMessage((error as any)?.response?.data as any)
              setErrorMessage(errMessage || "Failed to update product")
              isErrorModal.setTrue()
            },
          },
        )
      } else {
        // For new products, include variations in the initial creation
        const variationsData = data.variations.map((item) => {
          // Determine if it's a cake or flower based on the category
          const categoryName = data.category_name
          const isCake = categoryName.toLowerCase() == "cake"
          const isFlower = categoryName.toLowerCase().includes("flower")

          return {
            size: item.size,
            cost_price: item.cost_price,
            selling_price: item.selling_price,
            ...(isCake ? { layer: item.layer } : {}),
            ...(isFlower ? { max_flowers: item.max_flowers } : {}),
          }
        })

        createProductMutation.mutate(
          {
            ...createSubmissionData,
            variations: variationsData,
          },
          {
            onSuccess: () => {
              setSuccessMessage("Product created successfully")
              // form.reset()
              isSuccessModal.setTrue()
              isSheetOpen.setFalse()
            },
            onError: (error: unknown) => {
              const errMessage = extractErrorMessage((error as any)?.response?.data as any)
              setErrorMessage(errMessage || "Failed to create product")
              isErrorModal.setTrue()

            },
          },
        )
      }
    } catch (error) {
      setErrorMessage("Failed to upload image")
      isErrorModal.setTrue()
    }
  }

  // New function to handle variation form submission
  const onVariationSubmit = (data: any) => {
    if (!editingVariationData) return

    const categoryName = editingVariationData.categoryName
    const isCake = categoryName.toLowerCase() == "cake"
    const isFlower = categoryName.toLowerCase().includes("flower")

    const variationData = {
      size: data.size,
      cost_price: data.cost_price,
      selling_price: data.selling_price,
      ...(isCake ? { layer: data.layer } : {}),
      ...(isFlower ? { max_flowers: data.max_flowers } : {}),
    }

    addVariationMutation.mutate(
      {
        productId: editingVariationData.productId,
        data: variationData,
      },
      {
        onSuccess: () => {
          setSuccessMessage("Variation added successfully")
          isSuccessModal.setTrue()
          isVariationSheetOpen.setFalse()
        },
        onError: (error) => {
          const errMessage = extractErrorMessage((error as any)?.response?.data)
          setErrorMessage(errMessage || "Failed to add variation")
          isErrorModal.setTrue()
        },
      },
    )
  }

  const handleVariationStatusChange = (id: number, value: boolean) => {
    updateVariationStatus(
      {
        id,
      },
      {
        onSuccess: () => {
          setSuccessMessage("Product variation status updated successfully")
          isSuccessModal.setTrue()
        },
        onError: (error: unknown) => {
          const errMessage = extractErrorMessage((error as any)?.response?.data as any)
          setErrorMessage(errMessage || "Failed to update product status")
          isErrorModal.setTrue()
        },
      },
    )
  }

  const renderPaginationItems = () => {
    if (!productsData) return null

    const items = []
    for (let i = 1; i <= productsData.number_of_pages; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            href="#"
            isActive={currentPage === i}
            onClick={(e) => {
              e.preventDefault()
              setCurrentPage(i)
            }}
          >
            {i}
          </PaginationLink>
        </PaginationItem>,
      )
    }
    return items
  }

  if (isInitialLoading.state && isLoadingProducts) {
    return (
      <div className="flex items-center justify-center h-full w-full py-[30vh]">
        <Spinner size={18} />
      </div>
    )
  }

  if (productsError) return <div>Error: {productsError?.message}</div>

  return (
    <>
      <section className="mt-7 pb-7 mx-10 rounded-xl bg-white border-[1px] border-[#0F172B1A] px-[20px] pt-[35px]">
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-medium">Product Management</h1>
            <p>Manage your products here.</p>
          </div>
          <div className="relative">
            <Input
              type="search"
              placeholder="Search what you need"
              className="h-14 w-[485px]"
              value={searchTerm}
              onChange={handleSearch}
            />
            <CiSearch size={20} color="#111827" className="absolute top-[30%] right-[24px]" />
          </div>
        </div>
        <div className="mt-6 flex justify-between items-start">
          <h2 className="text-2xl font-semibold">Product List</h2>
          <div className="flex gap-2">
            <Sheet open={isSheetOpen.state} onOpenChange={isSheetOpen.setState}>
              <SheetTrigger asChild>
                <Button className="h-12 flex gap-4 bg-transparent text-sm px-6 text-[#111827] border border-solid rounded-[10px]">
                  Add New Product
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto w-[500px] sm:max-w-[500px]">
                <SheetHeader>
                  <SheetTitle className="text-2xl font-bold pb-4">
                    {editingProductId ? "Edit Product" : "Add New Product"}
                  </SheetTitle>
                </SheetHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
                    <SelectSingleCombo
                      name="business_id"
                      label="Business"
                      options={
                        branches?.map((branch) => ({ value: branch.id.toString(), label: branch.name })) || []
                      }
                      value={branchValueSafe}
                      onChange={(value) => form.setValue("branch", value)}
                      valueKey="value"
                      labelKey="label"
                      isLoadingOptions={branchesLoading}
                      placeholder="Select Business"
                      className="w-full !h-14 text-[#8B909A] text-xs"
                      placeHolderClass="text-[#8B909A] text-xs"
                      triggerColor="#8B909A"
                    />

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Product Name <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input {...field} className="h-14" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Category <span className="text-red-500">*</span>
                          </FormLabel>
                          <Select
                            value={field.value ? field.value.toString() : ""}
                            onValueChange={(value) => {
                              const categoryId = Number.parseInt(value)
                              field.onChange(categoryId)

                              // Update category_name when category changes
                              const selectedCategory = categories?.find((cat) => cat.id === categoryId)
                              if (selectedCategory) {
                                form.setValue("category_name", selectedCategory.name)
                              }
                            }}
                          >
                            <FormControl>
                              <SelectTrigger className="h-14">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectGroup>
                                {categories?.map((category) => (
                                  <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Image</FormLabel>
                          <div className="space-y-2">
                            {field.value.url && (
                              <div className="relative w-32 h-32 rounded-md overflow-hidden border">
                                <Image
                                  src={field.value.url || "/placeholder.svg"}
                                  alt="Product"
                                  className="size-full object-cover"
                                  fill
                                />
                              </div>
                            )}
                            <FormControl>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null
                                  field.onChange({
                                    file,
                                    url: field.value.url,
                                  })
                                }}
                                className="h-14"
                              />
                            </FormControl>
                            <Input
                              type="text"
                              placeholder="Or enter image URL"
                              value={field.value.url}
                              onChange={(e) => {
                                field.onChange({
                                  file: field.value.file,
                                  url: e.target.value,
                                })
                              }}
                              className="h-14"
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Variations</h3>
                      </div>

                      {fields.map((field, index) => {
                        // Get the category name to determine if it's a cake or flower
                        const categoryName = form.watch("category_name")
                        const isCake = categoryName.toLowerCase() == "cake"
                        const isFlower = categoryName.toLowerCase().includes("flower")

                        return (
                          <div key={field.id} className="border rounded-md p-4 space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium">Variation {index + 1}</h4>
                              {fields.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => remove(index)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>

                            <FormField
                              control={form.control}
                              name={`variations.${index}.size`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Size <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {isCake && (
                              <FormField
                                control={form.control}
                                name={`variations.${index}.layer`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>
                                      Layer <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}

                            {isFlower && (
                              <FormField
                                control={form.control}
                                name={`variations.${index}.max_flowers`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>
                                      Max Flowers <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        {...field}
                                        onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}

                            <FormField
                              control={form.control}
                              name={`variations.${index}.cost_price`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Cost Price <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`variations.${index}.selling_price`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Selling Price <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )
                      })}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          append({
                            id: 0,
                            size: "",
                            layer: undefined,
                            max_flowers: undefined,
                            cost_price: "",
                            selling_price: "",
                          })
                        }
                        className="flex items-center gap-1"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Add Variation
                      </Button>
                    </div>

                    <SheetFooter className="pt-4">
                      <SheetClose asChild>
                        <Button
                          type="button"
                          className="w-full bg-white text-black border border-solid h-14"
                          onClick={() => {
                            form.reset()
                            isSheetOpen.setFalse()
                          }}
                        >
                          Cancel
                        </Button>
                      </SheetClose>
                      <Button
                        type="submit"
                        className="w-full bg-[#111827] h-14"
                        disabled={createProductMutation.isPending || updateProductMutation.isPending}
                      >
                        {createProductMutation.isPending || updateProductMutation.isPending ? (
                          <Spinner className="ml-2" />
                        ) : editingProductId ? (
                          "Update"
                        ) : (
                          "Create"
                        )}
                      </Button>
                    </SheetFooter>
                  </form>
                </Form>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Variation Sheet */}
        <Sheet open={isVariationSheetOpen.state} onOpenChange={isVariationSheetOpen.setState}>
          <SheetContent className="overflow-y-auto w-[400px] sm:max-w-[400px]">
            <SheetHeader>
              <SheetTitle className="text-2xl font-bold pb-4">Add New Variation</SheetTitle>
            </SheetHeader>

            <Form {...variationForm}>
              <form onSubmit={variationForm.handleSubmit(onVariationSubmit)} className="space-y-6 pt-2">
                <FormField
                  control={variationForm.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Size <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} className="h-14" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {editingVariationData?.categoryName.toLowerCase() === "cake" && (
                  <FormField
                    control={variationForm.control}
                    name="layer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Layer <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} className="h-14" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {editingVariationData?.categoryName.toLowerCase().includes("flower") && (
                  <FormField
                    control={variationForm.control}
                    name="max_flowers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Max Flowers <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 0)}
                            className="h-14"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={variationForm.control}
                  name="cost_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Cost Price <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} className="h-14" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={variationForm.control}
                  name="selling_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Selling Price <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} className="h-14" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <SheetFooter className="pt-4">
                  <SheetClose asChild>
                    <Button
                      type="button"
                      className="w-full bg-white text-black border border-solid h-14"
                      onClick={() => {
                        variationForm.reset()
                        isVariationSheetOpen.setFalse()
                      }}
                    >
                      Cancel
                    </Button>
                  </SheetClose>
                  <Button type="submit" className="w-full bg-[#111827] h-14" disabled={addVariationMutation.isPending}>
                    {addVariationMutation.isPending ? <Spinner className="ml-2" /> : "Add Variation"}
                  </Button>
                </SheetFooter>
              </form>
            </Form>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-4 h-3 my-4">
          <div className="overflow-hidden rounded-full mb-1 grow">
            <div className={cn("overflow-hidden rounded-full mb-1 grow")}>
              <div className={cn("bg-[#F8F9FB] h-1 w-full overflow-hidden", isFetching && "bg-blue-200")}>
                <div
                  className={cn(
                    "h-full w-full origin-[0_50%] animate-indeterminate-progress rounded-full bg-primary opacity-0 transition-opacity",
                    isFetching && "opacity-100",
                  )}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <section className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Name</TableHead>
                <TableHead className="">Business</TableHead>
                <TableHead className="">Category</TableHead>
                <TableHead className="w-[300px]">Variations</TableHead>
                <TableHead className=" text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsData?.data?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium align-top">{product.name}</TableCell>
                  <TableCell className="font-medium align-top">{product.business?.name}</TableCell>
                  <TableCell className="align-top">{product.category.name}</TableCell>
                  <TableCell className="align-top">
                    <div className="space-y-2">
                      {product.variations.length > 0 ? (
                        product.variations.map((variation) => (
                          <div key={variation.id} className="flex items-center justify-between border rounded p-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {variation.size}
                                  {product.category.name == "Cake" && " inches"}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {variation.layer && `Layer: ${variation.layer}`}
                                  {variation.max_flowers !== null &&
                                    variation.max_flowers !== undefined &&
                                    `Max Flowers: ${variation.max_flowers}`}
                                </span>
                              </div>
                              <div className="flex flex-col text-xs gap-1 text-muted-foreground">
                                <span>Cost: {formatCurrency(Number(variation.cost_price), "NGN")}</span>
                                <span>Selling: {formatCurrency(Number(variation.selling_price), "NGN")}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Sheet>
                                <SheetTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MdOutlineModeEdit className="h-4 w-4" />
                                  </Button>
                                </SheetTrigger>
                                <SheetContent>
                                  <SheetHeader>
                                    <SheetTitle>Edit Variation</SheetTitle>
                                  </SheetHeader>
                                  <div className="py-4">
                                    <Form {...form}>
                                      <form
                                        onSubmit={(e) => {
                                          e.preventDefault()
                                          let formData: any
                                          formData = {
                                            size: e.currentTarget.size.value,
                                            cost_price: e.currentTarget.cost_price.value,
                                            selling_price: e.currentTarget.selling_price.value,
                                          }

                                          if (e.currentTarget.layer) {
                                            if (e.currentTarget.layer) {
                                              formData.layer = e.currentTarget.layer.value
                                            }
                                          }

                                          if (e.currentTarget.max_flowers) {
                                            formData.max_flowers = Number.parseInt(e.currentTarget.max_flowers.value)
                                          }

                                          editVariationMutation.mutate(
                                            {
                                              productId: product.id,
                                              variationId: variation.id,
                                              data: formData,
                                            },
                                            {
                                              onSuccess: () => {
                                                setSuccessMessage("Variation updated successfully")
                                                isSuccessModal.setTrue()
                                              },
                                              onError: (error) => {
                                                const errMessage = extractErrorMessage((error as any)?.response?.data)
                                                setErrorMessage(errMessage || "Failed to update variation")
                                                isErrorModal.setTrue()
                                              },
                                            },
                                          )
                                        }}
                                        className="space-y-4"
                                      >
                                        <FormItem>
                                          <FormLabel>Size</FormLabel>
                                          <Input name="size" defaultValue={variation.size} />
                                        </FormItem>

                                        {variation.layer !== null && (
                                          <FormItem>
                                            <FormLabel>Layer</FormLabel>
                                            <Input name="layer" defaultValue={variation.layer || ""} />
                                          </FormItem>
                                        )}

                                        {variation.max_flowers !== null && (
                                          <FormItem>
                                            <FormLabel>Max Flowers</FormLabel>
                                            <Input
                                              name="max_flowers"
                                              type="number"
                                              defaultValue={variation.max_flowers || 0}
                                            />
                                          </FormItem>
                                        )}

                                        <FormItem>
                                          <FormLabel>Cost Price</FormLabel>
                                          <Input name="cost_price" defaultValue={variation.cost_price} />
                                        </FormItem>

                                        <FormItem>
                                          <FormLabel>Selling Price</FormLabel>
                                          <Input name="selling_price" defaultValue={variation.selling_price} />
                                        </FormItem>

                                        <SheetFooter>
                                          <SheetClose asChild>
                                            <Button type="button" variant="outline">
                                              Cancel
                                            </Button>
                                          </SheetClose>
                                          <Button type="submit">
                                            Save Changes
                                            {updateProductMutation.isPending && <SmallSpinner className="ml-2" />}
                                          </Button>
                                        </SheetFooter>
                                      </form>
                                    </Form>
                                  </div>
                                </SheetContent>
                              </Sheet>

                              {/* Duplicate Variation Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleDuplicateVariation(product, variation)}
                                title="Duplicate variation"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>

                              <Select
                                value={variation.is_active ? "active" : "deactive"}
                                onValueChange={(value) => handleVariationStatusChange(variation.id, value === "active")}
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder="Select Action"
                                    className={cn(
                                      "h-10",
                                      variation.is_active
                                        ? "bg-[#E7F7EF] text-[#0CAF60] border-none"
                                        : "bg-[rgba(224,49,55,0.31)] text-[#E03137] border-none",
                                    )}
                                  />
                                  {isUpdatingVariationStatus && <SmallSpinner />}
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectItem className="h-9 text-xs" value="active">
                                      Active
                                    </SelectItem>
                                    <SelectItem className="h-9 text-xs" value="deactive">
                                      Inactive
                                    </SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this variation?")) {
                                    deleteVariationMutation.mutate(
                                      {
                                        productId: product.id,
                                        variationId: variation.id,
                                      },
                                      {
                                        onSuccess: () => {
                                          setSuccessMessage("Variation deleted successfully")
                                          isSuccessModal.setTrue()
                                        },
                                        onError: (error) => {
                                          const errMessage = extractErrorMessage((error as any)?.response?.data)
                                          setErrorMessage(errMessage || "Failed to delete variation")
                                          isErrorModal.setTrue()
                                        },
                                      },
                                    )
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No variations</p>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          isSheetOpen.setTrue()
                          setEditingProductId(product.id)

                          // Pre-fill the form with the existing product data
                          form.reset({
                            branch: product.branch?.id.toString() || "all",
                            name: product.name,
                            category_id: product.category.id,
                            category_name: product.category.name,
                            external_id: product.external_id || "",
                            image: {
                              file: null,
                              url: product.image || "",
                            },
                            variations: [
                              {
                                size: "",
                                cost_price: "",
                                selling_price: "",
                                layer: undefined,
                                max_flowers: undefined,
                                id: 0,
                              },
                            ],
                          })
                        }}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Variation
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right align-top">
                    <div className="flex justify-end gap-[10px]">
                      {/* Duplicate Product Button */}
                      <div
                        className="p-2 rounded-lg bg-[#10B981] flex items-center cursor-pointer"
                        onClick={() => handleDuplicateProduct(product)}
                        title="Duplicate product"
                      >
                        <Copy color="#fff" size={20} />
                      </div>

                      <div
                        className="p-2 rounded-lg bg-[#2F78EE] flex items-center cursor-pointer"
                        onClick={() => handleEditClick(product)}
                      >
                        <MdOutlineModeEdit color="#fff" size={20} />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        <section className="w-full flex justify-between items-center mt-6">
          <div>
            <Pagination className="flex justify-start">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (productsData?.previous_page) {
                        setCurrentPage(productsData.previous_page)
                      }
                    }}
                    className={!productsData?.previous_page ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {renderPaginationItems()}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (productsData?.next_page) {
                        setCurrentPage(productsData.next_page)
                      }
                    }}
                    className={!productsData?.next_page ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
          <div className="flex gap-4 items-center">
            <p className="text-xs text-[#687588] ">
              Showing {productsData?.data.length ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
              {productsData?.data.length ? (currentPage - 1) * pageSize + productsData.data.length : 0} of{" "}
              {productsData?.count} entries
            </p>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(Number(value))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="flex gap-4 bg-transparent border border-solid border-[#F1F2F4] text-[#111827] rounded-[10px] text-sm px-[10px]">
                <div className="flex items-center gap-4">
                  Show {pageSize}
                  <IoChevronUp />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {[10, 25, 50, 100].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </section>
      </section>

      <SuccessModal
        isModalOpen={isSuccessModal.state}
        closeModal={isSuccessModal.setFalse}
        heading="Success!"
        subheading={successMessage}
        buttonText="Okay"
      />

      <ErrorModal
        isErrorModalOpen={isErrorModal.state}
        setErrorModalState={isErrorModal.setState}
        heading="Something went wrong"
        subheading={errorMessage}
      />
    </>
  )
}

export default Page
