"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CiSearch } from "react-icons/ci";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MdOutlineModeEdit } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { IoChevronUp } from "react-icons/io5";
import { useBooleanStateControl } from "@/hooks";
import { ConfirmDeleteModal, Spinner } from "@/components/ui";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { useGetAllRoles, useGetAllUsers, } from "./misc/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { APIAxios } from "@/utils/axios";
import { TUser } from "./misc/api/getAllUsers";
import EditEmployeeSheet from "./misc/components/EditEmployeeSheet";

const Page = () => {
  const {
    state: isConfirmDeleteModalOpen,
    setTrue: openConfirmDeleteModal,
    setFalse: closeConfirmDeleteModal,
  } = useBooleanStateControl();

  const {
    state: isEditSheetOpen,
    setTrue: openEditSheet,
    setFalse: closeEditSheet,
  } = useBooleanStateControl();

  const { data: rolesData, isLoading: isLoadingRoles, error: rolesError } = useGetAllRoles();
  const { data: usersData, isLoading: isLoadingUsers, error: usersError } = useGetAllUsers();
  const [editedUsers, setEditedUsers] = useState<TUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<TUser | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (usersData) {
      setEditedUsers(usersData.data);
    }
  }, [usersData]);

  const { mutate: editUsers, isPending: isSavingEditedUsers } = useMutation({
    mutationFn: (users: { id: number; role: string; is_active: boolean }[]) =>
      APIAxios.put("/auth/bulk-edit-users/", { users }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getAllUsers"] });
    },
  });

  const handleEditEmployee = (user: TUser) => {
    setSelectedUser(user);
    openEditSheet();
  };

  const handleEdit = (userId: number, field: keyof TUser, value: any) => {
    setEditedUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, [field]: value } : user
      )
    );
  };

  const handleSaveChanges = () => {
    const usersToUpdate = editedUsers.map((user) => ({
      id: user.id,
      role: user.role_name,
      is_active: user.is_active,
    }));
    editUsers(usersToUpdate);
  };

  if (isLoadingUsers || isLoadingRoles) return (
    <div className="flex items-center justify-center h-full w-full py-[30vh]">
      <Spinner size={18} className='' />
    </div>
  )
  if (usersError || rolesError) return <div>Error: {(usersError || rolesError)?.message}</div>;

  return (
    <section className="mt-7 pb-7 mx-10 rounded-xl bg-white border-[1px] border-[#0F172B1A] px-6 pt-[35px]">
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-medium">Employee Management</h1>
          <p>Manage your employees and their account permissions here.</p>
        </div>
        <div className="relative">
          <Input
            type="search"
            placeholder="Search what you need"
            className="h-14 w-[485px]"
          />
          <CiSearch
            size={20}
            color="#111827"
            className="absolute top-[30%] right-[24px]"
          />
        </div>
      </div>
      <div className="mt-6 flex justify-between items-start">
        <h2 className="text-2xl font-semibold">Team Members</h2>
        <div className="flex gap-2">
          <Button
            className="h-12 flex gap-4 bg-[#111827] rounded-[10px] text-sm px-6"
            onClick={handleSaveChanges}
            disabled={isSavingEditedUsers}
          >
            {isSavingEditedUsers ? 'Saving...' : 'Save Changes'}
          </Button>

          {/* <Sheet>
            <SheetTrigger asChild>
              <Button className="h-12 flex gap-4 bg-transparent text-sm px-6 text-[#111827] border border-solid rounded-[10px]">
                Add Employee
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle className="text-2xl font-bold pb-8">
                  Add New Employee
                </SheetTitle>
                <SheetDescription className="flex flex-col gap-3">
                  <Label htmlFor="em-name" className="text-[#111827]">
                    Employee Name <span className="text-red-500">*</span>
                  </Label>
                  <Input id="em-name" type="text" className="h-14" />
                  <Label htmlFor="em-email" className="text-[#111827]">
                    Employee Email <span className="text-red-500">*</span>
                  </Label>
                  <Input id="em-email" type="email" className="h-14" />
                </SheetDescription>
              </SheetHeader>
              <SheetFooter className="mt-20">
                <SheetClose asChild>
                  <Button
                    type="submit"
                    className="w-full bg-white text-black border border-solid h-14"
                  >
                    Cancel
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button type="submit" className="w-full bg-[#111827] h-14">
                    Create
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet> */}
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[22.9%]">Name</TableHead>
            <TableHead className="w-[22.9%]">Phone Number</TableHead>
            <TableHead className="w-[12.8%]">Created Date</TableHead>
            <TableHead className="">Role</TableHead>
            <TableHead className="w-[22.9%] text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {editedUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm">{user.email}</p>
                </div>
              </TableCell>
              <TableCell>{user.phone}</TableCell>
              <TableCell>{new Date(user.create_date).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <Select
                  value={user.role_name}
                  onValueChange={(value) => handleEdit(user.id, 'role_name', value)}
                >
                  <SelectTrigger className="border-none">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {
                        rolesData?.data.map((role) => (
                          <SelectItem key={role.id} value={role.name}>
                            {role.name}
                          </SelectItem>
                        ))
                      }
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-right flex gap-[10px]">
                <Select
                  value={user.is_active ? "active" : "deactive"}
                  onValueChange={(value) => handleEdit(user.id, 'is_active', value === "active")}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder="Select Action"
                      className={
                        user.is_active
                          ? "bg-[#E7F7EF] text-[#0CAF60] border-none"
                          : "bg-[rgba(224,49,55,0.31)] text-[#E03137] border-none"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem className="" value="active">Active</SelectItem>
                      <SelectItem value="deactive">Deactivate</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <button 
                  className="p-2 rounded-lg bg-[#2F78EE] flex items-center cursor-pointer"
                  onClick={() => handleEditEmployee(user)}
                >
                  <MdOutlineModeEdit color="#fff" size={20} />
                </button>
                <button className="p-2 rounded-lg bg-[#E03137] flex items-center cursor-pointer" onClick={openConfirmDeleteModal}>
                  <RiDeleteBin6Line color="#fff" size={20} />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="w-full flex justify-between items-center mt-6">
        <div>
          <Pagination className="flex justify-start">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
        <div className="flex gap-4 items-center">
          <p className="text-xs text-[#687588] ">Showing 1 to {usersData?.data.length} of {usersData?.data.length} entries</p>
          <Button className="flex gap-4 bg-transparent border border-solid border-[#F1F2F4] text-[#111827] rounded-[10px] text-sm px-[10px]">
            Show {usersData?.data.length}
            <IoChevronUp />
          </Button>
        </div>
      </div>

      <ConfirmDeleteModal
        isModalOpen={isConfirmDeleteModalOpen}
        closeModal={closeConfirmDeleteModal}
        deleteFn={() => { }}
        heading="Delete Employee Record"
        subheading="This action means employee record will automatically be removed."
        icon={<RiDeleteBin6Line className="bg-[#FFD4D6] p-2 rounded-2xl" color="#E03137" size={50} />}
      />

      <EditEmployeeSheet
        isOpen={isEditSheetOpen}
        onClose={closeEditSheet}
        selectedUser={selectedUser}
        rolesData={rolesData}
        isLoadingRoles={isLoadingRoles}
      />
    </section>
  );
};

export default Page;

