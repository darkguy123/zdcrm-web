"use client";

import React from "react";
import * as z from "zod";
import toast from "react-hot-toast";
import { Add, Book } from "iconsax-react";
import { Plus } from "lucide-react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  AmountInput,
  Button,
  SelectSingleCombo,
  Textarea,
} from "@/components/ui";
import {
  Input,
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui";
import { Separator } from "@radix-ui/react-select";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { APIAxios } from "@/utils/axios";
import ErrorModal from "@/components/ui/modal-error";
import useErrorModalState from "@/hooks/useErrorModalState";
import { extractErrorMessage, formatAxiosErrorMessage } from "@/utils/errors";
import { useLoading } from "@/contexts";
import useCloudinary from "@/hooks/useCloudinary";

import CustomImagePicker from "./CustomImagePicker";
import { useGetProductCategories } from "../api";
import { STORAGE_LOCATION_OPTIONS } from "@/constants";

/* =======================
   ZOD SCHEMA
======================= */

const variationSchema = z
  .object({
    size: z.string().min(1, "Size is required"),
    location: z.string().min(1, "Storage location is required"),

    minimum_quantity_required: z.coerce
      .number()
      .int()
      .min(1, "Minimum Quantity must be greater than 0")
      .optional(),

    max_quantity_required: z.coerce
      .number()
      .int()
      .min(1, "Maximum Quantity must be greater than 0")
      .optional(),

    quantity: z.coerce.number().optional(),
  })
  .refine(
    (v) =>
      v.minimum_quantity_required !== undefined &&
      v.max_quantity_required !== undefined,
    {
      message: "Minimum and Maximum Quantity are required",
      path: ["minimum_quantity_required"],
    }
  );


const MAX_FILE_SIZE = 1_000_000;

const schema = z.object({
  name: z.string().min(1, "Item name is required"),
  category: z.number(),
  description: z.string().optional(),
  image_one: z
    .instanceof(File)
    .optional()
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, {
      message: "Image must be less than 1MB",
    }),
  variations: z.array(variationSchema).min(1),
});

type FormType = z.infer<typeof schema>;

type Payload = Omit<FormType, "image_one"> & {
  image_one?: string;
};

/* =======================
   API
======================= */

const createProductInventory = async (data: Payload) => {
  const res = await APIAxios.post(
    "/inventory/create-product-inventory/",
    data
  );
  return res.data;
};

/* =======================
   COMPONENT
======================= */

export default function NewProductInventorySheet() {
  const queryClient = useQueryClient();
  const { uploadToCloudinary } = useCloudinary();
  const { isUploading } = useLoading();
  const {
    isErrorModalOpen,
    errorModalMessage,
    openErrorModalWithMessage,
    closeErrorModal,
    setErrorModalState,
  } = useErrorModalState();

  const { data: categories, isLoading: categoriesLoading } =
    useGetProductCategories();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<FormType>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      category: undefined,
      description: "",
      image_one: undefined,
      variations: [
        {
          size: "",
          location: "",
          minimum_quantity_required: undefined,
          max_quantity_required: undefined,
          quantity: undefined,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variations",
  });

  const { mutate, isPending: isCreating } = useMutation({
    mutationFn: createProductInventory,
    onSuccess: () => {
      toast.success("Product inventory created successfully");
      queryClient.invalidateQueries({ queryKey: ["productsInventory"] });
      reset();
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.error?.summary ||
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong";
      openErrorModalWithMessage(errorMessage);
    },
  });

  /* =======================
     SUBMIT
  ======================= */

  const onSubmit = async (data: FormType) => {
    let image_one: string | undefined;

    if (data.image_one instanceof File) {
      const uploaded = await uploadToCloudinary(data.image_one);
      image_one = uploaded.secure_url;
    }

    const payload: Payload = {
      name: data.name,
      category: data.category,
      description: data.description,
      image_one,
      variations: data.variations.map((v) => ({
        size: v.size,
        location: v.location,
        minimum_quantity_required: v.minimum_quantity_required,
        max_quantity_required: v.max_quantity_required,
        quantity: v.quantity,
      })),
    };

    mutate(payload);
  };

  /* =======================
     UI
  ======================= */

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="default" className="bg-black text-white">
            <Plus className="mr-2 h-4 w-4" /> Add New Product Item
          </Button>
        </SheetTrigger>

        <SheetContent className="!w-[80vw] !max-w-[450px] h-screen flex flex-col overflow-y-scroll px-0">
          <SheetTitle className="border-b pb-4 px-8">
            <h2 className="text-xl font-semibold flex items-center gap-4">
              <span className="bg-[#E8EEFD] p-2 rounded-full">
                <Book size={25} variant="Bold" color="#194A7A" />
              </span>
              <span>Add Product Inventory</span>
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

            {/* <Controller
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

                <Controller
                  name={`variations.${index}.size`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Size"
                      value={field.value}
                      placeholder="Item size"
                      hasError={!!errors.variations?.[index]?.size}
                      errorMessage={
                        errors.variations?.[index]?.size?.message as string
                      }
                    />
                  )}
                />

                <Controller
                  name={`variations.${index}.quantity`}
                  control={control}
                  render={({ field }) => (
                    <AmountInput
                      {...field}
                      {...register(
                        `variations.${index}.quantity`,
                        {
                          valueAsNumber: true,
                        }
                      )}
                      type="number"
                      label="Quantity"
                      placeholder="Quantity"
                      pattern="^[0-9]*$"
                      hasError={!!errors.variations?.[index]?.quantity}
                      errorMessage={
                        errors.variations?.[index]?.quantity?.message
                      }
                    // onChange={(e) => field.onChange(Number(e.target.value))}
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
                      hasError={!!errors.variations?.[index]?.max_quantity_required}
                      errorMessage={
                        errors.variations?.[index]?.max_quantity_required?.message
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
                      hasError={!!errors.variations?.[index]?.minimum_quantity_required}
                      errorMessage={
                        errors.variations?.[index]?.minimum_quantity_required?.message
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
                  minimum_quantity_required: undefined,
                  max_quantity_required: undefined,
                  size: "",
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
      </Sheet>

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
