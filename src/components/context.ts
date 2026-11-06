import { createContext, useContext } from "react";
import type { Data } from "../types";
export interface Context {
  data: Data;
  update: (fn: (data: Data) => Data) => Promise<boolean>;
  toast: (message: string) => void;
  now: Date;
  message: string;
}
export const Store = createContext<Context | null>(null);
export function useStore() {
  const value = useContext(Store);
  if (!value) throw new Error("学习数据尚未初始化");
  return value;
}
