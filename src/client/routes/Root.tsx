import React, { useLayoutEffect } from "react";
import { ReactNode } from "react";
import { isMobile } from "react-device-detect";
import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import { DataState } from "../state/DataState";
import { Code } from "../components/parse/CodeCheck";

export function Base({ children }: { children?: ReactNode }) {
  useLayoutEffect(() => {
    if (isMobile) {
      document.body.classList.add("mobile");
    }
  }, []);
  return (
    <>
      <ScrollRestoration />
      <DataState />
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
