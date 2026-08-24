import {
  BrainCircuit,
  Cloud,
  Container,
  HardDrive,
  LayoutDashboard,
  Network,
  Server,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Containers", href: "/containers", icon: Container },
  { title: "Services", href: "/services", icon: Server },
  { title: "Storage", href: "/storage", icon: HardDrive },
  { title: "Network", href: "/network", icon: Network },
  { title: "Ollama", href: "/ollama", icon: BrainCircuit },
  { title: "Tunnel", href: "/tunnel", icon: Cloud },
  { title: "Settings", href: "/settings", icon: Settings },
];
