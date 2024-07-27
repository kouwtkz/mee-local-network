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
    setTimeout(() => {
      if (ref.current) ref.current.classList.add("working");
    }, 100);
  }, [ref.current]);
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
      title="一番上へ飛ぶ"
      ref={ref}
      onClick={() => {
        scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      <BsTriangleFill />
    </button>
  );
}
