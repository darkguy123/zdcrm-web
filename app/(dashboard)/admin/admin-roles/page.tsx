"use client"

import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Spinner } from '@/components/ui'

import { TUserRole } from '../employees-role/misc/api/getAllRoles'
import { useGetAllRoles } from '../employees-role/misc/api'
import { useUpdateRolePermission } from './misc/api/postUpdatePermissions'
import CreateNewRole from './misc/components/CreateNewRole'


const PERMISSIONS = [
  { name: 'Manage Orders', value: 'CAN_MANAGE_ORDERS' },
  { name: 'Manage Enquiries', value: 'CAN_MANAGE_ENQUIRIES' },
  { name: 'Manage Order History', value: 'CAN_MANAGE_ORDERS_HISTORY' },
  { name: 'Manage Order Statistics', value: 'CAN_MANAGE_ORDERS_STAT' },
  { name: 'Manage Financial Report', value: 'CAN_MANAGE_FINANCIAL_REPORT' },
  { name: 'Manage Staff', value: 'CAN_MANAGE_STAFFS' },
  { name: 'Manage Deliveries', value: 'CAN_MANAGE_DELIVERIES' },
  { name: 'Manage Roles', value: 'CAN_MANAGE_ROLES' },
  { name: 'Manage Branches', value: 'CAN_MANAGE_BRANCHES' },
  { name: 'Manage Inventories', value: 'CAN_MANAGE_INVENTORIES' },
  { name: 'Manage Payments', value: 'CAN_MANAGE_PAYMENTS' },
  { name: 'Manage Client History', value: 'CAN_MANAGE_CLIENT_HISTORY' },
  { name: 'Manage Riders History', value: 'CAN_MANAGE_RIDERS_HISTORY' },
  { name: 'Manage Trash', value: 'CAN_MANAGE_TRASH' },
  { name: 'Manage Conversion Statistics', value: 'CAN_MANAGE_CONVERSION_STATISTICS' },
  { name: 'Manage Gift Inventory', value: 'CAN_MANAGE_GIFT_INVENTORY' },
  { name: 'Manage Cakes & Flower Inventory', value: 'CAN_MANAGE_CAKES_FLOWER_INVENTORY' },
  { name: 'Manage Store Inventory', value: 'CAN_MANAGE_STORE_INVENTORY' },
  { name: 'Manage Inventory Alerts', value: 'CAN_MANAGE_INVENTORY_ALERTS' },
  { name: 'Manage Vendors', value: 'CAN_MANAGE_VENDORS' },
  { name: 'Manage Reports Overview', value: 'CAN_MANAGE_REPORTS_OVERVIEW' },
  { name: 'Manage Products', value: 'CAN_MANAGE_PRODUCTS' },
  { name: 'Manage Dispatch', value: 'CAN_MANAGE_DISPATCH' },
  { name: 'Manage Discount', value: 'CAN_MANAGE_DISCOUNT' },
  { name: 'Manage Order Properties', value: 'CAN_MANAGE_ORDER_PROPERTIES' },
];


const AdminRolesPage = () => {
  const { data: rolesData, isLoading: isLoadingRoles } = useGetAllRoles()
  const updateRolePermission = useUpdateRolePermission()
  const [activePermission, setActivePermission] = useState(PERMISSIONS[0].value)
  const [isCurrentlyEditing, setIsCurrentlyEditing] = useState(-1)

  const handlePermissionChange = (roleId: number, newStatus: boolean) => {
    setIsCurrentlyEditing(roleId)
    updateRolePermission.mutate({
      permission: activePermission,
      roles: [{ role_id: roleId, status: newStatus }]
    },
      {
        onSuccess() {
          toast.success('Permission updated successfully')
        },
      }
    )
  }

  useEffect(() => {
    const mainElement = document.querySelector("main")

    if (mainElement) {
      mainElement.scrollTo({
        top: 0,
        behavior: "smooth",
      })
    }
  }, [activePermission])



  if (isLoadingRoles) return (
    <div className="flex items-center justify-center py-[30vh]">
      <Spinner size={18} className='' />
    </div>
  )

  return (
    <section className="mx-9 mt-10 bg-white rounded-xl">
      <div className="pl-20 h-20 flex items-center justify-between border-b-[1px] border-[#E0E0E0] relative">
        <p className="text-xl font-medium text-[#1E1E1E]">Roles and Permissions</p>
        <CreateNewRole />
      </div>

      <div className="bg-[#FAFAFA] m-5 p-5">
        <Tabs
          value={activePermission}
          onValueChange={setActivePermission}
          orientation="vertical"
          className="flex gap-7 items-stretch"
        >

          <TabsList className="flex flex-col mt-5 bg-white w-[290px] h-full items-start p-7 ml-5 gap-5">
            {PERMISSIONS.map((permission) => (
              <TabsTrigger key={permission.value} value={permission.value} className="bg-white p-2">
                {permission.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {
            PERMISSIONS.map((permission) => (
              <TabsContent key={permission.value} value={permission.value} className="grow h-full">
                <div className="bg-white mt-4 p-6">
                  <h2 className="text-2xl font-bold mb-4">{permission.name}</h2>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left">Role</th>
                        <th className="p-2 text-left">Users Count</th>
                        <th className="p-2 text-left">Permission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rolesData?.data.map((role: TUserRole) => (
                        <tr key={role.id} className="border-b">
                          <td className="p-2 py-5">{role.name}</td>
                          <td className="p-2 py-5">{role.users_count}</td>
                          <td className="p-2 py-5">
                            <div className="flex items-center">
                              <Switch
                                checked={role.permissions.includes(permission.value)}
                                onCheckedChange={(checked) => handlePermissionChange(role.id, checked)}
                              />
                              {
                                isCurrentlyEditing === role.id && updateRolePermission.isPending && (
                                  <Spinner size={12} className='ml-1.5' />
                                )
                              }
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            ))
          }
        </Tabs>
      </div>
    </section>
  )
}

export default AdminRolesPage

