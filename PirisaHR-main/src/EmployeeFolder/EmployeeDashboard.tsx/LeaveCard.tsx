interface LeaveCardProps {
  title: string;
  items: {
    label: string;
    value: number;
  }[];
  gradient: string;
  textColor: string;
  icon: React.ReactNode;
}

const LeaveCard: React.FC<LeaveCardProps> = ({ title, items, gradient, textColor, icon }) => {
  return (
    <div className={`bg-gradient-to-r ${gradient} rounded-xl shadow-lg overflow-hidden`}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-xl font-semibold ${textColor}`}>{title}</h2>
          <div className="p-2 rounded-lg bg-white bg-opacity-30">
            {icon}
          </div>
        </div>
        
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={`${item.label}-${index}`} className="flex justify-between items-center">
              <span className={`text-sm font-medium ${textColor}`}>{item.label}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-bold bg-white bg-opacity-50 ${textColor}`}>
                {item.value} days
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeaveCard;
