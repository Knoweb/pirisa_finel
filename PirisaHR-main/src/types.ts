import { IconType } from "react-icons";

export interface NavSubItem {
  id: string;
  label: string;
  path: string;
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: IconType;
  subItems: NavSubItem[];
}