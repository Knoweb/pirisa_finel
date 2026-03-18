// import  { useState } from "react";
// import {
//   FaTachometerAlt,
//   FaUsers,
//   FaCalendarAlt,
//   FaDollarSign,
//   FaChartBar,
//   FaAccusoft,
//   FaChevronDown,
//   FaChevronUp,
//   FaCircle,
// } from "react-icons/fa";

// import DashboardContent from "../components/Content/DashboardContent";
// import AttendanceContent from "../components/Content/AttendanceContent";
// import PayrollContent from "../components/Content/PayrollContent";
// import PerformanceContent from "../components/Content/PerformanceContent";
// import Header from "../components/Header";
// import TabHeader from "../components/TabHeader";
// import AllEmployee from "../components/Content/EmployeeContent/AllEmployee";
// import NewEmployee from "../components/Content/EmployeeContent/NewEmployee";

// const navItems = [
//   {
//     id: "dashboard",
//     label: "Dashboard",
//     icon: FaTachometerAlt,
//     subItems: [],
//   },
//   {
//     id: "employee",
//     label: "Employee",
//     icon: FaUsers,
//     subItems: [
//       { id: "all-employees", label: "All Employees" },
//       { id: "new-employee", label: "New Employee" },
//       { id: "edit-employee", label: "All Employees" },
//     ],
//   },
//   {
//     id: "attendance",
//     label: "Attendance",
//     icon: FaCalendarAlt,
//     subItems: [
//       { id: "attendance-list", label: "Attendance List" },
//       { id: "mark-attendance", label: "Mark Attendance" },
//     ],
//   },
//   {
//     id: "payroll",
//     label: "Payroll",
//     icon: FaDollarSign,
//     subItems: [
//       { id: "salary-list", label: "Salary List" },
//       { id: "payslips", label: "Payslips" },
//     ],
//   },
//   {
//     id: "leave",
//     label: "Leave",
//     icon: FaAccusoft,
//     subItems: [
//       { id: "leave-requests", label: "Leave Requests" },
//       { id: "leave-settings", label: "Leave Settings" },
//     ],
//   },
//   {
//     id: "performance",
//     label: "Performance Appraisal",
//     icon: FaChartBar,
//     subItems: [
//       { id: "reviews", label: "Reviews" },
//       { id: "goals", label: "Goals" },
//     ],
//   },
// ];

// const Layout = () => {
//   const [activeTab, setActiveTab] = useState("dashboard");
//   const [activeSubTab, setActiveSubTab] = useState("");
//   const [isSidebarVisible, setIsSidebarVisible] = useState(true);
//   const [expandedTabs, setExpandedTabs] = useState(new Set(["dashboard"]));

//   const toggleSidebar = () => {
//     setIsSidebarVisible(!isSidebarVisible);
//   };

//   const toggleExpanded = (tabId: string) => {
//     const newExpanded = new Set(expandedTabs);
//     if (newExpanded.has(tabId)) {
//       newExpanded.delete(tabId);
//     } else {
//       newExpanded.add(tabId);
//     }
//     setExpandedTabs(newExpanded);
//   };

//   const handleTabClick = (tabId: string) => {
//     setActiveTab(tabId);
//     toggleExpanded(tabId);
//   };

//   const handleSubTabClick = (tabId: string, subTabId: string) => {
//     setActiveTab(tabId);
//     setActiveSubTab(subTabId);
//     if (!expandedTabs.has(tabId)) {
//       toggleExpanded(tabId);
//     }
//   };

