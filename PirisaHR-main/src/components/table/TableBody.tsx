// // TableBody.tsx
// import React from 'react';
// import StatusBadge from './StatusBadge ';
// import ActionButtons from './ActionButtons';

// interface BaseItem {
//     id: string | number;
//     [key: string]: unknown;
//   }

//   interface Column<T> {
//     key: string;
//     title: string;
//     render?: (item: T) => React.ReactNode;
//     className?: string;
//     sortable?: boolean;
//   }

// interface TableBodyProps<T> {
//   columns: Column<T>[];
//   data: T[];
//   actions?: {
//     onView?: (item: T) => void;
//     onEdit?: (item: T) => void;
//     onDelete?: (item: T) => void;
//   };
//   onRowClick?: (item: T) => void;
//   statusIndicator?: boolean;
// }

// const TableBody = <T extends BaseItem>({
//   columns,
//   data,
//   actions,
//   onRowClick,
//   statusIndicator,
// }: TableBodyProps<T>) => {
//   return (
//     <tbody>
//       {data.map((item) => (
//         <tr
//           key={item.id}
//           className={`border-b last:border-b-0 hover:bg-gray-50 ${
//             onRowClick ? 'cursor-pointer' : ''
//           }`}
//           onClick={() => onRowClick?.(item)}
//         >
//           {columns.map((column) => (
//             <td
//               key={`${item.id}-${column.key}`}
//               className={`px-6 py-4 ${column.className || ''}`}
//             >
//               {column.render ? (
//                 column.render(item)
//               ) : statusIndicator && column.key === 'status' ? (
//                 <StatusBadge status={item[column.key] as string} />
//               ) : (
//                 item[column.key] as React.ReactNode
//               )}
//             </td>
//           ))}
//           {actions && (
//             <td className="px-6 py-4">
//               <ActionButtons
//                 onView={actions.onView ? () => actions.onView!(item) : undefined}
//                 onEdit={actions.onEdit ? () => actions.onEdit!(item) : undefined}
//                 onDelete={actions.onDelete ? () => actions.onDelete!(item) : undefined}
//               />
//             </td>
//           )}
//         </tr>
//       ))}
//     </tbody>
//   );
// };

// export default TableBody;
