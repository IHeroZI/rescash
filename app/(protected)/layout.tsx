export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative w-full max-w-sm h-screen overflow-hidden shadow-lg bg-white">
      {children}
    </div>
  );
}