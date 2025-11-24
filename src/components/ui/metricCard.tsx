type MetricProps = {
  title: string;
  value: number;
};

const Metric = ({ title, value }: MetricProps) => {
  return (
    <div className="p-5 ">
      <span>{title}</span>
      <span>{value}</span>
    </div>
  );
};

export default Metric;
