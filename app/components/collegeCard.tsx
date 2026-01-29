// components/CollegeCard.tsx
"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import SearchableSelect from "./searchableSelect";
import { checkButtonVisibility } from "../utils/helperFunc";

interface CollegeCardProps {
  col: any;
  permissions: any;
  onView: (college: any) => void;
  onEdit: (college: any) => void;
  onDelete: (college: any) => void;
  onOverview: (collegeId: string) => void;
}

const CollegeCard = ({
  col,
  permissions,
  onView,
  onEdit,
  onDelete,
  onOverview,
}: CollegeCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow p-5 flex flex-col">
      {/* Image container with overlays */}
      <div className="relative">
        <img src={col?.img || "/university.png"} className="w-full h-auto rounded" />
        {col.top && (
          <div className="absolute bg-deepblue top-2 right-2 text-white text-xs font-semibold px-2 py-1 rounded">
            TOP UNIVERSITY
          </div>
        )}
      </div>

      <h3 className="md:text-md font-bold text-deepblue mt-4">{col.name}</h3>
      <p className="text-sm text-gray-600">
        {col.country}  {col.state} {col.city}
      </p>
      {/* Published green dot */}
      <div className="mt-2 flex items-center">
        {col.publish && (
          <span
            className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"
            title="Published"
          />
        )}
        <span className="text-sm font-medium text-gray-700">
          {col.publish ? "Published" : "Unpublished"}
        </span>
      </div>

      <div className="my-4">
      {checkButtonVisibility(permissions, "college", "edit") && (
        <label
          className="block mb-1 font-bold underline cursor-pointer"
          onClick={() => onView(col)}
        >
          {col?.courses?.length || 0} Courses
        </label>)}
        <SearchableSelect
          options={col.courses?.map((c: any) => c.name) ?? []}
          value=""
          onChange={() => {}}
          placeholder="Search Courses"
        />
      </div>

      <div className="mt-auto flex justify-end space-x-2 my-2">
        {checkButtonVisibility(permissions, "college", "edit") && (
          <button onClick={() => onEdit(col)}>
            <FontAwesomeIcon icon={faEdit} className="text-deepblue" />
          </button>
        )}
        {checkButtonVisibility(permissions, "college", "delete") && (
          <button onClick={() => onDelete(col)}>
            <FontAwesomeIcon icon={faTrashCan} className="text-bloodred" />
          </button>
        )}
        <button
          className="text-bold underline"
          onClick={() => onOverview(col._id)}
        >
          Overview
        </button>
      </div>
    </div>
  );
};

export default CollegeCard;
