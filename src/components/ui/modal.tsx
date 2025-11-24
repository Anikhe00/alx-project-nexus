import { Button } from "./button";
// import { Link } from "react-router-dom";

type ModalProps = {
  title: string;
  description: string;
  buttonLabel: string;
  // icon?: LucideIcon;
  linkLabel?: string;
  linkPath?: string;
  caption?: string;
};

const Modal = ({
  title,
  description,
  buttonLabel,
  // linkLabel,
  // linkPath,
  caption,
}: ModalProps) => {
  return (
    <div className="fixed backdrop-blur-sm transition-opacity duration-300 inset-0 bg-black/70 z-100 flex items-center justify-center">
      <div className="w-md bg-white font-grotesk flex flex-col items-center justify-center px-6 py-6">
        {/* Icon */}
        <div>{/* <Icon /> */}</div>
        {/* Title */}
        <h2 className="text-3xl font-semibold text-neutral-800">{title}</h2>
        {/* Descriptions */}
        <p className="text-base font-normal text-neutral-500">{description}</p>
        {/* Button */}
        <Button className="rounded-none text-white bg-teal-600 hover:bg-teal-500">
          {buttonLabel}
        </Button>
        {/* Resend */}
        {caption && <p></p>}
        {/* Link */}
      </div>
    </div>
  );
};

export default Modal;
