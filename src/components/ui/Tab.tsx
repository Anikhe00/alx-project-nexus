import type { LucideIcon } from "lucide-react";

type TabProps = {
  tabName: string;
  icon: LucideIcon;
  children?: React.ReactNode;
  onClick?: () => void;
  isSelected?: boolean;
};

export default function Tab({
  tabName,
  icon: Icon,
  children,
  isSelected,
  ...rest
}: TabProps) {
  return (
    <button
      {...rest}
      className={`w-full hover:bg-teal-100 rounded-sm group flex items-center justify-between cursor-pointer py-2 px-3 ${
        isSelected ? "bg-teal-100 text-teal-600" : "bg-white text-neutral-600"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon
          className="h-5 w-5 group-hover:text-teal-600"
          aria-hidden="true"
        />
        <p className="text-sm group-hover:text-teal-600 font-normal">
          {tabName}
        </p>
      </div>
      <div className="flex items-center justify-center">{children}</div>
    </button>
  );
}