//   const getContent = () => {
//     switch (activeTab) {
//       case "dashboard":
//         switch (activeSubTab) {
//           case "daily":
//             return <div>Daily Dashboard Content</div>;
//           case "summary-report":
//             return <div>Summary Report Content</div>;
//           default:
//             return <DashboardContent />;
//         }
//       case "employee":
//         switch (activeSubTab) {
//           case "all-employees":
//             return <AllEmployee />;
//           case "new-employee":
//             return <NewEmployee />;
//           default:
//             return <AllEmployee />;
//         }
//       case "attendance":
//         switch (activeSubTab) {
//           case "attendance-list":
//             return <div>Attendance List Content</div>;
//           case "mark-attendance":
//             return <div>Mark Attendance Form</div>;
//           default:
//             return <AttendanceContent />;
//         }
//       case "payroll":
//         switch (activeSubTab) {
//           case "salary-list":
//             return <div>Salary List Content</div>;
//           case "payslips":
//             return <div>Payslips Content</div>;
//           default:
//             return <PayrollContent />;
//         }
//       case "leave":
//         switch (activeSubTab) {
//           case "leave-requests":
//             return <div>Leave Requests Content</div>;
//           case "leave-settings":
//             return <div>Leave Settings Content</div>;
//           default:
//             return <div>Leave Content</div>;
//         }
//       case "performance":
//         switch (activeSubTab) {
//           case "reviews":
//             return <div>Reviews Content</div>;
//           case "goals":
//             return <div>Goals Content</div>;
//           default:
//             return <PerformanceContent />;
//         }
//       // Add similar cases for other tabs...
//       default:
//         return <DashboardContent />;
//     }
//   };

//   return (
//     <div className="flex min-h-screen bg-gray-100">
//       {/* Sidebar */}
//       <div
//         className={`bg-gray-50 min-h-screen px-1.5 w-72 fixed left-0 top-0 transition-transform duration-300 ${
//           isSidebarVisible ? "translate-x-0" : "-translate-x-full"
//         } max-h-screen overflow-y-auto`}
//       >
//         <div className="flex items-center justify-center py-6">
//           <img src="/logo.png" alt="PirisaHR" className="w-10 h-10" />
//           <span className="font-semibold text-xl ml-2 text-gray-700">
//             PirisaHR
//           </span>
//         </div>
//         <div className="mt-6">
//           <ul className="space-y-2">
//             {navItems.map((item) => (
//               <li key={item.id}>
//                 <button
//                   onClick={() => handleTabClick(item.id)}
//                   className={`w-full flex items-center justify-between px-6 py-3 rounded-2xl text-gray-700 hover:bg-sky-200 cursor-pointer ${
//                     activeTab === item.id
//                       ? "bg-sky-500 text-white hover:bg-sky-500"
//                       : ""
//                   }`}
//                 >
//                   <div className="flex items-center">
//                     <item.icon className="text-lg mr-4" />
//                     <span className={activeTab === item.id ? "font-bold" : ""}>
//                       {item.label}
//                     </span>
//                   </div>
//                   {item.subItems.length > 0 &&
//                     (expandedTabs.has(item.id) ? (
//                       <FaChevronUp className="text-sm" />
//                     ) : (
//                       <FaChevronDown className="text-sm" />
//                     ))}
//                 </button>
//                 {expandedTabs.has(item.id) && (
//                   <ul className="ml-12 mt-2 space-y-2">
//                     {item.subItems.map((subItem) => (
//                       <li key={subItem.id}>
//                         <button
//                           onClick={() => handleSubTabClick(item.id, subItem.id)}
//                           className={`w-full text-left px-4 py-2 rounded-lg text-gray-600 hover:bg-sky-100 ${
//                             activeSubTab === subItem.id
//                               ? "bg-sky-100 text-sky-600 font-medium"
//                               : ""
//                           }`}
//                         >
//                           <div className="flex flex-row">
//                             <FaCircle className={`text-gray-600 w-1.5 mt-1 mr-2.5 ${
//                             activeSubTab === subItem.id
//                               ? " text-sky-600"
//                               : ""
//                           }`}/>
//                             <span>{subItem.label}</span>
//                           </div>
//                         </button>
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//               </li>
//             ))}
//           </ul>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div
//         className={`flex-1 transition-all duration-300 ${
//           isSidebarVisible ? "lg:ml-72 ml-0 " : "lg:ml-36 md:ml-1 ml-0"
//         }`}
//       >
//         <Header
//           toggleSidebar={toggleSidebar}
//           isSidebarVisible={isSidebarVisible}
//         />
//         <TabHeader activeTab={activeTab} activeSubTab={activeSubTab} />
//         <div className="p-6">{getContent()}</div>
//       </div>
//     </div>
//   );
// };

// export default Layout;
