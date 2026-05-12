import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import { getRouter } from "./router";
import "./styles.css";

const router = getRouter();
const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element #root not found");
}

root.innerHTML = "";

createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={router.options.context.queryClient}>
      <RouterProvider router={router} />
      <Toaster position="top-center" theme="dark" />
    </QueryClientProvider>
  </React.StrictMode>,
);