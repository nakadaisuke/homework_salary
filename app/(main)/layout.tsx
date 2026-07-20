import Link from "next/link";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="nav">
        <Link href="/board" className="nav-title">
          おてつだいきゅうよ
        </Link>
        <Link href="/board" className="nav-link">
          求人ボード
        </Link>
        <Link href="/people" className="nav-link">
          メンバー
        </Link>
      </nav>
      <main>{children}</main>
    </>
  );
}
