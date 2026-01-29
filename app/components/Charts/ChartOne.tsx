"use client";

import { ApexOptions } from "apexcharts";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import apiClient from "@/app/utils/apiClient";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const options: ApexOptions = {
  legend: {
    show: true,
    position: "top",
    horizontalAlign: "center",
    labels: {
      colors: "#5f6368", // Make legend text color lighter
    },
  },
  colors: ["#3C50E0", "#80CAEE"], // Adjusted for better visibility
  chart: {
    fontFamily: "Satoshi, sans-serif",
    height: 350,
    type: "area",
    dropShadow: {
      enabled: true,
      color: "#623CEA14",
      top: 10,
      blur: 4,
      left: 0,
      opacity: 0.1,
    },
    toolbar: {
      show: false,
    },
  },
  fill: {
    type: "gradient",
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.5,
      opacityTo: 0.1,
      stops: [0, 90, 100],
    },
  },
  responsive: [
    {
      breakpoint: 1024,
      options: {
        chart: {
          height: 300,
        },
      },
    },
    {
      breakpoint: 1366,
      options: {
        chart: {
          height: 350,
        },
      },
    },
  ],
  stroke: {
    width: [3, 3],
    curve: "smooth", // Smooth curve for the line
  },
  grid: {
    xaxis: {
      lines: {
        show: true,
      },
    },
    yaxis: {
      lines: {
        show: true,
      },
    },
  },
  dataLabels: {
    enabled: false,
  },
  markers: {
    size: 6,
    colors: "#fff",
    strokeColors: ["#0F0440", "#55E59A"],
    strokeWidth: 3,
    strokeOpacity: 0.9,
    fillOpacity: 1,
    hover: {
      sizeOffset: 5,
    },
  },
  tooltip: {
    shared: true,
    intersect: false,
    y: {
      formatter: (value: number) => value + " Colleges",
    },
  },
  xaxis: {
    type: "category",
    categories: [
      "January", "February", "March", "April", "May", "June", "July",
      "August", "September", "October", "November", "December",
    ],
    axisBorder: {
      show: true,
      color: "#DADADA", // Adds a border to the x-axis
    },
    axisTicks: {
      show: true,  // Display ticks
      color: "#DADADA", // Color of the ticks
    },
    labels: {
      style: {
        colors: "#5f6368", // Color of the axis labels (months)
        fontSize: "12px", // Font size of the months
      },
    },
  },
  yaxis: {
    title: {
      style: {
        fontSize: "0px",
      },
    },
    min: 0,
    max: 100,
  },
};

interface SeriesData {
  name: string;
  data: number[];
}

const ChartOne: React.FC = () => {
  const [series, setSeries] = useState<SeriesData[]>([
    { name: "India", data: Array(12).fill(0) },
    { name: "Abroad", data: Array(12).fill(0) },
  ]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("month");

  useEffect(() => {
    const fetchCollegeData = async () => {
      try {
        const response = await apiClient.get("/api/college");
        const colleges = response.data;

        // Initialize empty counts for each month
        const indiaCount = Array(12).fill(0);
        const abroadCount = Array(12).fill(0);

        colleges.forEach((college: any) => {
          const country = college.country?.trim().toLowerCase();
          const date = new Date(college.createdAt); // Assuming createdAt is the date field
          const month = date.getMonth(); 
          
          if (country === "india") {
            indiaCount[month] += 1;
          } else {
            abroadCount[month] += 1;
          }
        });

        setSeries([
          { name: "India", data: indiaCount },
          { name: "Abroad", data: abroadCount },
        ]);
      } catch (error) {
        console.error("Error fetching college data:", error);
      }
    };

    fetchCollegeData();
  }, []);

  // Handle period selection (Day, Week, Month)
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    // You can add logic here to update the chart data dynamically based on the period
    
    if (period === "day") {
     
    } else if (period === "week") {
      
    } else if (period === "month") {
      
    }
  };

  return (
    <div className="col-span-12 rounded-sm bg-white px-6 pb-6 pt-8 shadow-lg sm:px-8 xl:col-span-8">
      <div className="flex flex-wrap items-start justify-between gap-4 sm:flex-nowrap">
        <div className="text-lg font-semibold text-gray-700">College Distribution</div>
        <div className="flex justify-end">
          <div className="inline-flex items-center rounded-md bg-gray-100 p-2">
            <button
              className={`rounded bg-gray-200 px-4 py-1 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-300 ${selectedPeriod === "day" ? "bg-gray-300" : ""}`}
              onClick={() => handlePeriodChange("day")}
            >
              Day
            </button>
            <button
              className={`rounded px-4 py-1 text-sm font-medium text-gray-700 hover:bg-gray-300 ${selectedPeriod === "week" ? "bg-gray-300" : ""}`}
              onClick={() => handlePeriodChange("week")}
            >
              Week
            </button>
            <button
              className={`rounded px-4 py-1 text-sm font-medium text-gray-700 hover:bg-gray-300 ${selectedPeriod === "month" ? "bg-gray-300" : ""}`}
              onClick={() => handlePeriodChange("month")}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div id="chartOne">
          <ReactApexChart
            options={options}
            series={series}
            type="area"
            height={350}
            width="100%"
          />
        </div>
      </div>
    </div>
  );
};

export default ChartOne;
