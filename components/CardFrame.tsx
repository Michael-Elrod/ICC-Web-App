// CardFrame.tsx

interface CardFrameProps {
  children: React.ReactNode;
  className?: string;
  noMargin?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

const CardFrame: React.FC<CardFrameProps> = ({
  children,
  className = "",
  noMargin = false,
  onClick,
}) => {
  return (
    <div
      className={`bg-white dark:bg-zinc-800 shadow-md overflow-hidden sm:rounded-lg ${!noMargin ? "mb-4" : ""} ${className}`}
      onClick={onClick}
    >
      <div className="px-4 py-5 sm:p-6">{children}</div>
    </div>
  );
};

export default CardFrame;
