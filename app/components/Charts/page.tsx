"use client";
import Breadcrumb from "../Breadcrumbs/Breadcrumb";

import dynamic from "next/dynamic";
import React from "react";
import ChartOne from "./ChartOne";
import ChartTwo from "./ChartTwo";

const ChartThree = dynamic(() => import("../Charts/ChartThree"), {
  ssr: false,
});

const Chart: React.FC = () => {
  return (
    <>
      <Breadcrumb pageName="Chart" />

      <div className="">
        <ChartOne />
        <ChartTwo />
        <ChartThree />
      </div>
    </>
  );
};

export default Chart;
