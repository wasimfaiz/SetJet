import { faBell } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { usePathname } from "next/navigation";
import React from "react";

interface EmployeeInfoProps {
  name: string;
  email: string;
}

const InfoCard: React.FC<EmployeeInfoProps> = ({
  name,
  email,
}) => {

  return (
    <div className="flex absolute lg:mt-2 mt-1 right-8 bg-transparent w-50 gap-5">
      <div className="hidden sm:flex items-center space-x-2">
        {/* Profile Icon */}
        <div className="bg-deepblue text-white rounded-full h-10 w-10 flex items-center justify-center text-[10px] font-bold overflow-hidden">
          <img src="/profilepic.png" alt="Profile" className="h-full w-full object-cover" />
        </div>
        {/* Employee Details */}
        <div>
          <h2 className="text-sm font-semibold text-gray-800">{name}</h2>
          <p className="text-[10px] text-gray-500">{email}</p>
        </div>
      </div>
    </div>
  );
};

export default InfoCard;
