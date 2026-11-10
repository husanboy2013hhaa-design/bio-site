import Link from "next/link";

export default function Logo({ href = "/", className = "" }) {
  return (
    <Link href={href} className={`logo ${className}`.trim()}>
      <img src="/ilmbio-logo.png" alt="ilm.bio" className="logo-img" />
    </Link>
  );
}
