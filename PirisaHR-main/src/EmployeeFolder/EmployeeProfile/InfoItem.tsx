import { ReactNode } from "react";

interface InfoItemProps {
  icon: ReactNode;
  label: string;
  value: string | number;
}

export const InfoItem = ({ icon, label, value }: InfoItemProps) => (
  <div>
    <p className="text-gray-500 text-sm flex items-center gap-1">
      {icon} {label}
    </p>
    <p className="text-gray-900 font-medium">{value}</p>
  </div>
);
