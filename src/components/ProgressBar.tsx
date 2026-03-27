interface ProgressBarProps {
  sold: number;
  total: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const ProgressBar = ({ sold, total, showLabel = true, size = "md" }: ProgressBarProps) => {
  const percentage = Math.min((sold / total) * 100, 100);

  const heightClass = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  }[size];

  return (
    <div className="w-full">
      <div className={`w-full rounded-full bg-secondary overflow-hidden ${heightClass}`}>
        <div
          className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{sold.toLocaleString("pt-BR")}</span>
          {" / "}
          {total.toLocaleString("pt-BR")} vendidos
        </p>
      )}
    </div>
  );
};

export default ProgressBar;
