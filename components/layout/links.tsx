import {
  OrderTimeLine,
  OrderManagement,
  EnquiriesIcon,
  OrdersIcon,
  ClientHistoryIcon,
  ReportAndAnalytics,
  OrderStatistics,
  Inventory,
  ConversionStatisticsIcon,
} from "@/icons/sidebar";
import { authTokenStorage } from "@/utils/tokens";
import {
  Bag2,
  BagTick2,
  Cake,
  Danger,
  DiscountShape,
  Graph,
  I3Dcube,
  Logout,
  Setting2,
  Shop,
  ShopRemove,
  Trash,
  TruckTick,
} from "iconsax-react";
import { UserCircle } from 'lucide-react';

export const linkGroups = [
  {
    key: "top",
    heading: "MAIN MENU",
    requiredPermissions: undefined,
    links: [
      {
        link: "/order-timeline",
        text: "Order Timeline",
        icon: <OrderTimeLine />,
        requiredPermissions: ["CAN_MANAGE_ORDERS"],
      },
      {
        text: "Order Management",
        icon: <OrderManagement />,
        requiredPermissions: ["CAN_MANAGE_ORDERS"],
        nestedLinks: [
          {
            link: "/order-management/enquiries",
            text: "Enquiries",
            icon: <EnquiriesIcon />,
            requiredPermissions: ["CAN_MANAGE_ENQUIRIES"],
          },
          {
            link: "/order-management/orders",
            text: "Orders",
            icon: <OrdersIcon />,
            requiredPermissions: ["CAN_MANAGE_ORDERS"],
          },
          {
            link: "/order-management/delivery",
            text: "Delivery",
            icon: <OrderTimeLine />,
            requiredPermissions: ["CAN_MANAGE_DELIVERIES"],
          },
          {
            link: "/order-management/payments",
            text: "Payment",
            icon: <DiscountShape />,
            requiredPermissions: ["CAN_MANAGE_PAYMENTS"],
          },
          {
            link: "/order-management/order-history",
            text: "History",
            icon: <OrderManagement />,
            requiredPermissions: ["CAN_MANAGE_ORDERS_HISTORY"],
          },
          {
            link: "/order-management/client-history",
            text: "Client History",
            icon: <ClientHistoryIcon />,
            requiredPermissions: ["CAN_MANAGE_CLIENT_HISTORY"],
          },
          {
            link: "/order-management/riders-history",
            text: "Riders History",
            icon: <TruckTick />,
            requiredPermissions: ["CAN_MANAGE_RIDERS_HISTORY"],
          },
          {
            link: "/order-management/trash",
            text: "Trash",
            icon: <Trash />,
            requiredPermissions: ["CAN_MANAGE_TRASH"],
          },
        ],
      },
      {
        text: "Report & Analytics",
        icon: <ReportAndAnalytics />,
        requiredPermissions: [
          "CAN_MANAGE_ORDERS_STAT",
          "CAN_MANAGE_FINANCIAL_REPORT",
          "CAN_MANAGE_CONVERSION_STATISTICS",
          "CAN_MANAGE_REPORTS_OVERVIEW",
        ],
        nestedLinks: [
          {
            link: "/report-analytics/overview",
            text: "Overview",
            icon: <ReportAndAnalytics />,
            requiredPermissions: ["CAN_MANAGE_REPORTS_OVERVIEW"],
          },
          {
            link: "/report-analytics/order-statistics",
            text: "Order Statistics",
            icon: <OrderStatistics />,
            requiredPermissions: ["CAN_MANAGE_ORDERS_STAT"],
          },
          {
            link: "/report-analytics/financial-report",
            text: "Financial Report",
            icon: <Graph size={20} />,
            requiredPermissions: ["CAN_MANAGE_FINANCIAL_REPORT"],
          },
          {
            link: "/report-analytics/conversion-statistics",
            text: "Conversion Statistics",
            icon: <ConversionStatisticsIcon />,
            requiredPermissions: ["CAN_MANAGE_CONVERSION_STATISTICS"],
          },
        ],
      },
      {
        text: "Inventory",
        icon: <Inventory />,
        requiredPermissions: [
          "CAN_MANAGE_INVENTORY",
          "CAN_MANAGE_GIFT_INVENTORY",
          "CAN_MANAGE_CAKES_FLOWER_INVENTORY",
          "CAN_MANAGE_STORE_INVENTORY",
          "CAN_MANAGE_INVENTORY_ALERTS",
          "CAN_MANAGE_VENDORS",
        ],
        nestedLinks: [
          {
            link: "/inventory/gifts",
            text: "Gift Inventory",
            icon: <I3Dcube />,
            requiredPermissions: ["CAN_MANAGE_INVENTORY", "CAN_MANAGE_GIFT_INVENTORY"],
          },
          {
            link: "/inventory/stock",
            text: "Cakes, Flowers & Cupcakes",
            icon: <Cake />,
            requiredPermissions: ["CAN_MANAGE_INVENTORY", "CAN_MANAGE_CAKES_FLOWER_INVENTORY"],
          },
          {
            link: "/inventory/store",
            text: "Store",
            icon: <OrderManagement />,
            requiredPermissions: ["CAN_MANAGE_INVENTORY", "CAN_MANAGE_STORE_INVENTORY"],
          },
          {
            link: "/inventory/alert",
            text: "Inventory Alert",
            icon: <Danger />,
            requiredPermissions: ["CAN_MANAGE_INVENTORY", "CAN_MANAGE_INVENTORY_ALERTS"],
          },
          {
            link: "/inventory/vendors",
            text: "Vendors",
            icon: <Shop />,
            requiredPermissions: ["CAN_MANAGE_INVENTORY", "CAN_MANAGE_VENDORS"],
          },
        ],
      },
    ],
  },
  {
    key: "bottom",
    heading: "ADMIN",
    requiredPermissions: ["CAN_MANAGE_STAFFS", "CAN_MANAGE_ROLES", "CAN_MANAGE_BRANCHES", "CAN_MANAGE_INVENTORIES", "CAN_MANAGE_PRODUCTS", "CAN_MANAGE_DISPATCH", "CAN_MANAGE_DISCOUNT", "CAN_MANAGE_ORDER_PROPERTIES"],
    links: [
      {
        text: "Manage Admin",
        icon: <UserCircle size={20} strokeWidth={1.5} />,
        requiredPermissions: ["CAN_MANAGE_STAFFS", "CAN_MANAGE_ROLES", "CAN_MANAGE_BRANCHES"],
        nestedLinks: [
          {
            link: "/admin/businesses",
            text: "Businesses",
            icon: <Bag2 size={20} />,
            // requiredPermissions: ["CAN_MANAGE_BRANCHES", "CAN_MANAGE_BUSINESSES"],
            requiredPermissions: ["CAN_MANAGE_BRANCHES"],
          },
          {
            link: "/admin/employees-role",
            text: "Employees",
            icon: <EnquiriesIcon />,
            requiredPermissions: ["CAN_MANAGE_ROLES"],
          },
          {
            link: "/admin/invite-employee",
            text: "Invite Employee",
            icon: <ShopRemove size={20} />,
            requiredPermissions: ["CAN_MANAGE_STAFFS"],
          },
          {
            link: "/admin/admin-roles",
            text: "Roles and Permissions",
            icon: <Setting2 />,
            requiredPermissions: ["CAN_MANAGE_ROLES"],
          },
          {
            link: "/admin/products",
            text: "Products",
            icon: <I3Dcube />,
            requiredPermissions: ["CAN_MANAGE_PRODUCTS"],
          },
          {
            link: "/admin/dispatch",
            text: "Dispatch",
            icon: <I3Dcube />,
            requiredPermissions: ["CAN_MANAGE_DISPATCH"],
          },
          {
            link: "/admin/discount",
            text: "Discount",
            icon: <I3Dcube />,
            requiredPermissions: ["CAN_MANAGE_DISCOUNT"],
          },
          {
            link: "/admin/properties",
            text: "Order Properties",
            icon: <I3Dcube />,
            requiredPermissions: ["CAN_MANAGE_ORDER_PROPERTIES"],
          },
        ],
      },
    ],
  },
  {
    key: "Logout",
    heading: "LOGOUT",
    requiredPermissions: [],
    actions: [
      {
        text: "Logout",
        icon: <Logout size={20} strokeWidth={1.5} />,
        requiredPermissions: [],
        action: authTokenStorage.logout,
      },
    ],
  },
];

