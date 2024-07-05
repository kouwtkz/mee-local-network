import React, { useLayoutEffect } from "react";
import { ReactNode } from "react";
import { isMobile } from "react-device-detect";
import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";

export function Base({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export default function Root() {
  useLayoutEffect(() => {
    if (isMobile) {
      document.body.classList.add("mobile");
    }
  });
  return (
    <>
      <ScrollRestoration />
      <Base>
        <Outlet />
      </Base>
    </>
  );
}
