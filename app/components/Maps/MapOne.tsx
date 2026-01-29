import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet";
import L from "leaflet";
import React, { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

// Predefined state-to-coordinates mapping
const stateCoordinates: Record<string, [number, number]> = {
  MH: [19.7515, 75.7139], // Maharashtra
  WB: [22.9868, 87.855],  // West Bengal
  UP: [28.2076, 78.9629], // Uttar Pradesh
  DL: [28.6139, 77.209],  // Delhi
  TN: [11.127, 78.6569],  // Tamil Nadu
  KA: [15.3173, 75.7139], // Karnataka
  GJ: [22.2587, 71.1924], // Gujarat
  RJ: [26.9124, 75.7873], // Rajasthan
  AP: [17.9124, 81.4741], // Andhra Pradesh
  AR: [27.0928, 93.5953], // Arunachal Pradesh
  AS: [26.2442, 92.5378], // Assam
  BR: [25.0961, 85.3131], // Bihar
  CG: [21.2787, 81.8661], // Chhattisgarh
  GA: [15.2993, 74.124],   // Goa
  HR: [29.0588, 76.0856], // Haryana
  HP: [32.0846, 77.6875], // Himachal Pradesh
  JH: [23.6105, 85.2799], // Jharkhand
  KL: [10.8505, 76.2711], // Kerala
  MP: [23.2599, 77.4126], // Madhya Pradesh
  MN: [24.6637, 93.9063], // Manipur
  ML: [25.5788, 91.8833], // Meghalaya
  MZ: [23.1645, 92.9376], // Mizoram
  NL: [26.1584, 94.5624], // Nagaland
  OD: [20.9425, 85.7799], // Odisha
  PB: [31.1471, 75.3412], // Punjab
  SK: [27.533, 88.5122],  // Sikkim
  TS: [17.123, 78.9372],  // Telangana
  TR: [23.9407, 91.9882], // Tripura
  UK: [30.0668, 79.0193], // Uttarakhand
  AN: [11.7401, 92.6586], // Andaman and Nicobar Islands
  CH: [30.7333, 76.7794], // Chandigarh
  DN: [20.1807, 73.0169], // Dadra and Nagar Haveli and Daman and Diu
  LD: [10.568, 72.6348],  // Lakshadweep
  PY: [11.9416, 79.8083], // Puducherry
};

interface Student {
  personalInfo: {
    state: string;
    coordinates?: [number, number];
  };
}

const stateData = [
  { label: "Andhra Pradesh", value: "AP" },
  { label: "Arunachal Pradesh", value: "AR" },
  { label: "Assam", value: "AS" },
  { label: "Bihar", value: "BR" },
  { label: "Chhattisgarh", value: "CG" },
  { label: "Goa", value: "GA" },
  { label: "Gujarat", value: "GJ" },
  { label: "Haryana", value: "HR" },
  { label: "Himachal Pradesh", value: "HP" },
  { label: "Jharkhand", value: "JH" },
  { label: "Karnataka", value: "KA" },
  { label: "Kerala", value: "KL" },
  { label: "Madhya Pradesh", value: "MP" },
  { label: "Maharashtra", value: "MH" },
  { label: "Manipur", value: "MN" },
  { label: "Meghalaya", value: "ML" },
  { label: "Mizoram", value: "MZ" },
  { label: "Nagaland", value: "NL" },
  { label: "Odisha", value: "OD" },
  { label: "Punjab", value: "PB" },
  { label: "Rajasthan", value: "RJ" },
  { label: "Sikkim", value: "SK" },
  { label: "Tamil Nadu", value: "TN" },
  { label: "Telangana", value: "TS" },
  { label: "Tripura", value: "TR" },
  { label: "Uttar Pradesh", value: "UP" },
  { label: "Uttarakhand", value: "UK" },
  { label: "West Bengal", value: "WB" },
  { label: "Andaman and Nicobar Islands", value: "AN" },
  { label: "Chandigarh", value: "CH" },
  { label: "Dadra and Nagar Haveli and Daman and Diu", value: "DN" },
  { label: "Lakshadweep", value: "LD" },
  { label: "Delhi", value: "DL" },
  { label: "Puducherry", value: "PY" },
];

const MapWithPins: React.FC = () => {
  const [indiaGeoJson, setIndiaGeoJson] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);

  // Fetch GeoJSON data for India
  useEffect(() => {
    fetch("/india.geojson")
      .then((response) => response.json())
      .then((data) => setIndiaGeoJson(data))
      .catch((error) => console.error("Error loading GeoJSON data:", error));
  }, []);

  // Fetch student data once on component mount
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const response = await fetch("/api/client");
        const data = await response.json();
        console.log("Fetched students data:", data); // Debugging
        setStudents(data?.clients);
      } catch (error) {
        console.error("Error loading student data:", error);
      }
    };

    fetchStudentData();
  }, []); // Empty dependency array ensures it runs only once

  const getStateCoordinates = (state: string | undefined, coordinates?: [number, number]): [number, number] => {
    if (coordinates && coordinates.length === 2) {
      return coordinates;
    }

    if (!state || typeof state !== "string" || state.trim() === "") {
      console.warn(`Invalid or missing state provided: ${state}`);
      return [0, 0];
    }

    const normalizedState = state.trim().toLowerCase();
    const stateCode = stateData.find((s) => s.label.toLowerCase() === normalizedState)?.value;

    if (stateCode && stateCoordinates[stateCode]) {
      return stateCoordinates[stateCode];
    }

    console.warn(`State not found in predefined list: ${state}`);
    return [0, 0];
  };

  // Count the number of students in each state
  const stateCount = students.reduce((acc, student) => {
    const state = student?.personalInfo?.state || "Unknown";
    if (acc[state]) {
      acc[state]++;
    } else {
      acc[state] = 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="col-span-12 rounded-sm bg-white px-7.5 py-6 shadow-default xl:col-span-7">
      <h4 className="mb-2 text-xl font-semibold text-black">Clients all over India</h4>
      <div className="h-[500px] relative z-10 india-map-container">
        <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {indiaGeoJson && <GeoJSON data={indiaGeoJson} />}

          {students
            .map((student, index) => {
              const state = student?.personalInfo?.state || "Unknown";
              const coordinates = student?.personalInfo?.coordinates;
              const markerCoordinates = getStateCoordinates(state, coordinates);

              if (markerCoordinates[0] === 0 && markerCoordinates[1] === 0) {
                console.warn(`Skipping marker for invalid or missing state: ${state}`);
                return null;
              }

              return (
                <Marker
                  position={markerCoordinates as L.LatLngTuple}
                  key={`${state}-${index}`} // Key includes both state and index
                  icon={customIcon}
                >
                  <Popup>
                    {state} - {stateCount[state] || 0} clients
                  </Popup>
                </Marker>
              );
            })
            .filter(Boolean)}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapWithPins;

const customIcon = new L.Icon({
  iconUrl: "/pin.png",
  iconSize: [15, 20],
  iconAnchor: [12, 25],
});
