// // StatusBadge.tsx
// import React from 'react';

// const StatusBadge = ({ status }: { status: string }) => {
//   const getStatusStyle = () => {
//     switch (status.toLowerCase()) {
//       case 'active':
//         return 'bg-green-100 text-green-800';
//       case 'inactive':
//         return 'bg-red-100 text-red-800';
//       case 'pending':
//         return 'bg-yellow-100 text-yellow-800';
//       case 'approved':
//         return 'bg-green-100 text-green-800';
//       case 'reject':
//         return 'bg-red-100 text-red-800';
//       case 'late':
//         return 'bg-yellow-100 text-yellow-800';
//       case 'on time':
//         return 'bg-green-100 text-green-800';
//       case 'leave':
//         return 'bg-purple-100 text-purple-800';
//       case 'absent':
//         return 'bg-red-100 text-red-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   return (
//     <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle()}`}>
//       {status}
//     </span>
//   );
// };

// export default StatusBadge;
