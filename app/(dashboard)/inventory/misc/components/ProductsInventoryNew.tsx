import React from "react";
import * as z from "zod";
import toast from "react-hot-toast";
import { Add, Book } from "iconsax-react";
import { Plus, User, X } from "lucide-react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { useGetAllBranches } from "@/app/(dashboard)/admin/businesses/misc/api/getAllBranches";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AmountInput,
  Button,
  SelectSingleCombo,
  Textarea,
} from "@/components/ui";
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
import useErrorModalState from "@/hooks/useErrorModalState";
import { extractErrorMessage, formatAxiosErrorMessage } from "@/utils/errors";
import { useLoading } from "@/contexts";
import useCloudinary from "@/hooks/useCloudinary";

import CustomImagePicker from "./CustomImagePicker";
import { useGetProductCategories } from "../api";

const variationSchema = z.object({
  size: z.string().min(1, { message: "Size is required" }),
  max_quantity_required: z
    .number()
    .int()
    .nonnegative({ message: "Max quantity must be 0 or more" }),
  minimum_quantity_required: z
    .number()
    .int()
    .nonnegative({ message: "Min quantity must be 0 or more" }),
  location: z.string().min(1, { message: "Location is required" }).max(255),
  quantity: z
    .number()
    .int()
    .positive({ message: "Quantity must be a positive integer" }),
});

const MAX_FILE_SIZE = 1000000;

const schema = z.object({
  name: z
    .string()
    .min(1, { message: "Item name is required" })
    .max(255, { message: "Item name must be at most 255 characters long" }),
  // branch: z.number({ required_error: "Branch is required" }),
  description: z
    .string()
    .min(10, {
      message: "Item description must be at least 10 characters long",
    })
    .max(500, {
      message: "Item description must be at most 500 characters long",
    }),
  category: z.number(),
  image_one: z
    .any()
    .nullable()
    .refine(
      (file) => {
        if (!file) {
          throw z.ZodError.create([
            {
              path: ["image_one"],
              message: "Please select a file.",
              code: "custom",
            },
          ]);
        }
        if (!file.type.startsWith("image/")) {
          throw z.ZodError.create([
            {
              path: ["image_one"],
              message: "Please select an image file.",
              code: "custom",
            },
          ]);
        }
        return file.size <= MAX_FILE_SIZE;
      },

      {
        message: "Max image size is 10MB.",
      }
    ),
  variations: z
    .array(variationSchema)
    .min(1, { message: "At least one variation is required" }),
});

type FormType = z.infer<typeof schema>;

const createProductInventory = async (data: FormType) => {
  // console.log(data);
  const res = await APIAxios.post("/inventory/create-product-inventory/", data);
  return res.data;
};

export default function NewProductInventorySheet() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    reset,
  } = useForm<FormType>({
    resolver: zodResolver(schema),
    defaultValues: {
      image_one: null,
      category: undefined,
      // branch: undefined,
      variations: [
        {
          size: "4",
          quantity: 1,
          max_quantity_required: 0,
          minimum_quantity_required: 0,
          location: "",
        },
      ],
    },
  });

  const { data: branches, isLoading: branchesLoading } = useGetAllBranches();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "variations",
  });

  const { data: categories, isLoading: categoriesLoading } =
    useGetProductCategories();
  const {
    isErrorModalOpen,
    errorModalMessage,
    openErrorModalWithMessage,
    closeErrorModal,
    setErrorModalState,
  } = useErrorModalState();

  const queryClient = useQueryClient();
  const { uploadToCloudinary } = useCloudinary();
  const { isUploading } = useLoading();
  const { mutate: createProductInvetory, isPending: isCreating } = useMutation({
    mutationFn: createProductInventory,
    onSuccess: () => {
      reset({
        image_one: null,
        category: 8,
        variations: [{ size: "4", quantity: 1 }],
      });
      setValue("image_one", null);
      toast.success("Product Inventory created successfully");
      queryClient.invalidateQueries({ queryKey: ["productsInventory"] });
    },
    onError: (error: unknown) => {
      const errorMessage =
        extractErrorMessage(error) || formatAxiosErrorMessage(error as any);
      openErrorModalWithMessage(errorMessage);
    },
  });

  const onSubmit = async (data: FormType) => {
    let image_one: string | undefined;
    const imageFile = data.image_one;
    if (data.image_one) {
      const data = await uploadToCloudinary(imageFile);
      image_one = data.secure_url;
    }
    const dataToSubmit = {
      ...data,
      image_one: imageFile ? image_one : undefined,
    };
    createProductInvetory(dataToSubmit);
  };
  console.log(errors);

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
                      {...register(`variations.${index}.quantity`, {
                        valueAsNumber: true,
                      })}
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
                          {...register(`variations.${index}.max_quantity_required`, {
                            valueAsNumber: true,
                          })}
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
                          {...register(`variations.${index}.minimum_quantity_required`, {
                            valueAsNumber: true,
                          })}
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
                          options={[
                            { label: "Reception Shelf", value: "Reception Shelf" },
                            { label: "Main Store", value: "Main Store" },
                            { label: "Mini Store", value: "Mini Store" },
                            { label: "Processing Room", value: "Processing Room" },
                            { label: "Kitchen", value: "Kitchen" },
                            { label: "Cold Room", value: "Cold Room" },
                          ]}
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
                  quantity: 1,
                  size: "",
                  max_quantity_required: 0,
                  minimum_quantity_required: 0,
                  location: "",
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
