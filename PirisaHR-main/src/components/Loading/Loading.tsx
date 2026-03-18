// components/Loading.tsx
import React from 'react';

interface LoadingProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
  fullScreen?: boolean;
  text?: string;
  textClassName?: string;
}

const Loading: React.FC<LoadingProps> = ({ 
  size = 'md', 
  color = 'border-sky-500',
  className = '',
  fullScreen = false,
  text = '',
  textClassName = 'text-gray-600 mt-2'
}) => {
  const sizeClasses = {
    xs: 'h-4 w-4 border',
    sm: 'h-6 w-6 border-2',
    md: 'h-8 w-8 border-t-2 border-b-2',
    lg: 'h-12 w-12 border-t-4 border-b-4',
    xl: 'h-16 w-16 border-t-4 border-b-4'
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 flex flex-col items-center justify-center bg-white bg-opacity-75 z-50' 
    : 'flex flex-col items-center justify-center';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div 
        className={`animate-spin rounded-full ${sizeClasses[size]} ${color}`}
      ></div>
      {text && <div className={textClassName}>{text}</div>}
    </div>
  );
};

export default Loading;
