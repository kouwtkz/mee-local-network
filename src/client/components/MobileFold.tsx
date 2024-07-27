import { ReactNode, useState } from "react";
import { FaCaretDown, FaCaretUp } from "react-icons/fa";

export function MobileFold({
  children,
  closed = <FaCaretDown />,
  opened = <FaCaretUp />,
  title = "展開",
  wide,
  className,
}: {
  children?: ReactNode;
  closed?: ReactNode;
  opened?: ReactNode;
  title?: string;
  wide?: boolean;
  className?: string;
}) {
  const [isOpen, setOpen] = useState(false);
  return (
    <div className={"mobileFold" + (isOpen ? " opened" : "")}>
      <button
        type="button"
        className="opener"
        title={title}
        onClick={() => {
          setOpen(!isOpen);
        }}
      >
        {isOpen ? opened : closed}
      </button>
      <div
        className={
          "list" +
          (className ? " " + className : "") +
          (wide ? " wide" : "")
        }
      >
        {children}
      </div>
    </div>
  );
}
