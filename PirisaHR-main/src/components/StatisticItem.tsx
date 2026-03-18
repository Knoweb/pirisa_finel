import React from "react";
import { TranslatableText } from "./languages/TranslatableText";

interface StatisticItemProps {
  label: string;
  value: number;
  percentage: string;
}

const StatisticItem: React.FC<StatisticItemProps> = ({
  label,
  value,
  percentage,
}) => {
  return (
    <div className="flex flex-col items-center p-2 border-r-2 border-gray-100">
      <span className="text-sm text-gray-600">
        <TranslatableText text={label} />
      </span>
      <span className="text-lg font-bold text-gray-800">
        <TranslatableText text={value.toString()} />
      </span>
      <span className="text-md text-green-600">
        <TranslatableText text={percentage} />
      </span>
    </div>
  );
};

export default StatisticItem;
