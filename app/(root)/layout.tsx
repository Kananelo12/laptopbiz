import { Sidebar } from "@/components/layout/sidebar";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import React, { ReactNode } from "react";

const layout = async ({ children }: { children: ReactNode }) => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
    </div>
  );
};

export default layout;
