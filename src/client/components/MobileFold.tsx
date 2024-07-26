import { ReactNode, useState } from "react";
import { FaCaretDown, FaCaretUp } from "react-icons/fa";

export function MobileFold({
  children,
  closed = <FaCaretDown />,
  opened = <FaCaretUp />,
  title = "展開",
  wide,
}: {
  children?: ReactNode;
  closed?: ReactNode;
  opened?: ReactNode;
  title?: string;
  wide?: boolean;
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
      <div className={"list" + (wide ? " wide" : "")}>{children}</div>
    </div>
  );
}
