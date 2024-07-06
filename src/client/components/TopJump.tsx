import React from "react";
import { useEffect, useRef } from "react";

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
      ref={ref}
      onClick={() => {
        scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      ▲
    </button>
  );
}
