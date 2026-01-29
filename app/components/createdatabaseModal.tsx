import React from "react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";

interface DatabaseModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (name: string, type: string) => void;
  name: string;
  defaultValue?: string;
  defaultType?: string; // Optional default for type (shared/individual)
}

const DatabaseModal: React.FC<DatabaseModalProps> = ({
  show,
  onClose,
  onSave,
  name,
  defaultValue = "",
  defaultType = "SHARED", // Default to 'shared'
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-lg font-semibold text-center mb-4">
          {defaultValue ? `Edit ${name}` : `Enter ${name}`}
        </h2>
        <Formik
          initialValues={{ name: defaultValue, type: defaultType }}
          validationSchema={Yup.object({
            name: Yup.string().required(`${name} name is required`),
            type: Yup.string().oneOf(["SHARED", "INDIVIDUAL"]).required("Type is required"),
          })}
          onSubmit={(values) => {
            onSave(values.name, values.type);
            onClose();
          }}
        >
          {() => (
            <Form>
              <div className="flex flex-col mb-4">
                <label className="text-sm font-semibold text-deepblue">
                  {name} Name
                </label>
                <Field
                  name="name"
                  placeholder={`Enter ${name} name`}
                  className="border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:ring focus:ring-deepblue focus:outline-none"
                />
                <ErrorMessage
                  name="name"
                  component="div"
                  className="text-red-500 text-xs mt-1"
                />
              </div>

              <div className="flex flex-col mb-4">
                <label className="text-sm font-semibold text-deepblue">Type</label>
                <Field
                  as="select"
                  name="type"
                  className="border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:ring focus:ring-deepblue focus:outline-none"
                >
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="SHARED">Shared</option>
                </Field>
                <ErrorMessage
                  name="type"
                  component="div"
                  className="text-red-500 text-xs mt-1"
                />
              </div>

              <div className="flex justify-between">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-900 to-deepblue hover:from-green-900 hover:to-parrotgreen text-white py-2 px-4 rounded-lg"
                >
                  {defaultValue ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default DatabaseModal;
