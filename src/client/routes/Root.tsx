import React, { useLayoutEffect } from "react";
import { ReactNode } from "react";
import { isMobile } from "react-device-detect";
import { Outlet, ScrollRestoration } from "react-router-dom";
import { DataState } from "../state/DataState";

export function Base({ children }: { children?: ReactNode }) {
  useLayoutEffect(() => {
    if (isMobile) {
      document.body.classList.add("mobile");
    }
  }, []);
  return (
    <>
      <ScrollRestoration />
      {children}
    </>
  );
}

export default function Root() {
  return (
    <Base>
      <Outlet />
    </Base>
  );
}
