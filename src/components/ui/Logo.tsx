import { FaSquarePollHorizontal } from "react-icons/fa6";

const Logo = () => {
  return (
    <div className="flex gap-2 font-grotesk items-center cursor-pointer">
      <FaSquarePollHorizontal className="text-teal-600 w-6 h-6" />
      <p className="text-2xl text-gray-800 font-semibold">PollUp</p>
    </div>
  );
};

export default Logo;
