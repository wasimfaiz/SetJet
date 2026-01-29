import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { faCross, faPhone, faTimes } from "@fortawesome/free-solid-svg-icons";

interface CallModalProps {
  show: boolean;
  onClose: () => void;
  onCall: () => void;
  contact: any;
}

const CallModal: React.FC<CallModalProps> = ({
  show,
  onClose,
  onCall,
  contact,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg md:p-6 p-2 w-70">
        <h2 className="md:text-lg font-semibold text-center md:mb-4">
          Do you want to call {contact?.name} ?
          <div className="md:text-2xl mt-2">{contact?.phoneNumber}</div>
        </h2>
        <div className="flex justify-between">
          <button
            className="bg-bloodred text-white py-1 px-2 rounded-lg"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
          <button
            className="bg-parrotgreen text-deepblue py-1 px-2 rounded-full"
            onClick={onCall}
          >
            <FontAwesomeIcon icon={faPhone} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallModal;
