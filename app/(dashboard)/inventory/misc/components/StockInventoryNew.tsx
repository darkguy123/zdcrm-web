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
import { error } from "console";

// const variationSchema = z.object({
//   size: z.string().optional(),
//   color: z.string().optional(),
//   flavour: z.string().optional(),
//   quantity: z
//     .number()
//     .int()
//     .positive({ message: "Quantity must be a positive integer" }),
//   max_quantity_required: z
//     .number()
//     .int()
//     .nonnegative({ message: "Max quantity must be 0 or more" })
//     .optional(),
//   minimum_quantity_required: z
//     .number()
//     .int()
//     .nonnegative({ message: "Min quantity must be 0 or more" })
//     .optional(),
//   location: z.string().min(1, { message: "Location is required" }).max(255),
// });

// const MAX_FILE_SIZE = 1000000;

// const schema = z
//   .object({
//     name: z.string().min(1, { message: "Item name is required" }).max(255),
//     description: z
//       .string()
//       .min(10, { message: "Item description is required" })
//       .max(300),
//     category: z.number(),
//     // branch: z.number({ required_error: "Branch is required" }),
//     image_one: z
//       .any()
//       .nullable()
//       .refine(
//         (file) => {
//           if (!file) {
//             throw z.ZodError.create([
//               {
//                 path: ["image_one"],
//                 message: "Please select a file.",
//                 code: "custom",
//               },
//             ]);
//           }
//           if (!file.type.startsWith("image/")) {
//             throw z.ZodError.create([
//               {
//                 path: ["image_one"],
//                 message: "Please select an image file.",
//                 code: "custom",
//               },
//             ]);
//           }
//           return file.size <= MAX_FILE_SIZE;
//         },

//         {
//           message: "Max image size is 10MB.",
//         }
//       ),
//     variations: z
//       .array(variationSchema)
//       .min(1, { message: "At least one variation is required" }),
//   })
//   .refine(
//     (data) => {
//       const category = data.category;
//       return data.variations.every((variation) => {
//         if (category === 8) {
//           return !!variation.size;
//         } else if (category === 9) {
//           return !!variation.color;
//         } else if (category === 10) {
//           return !!variation.flavour;
//         }
//         return true;
//       });
//     },
//     {
//       path: ["variations"],
//       message:
//         "Variations must include the correct fields based on the selected category",
//     }
//   );

const MAX_FILE_SIZE = 1000000;

const variationSchema = z.object({
  location: z.string().min(1, "Storage Location is required"),

  minimum_quantity_required: z.coerce
    .number()
    .int()
    .nonnegative("Minimum quantity must be 0 or more"),

  max_quantity_required: z.coerce
    .number()
    .int()
    .nonnegative("Maximum quantity must be 0 or more"),

  // optional
  size: z.string().optional(),
  color: z.string().optional(),
  flavour: z.string().optional(),
  quantity: z.coerce.number().optional(),
});


const schema = z.object({
  name: z.string().min(1, "Item name is required"),
  category: z.number(),
  description: z.string().optional(),

  image_one: z
    .instanceof(File)
    .nullable()
    .optional()
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, {
      message: "Image must be less than 1MB",
    }),

  variations: z.array(variationSchema).min(1),
});


type StockInventoryPayload = Omit<FormType, "image_one"> & {
  image_one?: string;
};


type FormType = z.infer<typeof schema>;

const createStockInventory = async (
  data: StockInventoryPayload
) => {
  console.log(data);
  const res = await APIAxios.post("/inventory/create-stock-inventory/", data);
  return res.data;
};

export default function NewInventorySheet() {
  const { data: branches, isLoading: branchesLoading } = useGetAllBranches();
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
      image_one: undefined,
      variations: [{
        location: "",
        minimum_quantity_required: undefined,
        max_quantity_required: undefined,
        size: "",
        quantity: undefined,
      }],
    }

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
      queryClient.invalidateQueries({ queryKey: ["stockInventory"] });
      toast.success("Stock inventory created successfully");
      reset();
      setValue("image_one", null);
    },
    onError: (error: unknown) => {
      const errorMessage =
        extractErrorMessage(error) || formatAxiosErrorMessage(error as any);
      openErrorModalWithMessage(errorMessage);
    },
  });

  const onSubmit = async (data: FormType) => {
    if (data.category === 8) {
      data.variations.forEach((variation) => {
        delete variation.color;
        delete variation.flavour;
      });
    } else if (data.category === 9) {
      data.variations.forEach((variation) => {
        delete variation.size;
        delete variation.flavour;
      });
    } else if (data.category === 10) {
      data.variations.forEach((variation) => {
        delete variation.size;
        delete variation.color;
      });
    }
    let image_one: string | undefined;

    const imageFile = data.image_one;

    if (imageFile instanceof File) {
      const uploaded = await uploadToCloudinary(imageFile);
      image_one = uploaded.secure_url;
    }

    const dataToSubmit = {
      ...data,
      image_one,
    };

    createStockInvetory(dataToSubmit);
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

  return (
    <>
      <Sheet>
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
