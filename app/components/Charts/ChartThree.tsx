import apiClient from "@/app/utils/apiClient";
import { ApexOptions } from "apexcharts";
import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";

const options: ApexOptions = {
  chart: {
    fontFamily: "Satoshi, sans-serif",
    type: "donut",
  },
  colors: ["#0F0440", "#55E59A", "#a754ff", "#E50600"],
  legend: {
    show: false,
    position: "bottom",
  },
  plotOptions: {
    pie: {
      donut: {
        size: "65%",
        background: "transparent",
      },
    },
  },
  dataLabels: {
    enabled: false,
  },
  responsive: [
    {
      breakpoint: 2600,
      options: {
        chart: {
          width: 380,
        },
      },
    },
    {
      breakpoint: 640,
      options: {
        chart: {
          width: 200,
        },
      },
    },
  ],
};

const ChartThree: React.FC = () => {
  const [series, setSeries] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/api/client");
      const apiData = response.data;

      if (!Array.isArray(apiData)) {
        throw new Error("Invalid API response format: expected an array.");
      }

      // Predefined country options
      const predefinedCountries = ["GERMANY", "UK", "USA"];
      const countryCounts: { [key: string]: number } = {};

      // Initialize counts for predefined countries
      predefinedCountries.forEach((country) => {
        countryCounts[country] = 0;
      });
      // Initialize "Others" to 0
      countryCounts["Others"] = 0;

      // Process the API data
      apiData.forEach((item: { studentReg?: { countryApplyingFor?: string }; count?: any }) => {
        const country = item?.studentReg?.countryApplyingFor?.trim() || "Others";
        const count = parseInt(item?.count, 10) || 0;

        console.log(`Processing: Country - ${country}, Count - ${count}`); // Debugging each item

        if (predefinedCountries.includes(country)) {
          countryCounts[country] += count;
        } else if (count > 0) {
          countryCounts["Others"] += count; // Accumulate count in "Others"
        }
      });

      console.log("Processed Data (countryCounts):", countryCounts); 

      const countries = Object.keys(countryCounts);
      const counts = Object.values(countryCounts);

      if (countries.length > 0 && counts.some((value) => value > 0)) {
        setLabels(countries);
        setSeries(counts);
      } else {
        setLabels(["No Data"]);
        setSeries([0]);
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching client data:", err);
      setError("Failed to fetch client data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
}, []);


  const chartOptions = {
    ...options,
    labels, // Dynamic labels
  };

  return (
    <div className="col-span-12 rounded-sm bg-white px-5 pb-5 pt-7.5 shadow-default sm:px-7.5 xl:col-span-5">
      <div className="mb-3 justify-between gap-4 sm:flex">
        <h5 className="text-xl font-semibold text-black dark:text-white">
          Visitors Analytics
        </h5>
      </div>

      <div id="chartThree" className="mx-auto flex justify-center">
        {isLoading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : series.some((value) => value > 0) ? (
          <ReactApexChart options={chartOptions} series={series} type="donut" />
        ) : (
          <p>No data available to display.</p>
        )}
      </div>
    </div>
  );
};

export default ChartThree;
