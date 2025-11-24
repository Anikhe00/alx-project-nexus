import Logo from "../ui/Logo";

const Footer = () => {
  return (
    <footer className="flex font-grotesk flex-col px-6 md:px-8 lg:px-10 py-6 gap-3 w-full h-auto items-center justify-center bg-neutral-50 border-t border-neutral-100">
      <Logo />
      <p className="text-sm lg:text-base text-neutral-600">
        Create, share, and analyze polls instantly.
      </p>
      <p className="text-sm text-neutral-400">
        &copy; 2025 PollUp by Shakirat. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
