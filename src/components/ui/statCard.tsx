import type { LucideIcon } from "lucide-react";

type SummaryCardProps = {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  data: number;
};

const StatCard = ({
  title,
  icon: Icon,
  iconColor = "text-teal-600",
  data,
}: SummaryCardProps) => {
  return (
    <div className="bg-white font-grotesk overflow-hidden border border-neutral-200 rounded-lg group">
      <div className="p-5">
        <div className="w-full flex-1">
          <dl className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <dt className="flex items-center text-sm font-normal text-neutral-500 truncate">
                <Icon
                  className={`h-4 w-4 ${iconColor} mr-1`}
                  aria-hidden="true"
                />
                {title}
              </dt>
            </div>

            <dd className="font-medium text-neutral-800">{data}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
