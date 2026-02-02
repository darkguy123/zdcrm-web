"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner, SelectSingleCombo } from "@/components/ui";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { APIAxios } from "@/utils/axios";
import { TUser } from "../api/getAllUsers";
import toast from "react-hot-toast";

const editEmployeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  role: z.string().min(1, "Role is required"),
  // branch_ids: z.array(z.string()).min(1, "At least one branch must be selected"),
  is_active: z.boolean(),
});

type EditEmployeeFormData = z.infer<typeof editEmployeeSchema>;

interface EditEmployeeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser: TUser | null;
  rolesData: any;
  isLoadingRoles: boolean;
}

const EditEmployeeSheet: React.FC<EditEmployeeSheetProps> = ({
  isOpen,
  onClose,
  selectedUser,
  rolesData,
  isLoadingRoles,
}) => {
  const queryClient = useQueryClient();

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EditEmployeeFormData>({
    resolver: zodResolver(editEmployeeSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "",
      // branch_ids: [],
      is_active: true,
    },
  });

  const { mutate: updateSingleUser, isPending: isUpdatingUser } = useMutation({
    mutationFn: (userData: { id: number } & Partial<EditEmployeeFormData>) =>
      APIAxios.put(`/auth/edit-user/${userData.id}/`, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getAllUsers"] });
      toast.success("Employee updated successfully");
      onClose();
      reset();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update employee");
    },
  });

  // Reset form when selectedUser changes
  React.useEffect(() => {
    if (selectedUser && isOpen) {
      reset({
        name: selectedUser.name,
        email: selectedUser.email,
        phone: selectedUser.phone || "",
        role: selectedUser.role_name,
        // branch_ids: selectedUser.branches?.map((id) => id.toString()) || [],
        is_active: selectedUser.is_active,
      });
    }
  }, [selectedUser, isOpen, reset]);

  const onSubmitEdit = (data: EditEmployeeFormData) => {
    if (!selectedUser) return;
    updateSingleUser({
      id: selectedUser.id,
      ...data,
    });
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  const initialBranches = selectedUser?.branches?.map((id, index) => ({
    id: String(id),
    name: selectedUser.branch_names[index]
  })) || [];


  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto ">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold pb-4">
            Edit Employee Details
          </SheetTitle>
          <SheetDescription>
            Update employee information and permissions.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmitEdit)} className="flex flex-col gap-6 mt-6">
          <div className="flex flex-col gap-3">
            <Label htmlFor="edit-name" className="text-[#111827]">
              Employee Name <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="edit-name"
                  type="text"
                  className="h-14"
                  placeholder="Enter employee's name"
                  hasError={!!errors.name}
                  errorMessage={errors?.name?.message}
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="edit-email" className="text-[#111827]">
              Employee Email <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="edit-email"
                  type="email"
                  className="h-14"
                  placeholder="Enter email address"
                  hasError={!!errors.email}
                  errorMessage={errors?.email?.message}
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="edit-phone" className="text-[#111827]">
              Phone Number
            </Label>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="edit-phone"
                  type="tel"
                  className="h-14"
                  placeholder="Enter phone number"
                  hasError={!!errors.phone}
                  errorMessage={errors?.phone?.message}
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label className="text-[#111827]">
              Role <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <SelectSingleCombo
                  isLoadingOptions={isLoadingRoles}
                  valueKey="name"
                  labelKey="name"
                  options={rolesData?.data || []}
                  onChange={(value) => field.onChange(value)}
                  name="role"
                  placeholder="Select role"
                  value={field.value}
                  hasError={!!errors.role}
                  errorMessage={errors?.role?.message}
                />
              )}
            />
          </div>

          {/* <div className="flex flex-col gap-3">
            <Label className="text-[#111827]">
              Branch Access <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="branch_ids"
              control={control}
              render={({ field }) => (
                <SelectBranchMultiCombo
                  value={field.value}
                  onChange={(vals) => field.onChange(vals)}
                  name="branch_ids"
                  placeholder="Select branch(es)"
                  initialSelectedOptions={initialBranches}
                  hasError={!!errors.branch_ids}
                  errorMessage={errors?.branch_ids ? String((errors.branch_ids as any)?.message ?? (errors.branch_ids as any)) : undefined}
                />
              )}
            />
          </div> */}

          <div className="flex flex-col gap-3">
            <Label className="text-[#111827]">
              Account Status
            </Label>
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ? "active" : "inactive"}
                  onValueChange={(value) => field.onChange(value === "active")}
                >
                  <SelectTrigger className="h-14">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </form>

        <SheetFooter className="mt-8 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="w-full h-14"
            onClick={handleClose}
            disabled={isUpdatingUser}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="w-full bg-[#111827] h-14"
            disabled={isUpdatingUser}
            onClick={handleSubmit(onSubmitEdit)}
          >
            {isUpdatingUser ? (
              <>
                <Spinner size={18} className="mr-2" />
                Updating...
              </>
            ) : (
              "Update Employee"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default EditEmployeeSheet;