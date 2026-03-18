// // TableHeader.tsx
// import React from 'react';
// import { Plus } from 'lucide-react';

// interface TableHeaderProps {
//   title?: string;
//   addButton?: {
//     label: string;
//     onClick: () => void;
//   };
// }

// const TableHeader = ({ title, addButton }: TableHeaderProps) => {
//   return (
//     <div className="flex justify-between items-center p-4 border-b border-gray-200">
//       {title && <h2 className="text-lg font-semibold text-gray-800">{title}</h2>}
//       {addButton && (
//         <button
//           onClick={addButton.onClick}
//           className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
//         >
//           <Plus size={16} />
//           {addButton.label}
//         </button>
//       )}
//     </div>
//   );
// };

// export default TableHeader;
