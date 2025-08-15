export const metadata = {
  robots: 'noindex, nofollow, noarchive, nosnippet, noimageindex'
};

export default function ViewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}