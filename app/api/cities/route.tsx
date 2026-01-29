import { NextResponse } from "next/server";

// City data
const cities = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati"],
  "Arunachal Pradesh": ["Itanagar", "Tawang", "Ziro", "Pasighat"],
  "Assam": ["Guwahati", "Dibrugarh", "Silchar", "Tezpur"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur"],
  "Chhattisgarh": ["Raipur", "Bilaspur", "Bhilai", "Korba"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  "Haryana": ["Gurgaon", "Faridabad", "Panipat", "Ambala"],
  "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala", "Solan"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro Steel City"],
  "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi-Dharwad"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik"],
  "Manipur": ["Imphal", "Churachandpur", "Bishnupur", "Thoubal"],
  "Meghalaya": ["Shillong", "Tura", "Nongstoin", "Cherrapunji"],
  "Mizoram": ["Aizawl", "Lunglei", "Champhai", "Serchhip"],
  "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Tuensang"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Puri"],
  "Punjab": ["Chandigarh", "Ludhiana", "Amritsar", "Jalandhar"],
  "Rajasthan": ["Jaipur", "Udaipur", "Jodhpur", "Ajmer"],
  "Sikkim": ["Gangtok", "Namchi", "Gyalshing", "Mangan"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
  "Tripura": ["Agartala", "Udaipur", "Kailashahar", "Dharmanagar"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Nainital", "Rishikesh"],
  "West Bengal": ["Kolkata", "Darjeeling", "Siliguri", "Howrah"],
  "Andaman and Nicobar Islands": ["Port Blair", "Havelock Island", "Neil Island", "Diglipur"],
  "Chandigarh": ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Silvassa", "Daman", "Diu"],
  "Lakshadweep": ["Kavaratti", "Agatti", "Minicoy", "Amini"],
  "Delhi": ["Delhi"],
  "Puducherry": ["Puducherry", "Karaikal", "Yanam", "Mahe"],
};

// GET - Fetch cities by state or all cities if no state is provided
export async function GET(req: any) {
  try {
    // Extract state name from query parameters
    const url = new URL(req.url);
    const state = url.searchParams.get("state");

    if (!state) {
      // Return all states and their cities if no state is provided
      return NextResponse.json({ states: cities });
    }

    //@ts-ignore
    if (!cities[state]) {
      return NextResponse.json(
        { error: `No cities found for state: ${state}` },
        { status: 404 }
      );
    }

    //@ts-ignore
    return NextResponse.json({ state, cities: cities[state] });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
