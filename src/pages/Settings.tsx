const Settings = () => {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold font-grotesk text-neutral-800">
            Settings
          </h1>
          <p className="text-sm text-neutral-500">
            Manage and track all your polls
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
