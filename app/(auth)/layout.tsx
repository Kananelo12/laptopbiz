import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import React, { ReactNode } from "react";

const layout = async ({ children }: { children: ReactNode }) => {
  const user = await getCurrentUser();
  if (user) redirect("/dashboards");

  return <div>{children}</div>;
};

export default layout;
