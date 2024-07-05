import { RouteObject } from "react-router-dom";
import Root from "./Root";
import React from "react";
import ErrorPage from "./ErrorPage";
import { RoutingUnion } from "./RoutingList";

export const Routing: RouteObject[] = [
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <></>,
      },
    ] as (RouteObject & { path: RoutingUnion })[],
  },
];
