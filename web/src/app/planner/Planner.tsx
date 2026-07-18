"use client";
import { useEffect, useRef } from "react";
import items from "@/data/planner-items.json";
import { PLANNER_HTML, PLANNER_CSS } from "./markup";
import { mountPlanner } from "./planner-core.js";

export function Planner() {
  const ref = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!ref.current || mounted.current) return;
    mounted.current = true;
    mountPlanner(ref.current, items);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PLANNER_CSS }} />
      <div className="pl" ref={ref} tabIndex={-1} dangerouslySetInnerHTML={{ __html: PLANNER_HTML }} />
    </>
  );
}
