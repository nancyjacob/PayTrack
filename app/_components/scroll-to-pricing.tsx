"use client";

import { Button } from "@/components/ui/button";
import { type ComponentPropsWithoutRef } from "react";

type Props = Omit<ComponentPropsWithoutRef<typeof Button>, "onClick" | "asChild">;

export function ScrollToPricingButton({ children, ...props }: Props) {
  function handleClick() {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <Button onClick={handleClick} {...props}>
      {children}
    </Button>
  );
}
