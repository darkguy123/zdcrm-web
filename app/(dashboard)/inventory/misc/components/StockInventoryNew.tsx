"use client";

import React, { useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Plus, User, X } from "lucide-react";
import { Add, Book } from "iconsax-react";
import toast from "react-hot-toast";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AmountInput,
  Button,
  SelectSingleCombo,
  Textarea,
} from "@/components/ui";
import { PRODUCT_TYPES_OPTIONS, STORAGE_LOCATION_OPTIONS } from "@/constants";
import useCloudinary from "@/hooks/useCloudinary";
import { useLoading } from "@/contexts";
import useErrorModalState from "@/hooks/useErrorModalState";
import { extractErrorMessage, formatAxiosErrorMessage } from "@/utils/errors";
import { Separator } from "@radix-ui/react-select";
import {
  Input,
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { APIAxios } from "@/utils/axios";
import ErrorModal from "@/components/ui/modal-error";

import CustomImagePicker from "./CustomImagePicker";
import { useGetStockCategories } from "../api";
import { useGetAllBranches } from "@/app/(dashboard)/admin/businesses/misc/api/getAllBranches";

const MAX_FILE_SIZE = 1000000;

const variationSchema = z.object({
  location: z.string().min(1, "Storage Location is required"),

  minimum_quantity_required: z.coerce
    .number({ required_error: "Minimum Quantity is required" })
    .int()
    .min(1, "Minimum Quantity must be greater than 0"),

  max_quantity_required: z.coerce
    .number({ required_error: "Maximum Quantity is required" })
    .int()
    .min(1, "Maximum Quantity must be greater than 0"),

  size: z.string().optional(),
  color: z.string().optional(),
  flavour: z.string().optional(),

  quantity: z.coerce.number().optional(),
});

const schema = z
  .object({
    name: z.string().min(1, "Item name is required"),

    category: z.coerce
      .number({ invalid_type_error: "Category is required" })
      .int()
      .min(1, "Category is required"),

    description: z.string().optional(),

    image_one: z
      .instanceof(File)
      .nullable()
      .optional(),

    variations: z.array(variationSchema).min(1),
  })
  .superRefine((data, ctx) => {
    data.variations.forEach((v, index) => {
      if (data.category === 8 && !v.size) {
        ctx.addIssue({
          path: ["variations", index, "size"],
          message: "Size is required",
          code: z.ZodIssueCode.custom,
        });
      }

      if (data.category === 9 && !v.color) {
        ctx.addIssue({
          path: ["variations", index, "color"],
          message: "Color is required",
          code: z.ZodIssueCode.custom,
        });
      }

      if (data.category === 10 && !v.flavour) {
        ctx.addIssue({
          path: ["variations", index, "flavour"],
          message: "Flavour is required",
          code: z.ZodIssueCode.custom,
        });
      }
    });
  });




type StockInventoryPayload = Omit<FormType, "image_one"> & {
  image_one?: string;
};


type FormType = z.infer<typeof schema>;

const createStockInventory = async (
  data: StockInventoryPayload
) => {
  const res = await APIAxios.post("/inventory/create-stock-inventory/", data);
  return res.data;
};

export default function NewInventorySheet() {
  const { data: branches, isLoading: branchesLoading } = useGetAllBranches();
  const [open, setOpen] = React.useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
    reset,
  } = useForm<FormType>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      category: undefined,
      description: "",
      image_one: null,
      variations: [
        {
          location: "",
          minimum_quantity_required: 0,
          max_quantity_required: 0,
          size: "",
          quantity: undefined,
        },
      ],
    },


  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variations",
  });

  const { data: categories, isLoading: categoriesLoading } =
    useGetStockCategories();
  const { uploadToCloudinary } = useCloudinary();
  const { isUploading } = useLoading();
  const {
    isErrorModalOpen,
    errorModalMessage,
    openErrorModalWithMessage,
    closeErrorModal,
    setErrorModalState,
  } = useErrorModalState();

  const queryClient = useQueryClient();
  const { mutate: createStockInvetory, isPending: isCreating } = useMutation({
    mutationFn: createStockInventory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-inventory-list"] });
      toast.success("Stock inventory created successfully");
      reset();
      setValue("image_one", null);
      setOpen(false);
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.error?.summary ||
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong";
      openErrorModalWithMessage(errorMessage);
      reset();
      setValue("image_one", null);
    },

  });

  const onSubmit = async (data: FormType) => {
    console.log(data);
    let image_one: string | undefined;

    if (data.image_one instanceof File) {
      const uploaded = await uploadToCloudinary(data.image_one);
      image_one = uploaded.secure_url;
    }

    const payload = {
      name: data.name,
      category: data.category,
      description: data.description,
      variations: data.variations.map((v) => {
        const base = {
          location: v.location,
          minimum_quantity_required: v.minimum_quantity_required,
          max_quantity_required: v.max_quantity_required,
          quantity: v.quantity,
        };

        if (data.category === 8) {
          return {
            ...base,
            size: v.size,
          };
        }

        if (data.category === 9) {
          return {
            ...base,
            color: v.color,
          };
        }

        if (data.category === 10) {
          return {
            ...base,
            flavour: v.flavour,
          };
        }

        return base;
      }),
      ...(image_one ? { image_one } : {}),
    };


    createStockInvetory(payload);

  };

  const selectedCategoryName = categories?.find(
    (cat) => cat.id === watch("category")
  )?.name;

  const errorMessage = errors?.variations?.root?.message || errors?.root?.message;

  useEffect(() => {
    if (errorMessage) {
      openErrorModalWithMessage(errorMessage);
    }
  }, [errorMessage]);

  // const watchCat = watch("category")
  // console.log(watchCat)

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="default" className="bg-black text-white">
            <Plus className="mr-2 h-4 w-4" /> Add New Stock Item
          </Button>
        </SheetTrigger>

        <SheetContent className="!w-[80vw] !max-w-[450px] h-screen flex flex-col overflow-y-scroll px-0">
          <SheetTitle className="border-b pb-4 px-8">
            <h2 className="text-xl font-semibold flex items-center gap-4">
              <span className="bg-[#E8EEFD] p-2 rounded-full">
                <Book size={25} variant="Bold" color="#194A7A" />
              </span>
              <span>Add Inventory</span>
            </h2>
          </SheetTitle>
          <SheetClose className="absolute top-full left-[-100%]">
            <Add className="mr-2 h-6 w-6 rotate-45" />
          </SheetClose>

          <Separator />

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grow flex flex-col gap-8 px-8 py-10"
          >
            <CustomImagePicker
              control={control}
              name="image_one"
              errors={errors}
              hasError={!!errors.image_one}
              errorMessage={errors.image_one?.message as string}
            />
            {/* 
            <Controller
              name="branch"
              control={control}
              render={({ field }) => (
                <SelectSingleCombo
                  {...field}
                  name="branch"
                  value={field.value?.toString() || ""}
                  options={
                    branches?.data?.map((branch) => ({
                      label: branch.name,
                      value: branch.id.toString(),
                    })) || []
                  }
                  valueKey="value"
                  labelKey="label"
                  placeholder="Branch"
                  onChange={(value) => field.onChange(Number(value))}
                  isLoadingOptions={branchesLoading}
                  hasError={!!errors.branch}
                  errorMessage={errors.branch?.message}
                />
              )}
              /> */}
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <SelectSingleCombo
                  {...field}
                  name="category"
                  value={field.value?.toString() || ""}
                  options={
                    categories?.map((cat) => ({
                      label: cat.name,
                      value: cat.id.toString(),
                    })) || []
                  }
                  valueKey="value"
                  labelKey="label"
                  placeholder="Category"
                  onChange={(value) => field.onChange(Number(value))}
                  isLoadingOptions={categoriesLoading}
                  hasError={!!errors.category}
                  errorMessage={errors.category?.message}
                />
              )}
            />
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value?.toString() ?? ""}
                  placeholder="Item name"
                  hasError={!!errors.name}
                  errorMessage={errors.name?.message}
                />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  value={field.value?.toString() ?? ""}
                  placeholder="Item description"
                  hasError={!!errors.description}
                  errorMessage={errors.description?.message}
                />
              )}
            />


            {fields.map((field, index) => (
              <div key={field.id} className="space-y-4">
                <h3 className="font-semibold">Variation {index + 1}</h3>
                {watch("category") === 8 && (
                  <Controller
                    name={`variations.${index}.size`}
                    control={control}
                    render={({ field }) => (
                      <SelectSingleCombo
                        options={PRODUCT_TYPES_OPTIONS.Cakes.sizes}
                        label="Size"
                        valueKey="value"
                        labelKey="label"
                        placeholder="Select Size"
                        {...field}
                        hasError={!!errors.variations?.[index]?.size}
                        errorMessage={
                          errors.variations?.[index]?.size?.message as string
                        }
                      />
                    )}
                  />
                )}
                {watch("category") == 9 && (
                  <Controller
                    name={`variations.${index}.color`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Color"
                        value={field.value}
                        placeholder="Item color"
                        hasError={!!errors.variations?.[index]?.color}
                        errorMessage={
                          errors.variations?.[index]?.color?.message as string
                        }
                      />
                    )}
                  />
                )}
                {watch("category") === 10 && (
                  <Controller
                    name={`variations.${index}.flavour`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value || ""}
                        label="Flavour"
                        placeholder="Enter flavour"
                        hasError={!!errors.variations?.[index]?.flavour}
                        errorMessage={
                          errors.variations?.[index]?.flavour?.message
                        }
                      />
                    )}
                  />
                )}

                <Controller
                  name={`variations.${index}.quantity`}
                  control={control}
                  render={({ field }) => (
                    <AmountInput
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      type="number"
                      label="Quantity"
                      placeholder="Quantity"
                      pattern="^[0-9]*$"
                      hasError={!!errors.variations?.[index]?.quantity}
                      errorMessage={
                        errors.variations?.[index]?.quantity?.message
                      }
                    />
                  )}
                />
                <Controller
                  name={`variations.${index}.max_quantity_required`}
                  control={control}
                  render={({ field }) => (
                    <AmountInput
                      {...field}
                      {...register(
                        `variations.${index}.max_quantity_required`,
                        {
                          valueAsNumber: true,
                        }
                      )}
                      type="number"
                      label="Max Quantity Required"
                      placeholder="Max Quantity"
                      pattern="^[0-9]*$"
                      hasError={
                        !!errors.variations?.[index]?.max_quantity_required
                      }
                      errorMessage={
                        errors.variations?.[index]?.max_quantity_required
                          ?.message
                      }
                    />
                  )}
                />
                <Controller
                  name={`variations.${index}.minimum_quantity_required`}
                  control={control}
                  render={({ field }) => (
                    <AmountInput
                      {...field}
                      {...register(
                        `variations.${index}.minimum_quantity_required`,
                        {
                          valueAsNumber: true,
                        }
                      )}
                      type="number"
                      label="Min Quantity Required"
                      placeholder="Min Quantity"
                      pattern="^[0-9]*$"
                      hasError={
                        !!errors.variations?.[index]?.minimum_quantity_required
                      }
                      errorMessage={
                        errors.variations?.[index]?.minimum_quantity_required
                          ?.message
                      }
                    />
                  )}
                />


                <Controller
                  name={`variations.${index}.location`}
                  control={control}
                  render={({ field }) => (
                    <SelectSingleCombo
                      {...field}
                      name={`variations.${index}.location`}
                      value={field.value?.toString() || ""}
                      options={STORAGE_LOCATION_OPTIONS}
                      valueKey="value"
                      labelKey="label"
                      placeholder="Storage Location"
                      onChange={(value) => field.onChange(value)}
                      isLoadingOptions={categoriesLoading}
                      hasError={!!errors.variations?.[index]?.location}
                      errorMessage={
                        errors.variations?.[index]?.location?.message
                      }
                    />
                  )}
                />

                {index > 0 && (
                  <Button
                    type="button"
                    onClick={() => remove(index)}
                    variant="outline"
                  >
                    Remove Variation
                  </Button>
                )}
              </div>
            ))}

            <Button
              type="button"
              onClick={() =>
                append({
                  location: "",
                  minimum_quantity_required: 0,
                  max_quantity_required: 0,
                  size: "",
                  color: "",
                  flavour: "",
                  quantity: undefined,
                })
              }
              variant="outline"
            >
              Add Variation
            </Button>


            <div className="flex items-center gap-4 mt-auto">
              <SheetClose asChild>
                <Button type="button" className="h-14 w-full" variant="outline">
                  Cancel
                </Button>
              </SheetClose>
              <Button
                type="submit"
                className="h-14 w-full"
                variant="black"
                disabled={!isDirty || isCreating || isUploading}
              >
                {isCreating || isUploading ? "Saving..." : "Save Record"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet >

      <ErrorModal
        heading="An error Occured"
        subheading={errorModalMessage || "Check your inputs"}
        isErrorModalOpen={isErrorModalOpen}
        setErrorModalState={setErrorModalState}
      >
        <div className="p-5 rounded-t-2xl rounded-b-3xl bg-red-200">
          <Button
            variant="destructive"
            className="w-full"
            onClick={closeErrorModal}
          >
            Okay
          </Button>
        </div>
      </ErrorModal>
    </>
  );
}
