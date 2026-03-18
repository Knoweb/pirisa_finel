import {
  FaTachometerAlt,
  FaUsers,
  FaCalendarAlt,
  FaDollarSign,
  FaChartBar,
  FaAccusoft,
  FaAddressCard,
} from "react-icons/fa";
import { NavItem } from "../types/navigation";
// import { FaUsersGear } from "react-icons/fa6";

export const navItems: NavItem[] = [
  {
    id: "dashboard",
    path: "/dashboard",
    label: "Dashboard",
    icon: FaTachometerAlt,
    subItems: [],
    roles: ["CMPNY"]
  },
  {
    id: "employee",
    path: "/employee",
    label: "Employee",
    icon: FaUsers,
    roles: ["CMPNY"],
    
    subItems: [
      { 
        id: "all-employees", 
        path: "/employee/all", 
        label: "All Employees" 
      },
      { 
        id: "new-employee", 
        path: "/employee/new", 
        label: "New Employee" 
      },
      { 
        id: "edit-employee", 
        path: "/employee/edit/:id", 
        label: "Edit Employee" 
      },
    ],
  },
  {
    id: "attendance",
    path: "/attendance",
    label: "Attendance",
    icon: FaCalendarAlt,
    roles: ["CMPNY"],
    subItems: [
      {
        id: "attendance-list",
        path: "/attendance/list", 
        label: "Attendance List",
      },
      {
        id: "monthly-calendar",
        path: "/attendance/calendar", 
        label: "Monthly Calendar",
      },
      {
        id: "mark-attendance",
        path: "/attendance/mark", 
        label: "Mark Attendance",
      },
    ],
  },
  {
    id: "payrole",
    path: "/payrole",
    label: "Payrole",
    icon: FaDollarSign,
    roles: ["CMPNY"],
    subItems: [
      { 
        id: "salaryList", 
        path: "/payrole/salaryList", 
        label: "Salary List" 
      },
      { 
        id: "makesalary", 
        path: "/payrole/makesalary/:employeeId", 
        label: "Make Salary" 
      },
      { 
        id: "payslips", 
        path: "/payrole/payslips/:employeeId", 
        label: "Pay Slips" 
      }
    ],
  },
  {
    id: "leave",
    path: "/leave",
    label: "Leave",
    icon: FaAccusoft,
    roles: ["CMPNY"],
    subItems: [
      {
        id: "leave-requests",
        path: "/leave/requests", 
        label: "Leave Requests",
      },
      // {
      //   id: "leave-settings",
      //   path: "/leave/settings", 
      //   label: "Leave Settings",
      // },
    ],
  },
  {
    id: "performance",
    path: "/performance",
    label: "Performance Appraisal",
    icon: FaChartBar,
    roles: ["CMPNY"],
    subItems: [
      { 
        id: "evaluationForm", 
        path: "/performance/evaluationForm", 
        label: "Evaluation Form" 
      },
      { 
        id: "newForm", 
        path: "/performance/newForm", 
        label: "New Form" 
      },
    ],
  },
  {
    id: "reports",
    path: "/reports",
    label: "Reports",
    icon: FaAddressCard,
    roles: ["CMPNY"],
    subItems: [
      { 
        id: "payRoleReport", 
        path: "/reports/payRoleReport", 
        label: "Salary Report" 
      },
      // { 
      //   id: "newForm", 
      //   path: "/reports/newForm", 
      //   label: "New Form" 
      // },
    ],
  },
  {
  id: "emp-dashboard",
    path: "/employee-dashboard",
    label: "Employee Dashboard",
    icon: FaTachometerAlt,
    roles: ["EMPLOYEE"],
    subItems: []
}  ,
{
  id: "pay-role-list",
  path : "/pay-role-list",
  label:"Payrole List",
  icon: FaDollarSign,
  roles : ["EMPLOYEE"],
  subItems:[]
},
{
  id: "emp-leave",
  path: "/emp-leave",
  label: "Leave",
  icon: FaAccusoft,
  roles: ["EMPLOYEE"],
  subItems: []
}
];
