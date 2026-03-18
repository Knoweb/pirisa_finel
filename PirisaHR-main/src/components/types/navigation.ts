import { IconType } from "react-icons";

export interface SubNavItem {
  id: string;
  label: string;
  path: string;
   roles?: string[];
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: IconType;
  subItems: SubNavItem[];
  roles?: string[];
}