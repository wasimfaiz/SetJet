"use client";
import React from "react";

interface CircularProgressBarProps {
    size: number;
    strokeWidth: number;
    value: number; // Now value is number
    maxValue: number;
    color?: string;
    trackColor?: string;
    backgroundRatio?: number; // New prop to control the background circle size
}

const CircularProgressBar: React.FC<CircularProgressBarProps> = ({
    size,
    strokeWidth,
    value,
    maxValue,
    color = "#55E59A",
    trackColor = "#ffffff",
    backgroundRatio = 1, // Default background ratio
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const percentage = (value / maxValue) * 100;
    const progress = (percentage / 100) * circumference;
    const backgroundRadius = radius * backgroundRatio; // Control background size

    return (
        <svg
            width={size}
            height={size}
            style={{ transform: "rotate(-0deg)", overflow: "visible" }}
        >
            {/* Background Circle */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={backgroundRadius} // Use backgroundRadius here
                fill="transparent"
                stroke={trackColor}
                strokeWidth={strokeWidth}
            />
            {/* Progress Circle */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                strokeLinecap="round"
            />
            {/* Text */}
            <text
                x="50%"
                y="50%"
                dominantBaseline="middle"
                textAnchor="middle"
                fontSize={size / 5} // Dynamic font size
                fill={"#ffffff"}
            >
                {String(value)}  {/* Explicitly convert value to string here if needed */}
            </text>
        </svg>
    );
};

export default CircularProgressBar;