import React from "react";

const Loader = () => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-60 flex flex-col justify-center items-center z-50">
      {/* Bouncing Dots Spinner */}
      <div className="flex space-x-2">
        <div className="w-2 h-2 md:h-6 md:w-6 bg-blue-500 rounded-full animate-bounce delay-100"></div>
        <div className="w-2 h-2 md:h-6 md:w-6 bg-blue-500 rounded-full animate-bounce delay-200"></div>
        <div className="w-2 h-2 md:h-6 md:w-6 bg-blue-500 rounded-full animate-bounce delay-300"></div>
      </div>
      
      <span className="text-sm md:text-xl text-deepblue font-semibold animate-pulse mt-4">Loading Please Wait...</span>
    </div>
  );
};

export default Loader;
