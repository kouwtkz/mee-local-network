import React from "react";
import { useEffect, useRef } from "react";
import { BsTriangleFill } from "react-icons/bs";

export function TopJumpArea() {
  const ref = useRef<HTMLButtonElement>(null);
  var scrTop = 400;
  function handleScroll() {
    if (ref.current)
      if (window.scrollY > scrTop) {
        ref.current.classList.remove("hide");
      } else {
        ref.current.classList.add("hide");
      }
  }
  useEffect(() => {
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrTop]);
  return (
    <button
      type="button"
      className="topJump"
      title="ホームへ戻る"
      ref={ref}
      onClick={() => {
        scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      <BsTriangleFill />
    </button>
  );
}
