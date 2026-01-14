import React from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Badge } from "@/components/ui/badge";
import {
  Button,
  SelectSingleCombo,
  Textarea,
  SelectBranchCombo,
} from "@/components/ui";
import { Plus, User, X } from "lucide-react";
import { Add, Book } from "iconsax-react";
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
import CustomImagePicker from "./CustomImagePicker";
import { useGetCategories } from "../api/getCategories";
import toast from "react-hot-toast";
import { useLoading } from "@/contexts";
import useCloudinary from "@/hooks/useCloudinary";
import { extractErrorMessage } from "@/utils/errors";
import { useGetAllBranches } from "@/app/(dashboard)/admin/businesses/misc/api";
import { STORAGE_LOCATION_OPTIONS } from "@/constants";

const schema = z.object({
  name: z.string().min(1, { message: "Item name is required" }).max(255),
  description: z
    .string()
    .min(10, { message: "Item description must be at least 10 characters long" })
    .max(500, { message: "Item description must be at most 500 characters long" }),
  location: z.string().min(1, { message: "Storage location is required" }),
  // branch: z.number(),
  quantity: z
    .number()
    .int()
    .positive({ message: "Quantity must be a positive integer" }),
  max_quantity_required: z
    .number()
    .int()
    .positive({ message: "Max quantity must be a positive integer" }),
  minimum_quantity_required: z
    .number()
    .int()
    .positive({ message: "Min quantity must be a positive integer" }),
  cost_price: z
    .number()
    .int()
    .positive({ message: "Cost price must be a positive integer" }),
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
        return file.size <= 1000000;
      },

      {
        message: "Max image size is 10MB.",
      }
    ),
});

type FormType = z.infer<typeof schema>;

const createStoreInventory = async (data: FormType) => {
  // console.log(data);
  const res = await APIAxios.post("/inventory/create-store-inventory/", data, {
    // headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export default function NewStoreInventorySheet() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    reset,
  } = useForm<FormType>({
    resolver: zodResolver(schema),
  });

  const { data: categories, isLoading: categoriesLoading } = useGetCategories();
  const { data: branches, isLoading: branchesLoading } = useGetAllBranches();

  const queryClient = useQueryClient();
  const { mutate: createStoreInvetory, isPending: isCreating } = useMutation({
    mutationFn: createStoreInventory,
    onSuccess: () => {
      reset();
      toast.success("Store Inventory created successfully");
      queryClient.invalidateQueries({ queryKey: ["storeInventory"] });
    },
    onError(error, variables, context) {
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage);
    },
  });
  const { uploadToCloudinary } = useCloudinary();
  const { isUploading } = useLoading();

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
    createStoreInvetory(dataToSubmit, {});
  };
  console.log(errors);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="default" className="bg-black text-white">
          <Plus className="mr-2 h-4 w-4" /> Add New Store Item
        </Button>
      </SheetTrigger>

      <SheetContent className="!w-[80vw] !max-w-[450px] h-screen flex flex-col overflow-y-scroll px-0">
        <SheetTitle className="border-b pb-4 px-8">
          <h2 className="text-xl font-semibold flex items-center gap-4">
            <span className="bg-[#E8EEFD] p-2 rounded-full">
              <Book size={25} variant="Bold" color="#194A7A" />
            </span>
            <span>Add Store Inventory</span>
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

          <Controller
            name="location"
            control={control}
            render={({ field }) => (
              <SelectSingleCombo
                {...field}
                name="location"
                value={field.value?.toString() || ""}
                options={STORAGE_LOCATION_OPTIONS}
                valueKey="value"
                labelKey="label"
                placeholder="Storage Location"
                onChange={(value) => field.onChange(value)}
                isLoadingOptions={categoriesLoading}
                hasError={!!errors.location}
                errorMessage={errors.location?.message}
              />
            )}
          />

          {/* <Controller
            name="branch"
            control={control}
            render={({ field }) => (
              <SelectBranchCombo
                value={field.value?.toString() || ""}
                onChange={(v) => field.onChange(Number(v))}
                name="branch"
                placeholder="Select Branch"
                variant="inputButton"
                isLoadingOptions={branchesLoading}
              />
            )}
          /> */}

          <Input
            type="number"
            placeholder="Quantity"
            hasError={!!errors.quantity}
            errorMessage={errors.quantity?.message}
            pattern="[0-9]*"
            {...register("quantity", { valueAsNumber: true })}
          />

          <Input
            type="number"
            placeholder="Min Quantity"
            hasError={!!errors.minimum_quantity_required}
            errorMessage={errors.minimum_quantity_required?.message}
            pattern="[0-9]*"
            {...register("minimum_quantity_required", { valueAsNumber: true })}
          />

          <Input
            type="number"
            placeholder="Max Quantity"
            hasError={!!errors.max_quantity_required}
            errorMessage={errors.max_quantity_required?.message}
            pattern="[0-9]*"
            {...register('max_quantity_required', { valueAsNumber: true })}
          />

          <Input
            type="number"
            placeholder="Cost Price/Unit"
            hasError={!!errors.cost_price}
            errorMessage={errors.cost_price?.message}
            pattern="[0-9]*"
            {...register("cost_price", { valueAsNumber: true })}
          />

          <div className="flex items-center gap-4 mt-auto">
            <SheetClose asChild>
              <Button type="button" className="h-14 w-full" variant="outline">
                Close
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
  );
}
