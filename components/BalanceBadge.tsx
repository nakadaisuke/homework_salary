export default function BalanceBadge({ yen }: { yen: number }) {
  return <span className="badge badge-money">¥{yen.toLocaleString()}</span>;
}
