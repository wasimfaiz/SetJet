import React from "react";

interface StatusTabProps {
  label: string;
  onClick: () => void;
  bgColor: string;
  hoverColor: string;
}

const StatusTab: React.FC<StatusTabProps> = ({ label, onClick, bgColor, hoverColor }) => {
  return (
    <div
      className={`w-full text-center md:text-sm text-xs font-medium text-white rounded-lg p-1 shadow-md cursor-pointer ${bgColor} ${hoverColor}`}
      onClick={onClick}
    >
      {label}
    </div>
  );
};

export default StatusTab;
