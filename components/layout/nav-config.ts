import {
  BrainCircuit,
  Cloud,
  Container,
  HardDrive,
  LayoutDashboard,
  MemoryStick,
  Network,
  Server,
  Settings,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
      { title: "Alerts", href: "/alerts", icon: TriangleAlert },
    ],
  },
  {
    label: "Host",
    items: [
      { title: "Containers", href: "/containers", icon: Container },
      { title: "Services", href: "/services", icon: Server },
      { title: "Storage", href: "/storage", icon: HardDrive },
      { title: "Memory", href: "/memory", icon: MemoryStick },
      { title: "Network", href: "/network", icon: Network },
    ],
  },
  {
    label: "Apps",
    items: [
      { title: "Ollama", href: "/ollama", icon: BrainCircuit },
      { title: "Tunnel", href: "/tunnel", icon: Cloud },
    ],
  },
];

export const settingsNavItem: NavItem = {
  title: "Settings",
  href: "/settings",
  icon: Settings,
};

export const navItems: NavItem[] = [
  ...navGroups.flatMap((group) => group.items),
  settingsNavItem,
];
