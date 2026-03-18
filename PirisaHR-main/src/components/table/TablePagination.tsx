// // TablePagination.tsx
// import React from 'react';
// import { ChevronLeft, ChevronRight } from 'lucide-react';

// interface TablePaginationProps {
//   currentPage: number;
//   totalPages: number;
//   onPageChange: (page: number) => void;
// }

// const TablePagination = ({ currentPage, totalPages, onPageChange }: TablePaginationProps) => {
//   return (
//     <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
//       <button
//         onClick={() => onPageChange(currentPage - 1)}
//         disabled={currentPage === 1}
//         className="flex items-center gap-2 text-gray-600 disabled:text-gray-400"
//       >
//         <ChevronLeft size={16} />
//         Previous
//       </button>
//       <div className="flex items-center gap-2">
//         {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
//           <button
//             key={page}
//             onClick={() => onPageChange(page)}
//             className={`px-3 py-1 rounded ${
//               currentPage === page
//                 ? 'bg-blue-500 text-white'
//                 : 'text-gray-600 hover:bg-gray-100'
//             }`}
//           >
//             {page}
//           </button>
//         ))}
//       </div>
//       <button
//         onClick={() => onPageChange(currentPage + 1)}
//         disabled={currentPage === totalPages}
//         className="flex items-center gap-2 text-gray-600 disabled:text-gray-400"
//       >
//         Next
//         <ChevronRight size={16} />
//       </button>
//     </div>
//   );
// };

// export default TablePagination;
