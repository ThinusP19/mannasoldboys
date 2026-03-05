interface AdminHeaderProps {
  title: string;
}

export const AdminHeader = ({ title }: AdminHeaderProps) => {
  return (
    <header className="hidden md:flex items-center justify-between px-8 py-4 bg-transparent">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
    </header>
  );
};
