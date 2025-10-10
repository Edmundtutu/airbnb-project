import React from 'react';

export interface StatsCardProps {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  gradientFrom: string;
  gradientTo: string;
  onClick?: () => void;
}

const ActionButton: React.FC<StatsCardProps> = ({ icon: Icon, title, subtitle, gradientFrom, gradientTo, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} p-2 rounded-full mb-2`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <span className="text-xs text-gray-500">
        {title}
      </span>
      {
        subtitle && (
          <span className="text-xs text-gray-500">
            {subtitle}
          </span>
        )
      }
    </button>
  );
};

export default ActionButton;
