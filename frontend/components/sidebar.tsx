"use client";

import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Feather,
  List,
  Menu,
  Settings,
  Upload,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useState } from "react";
import useSWR from "swr";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { apiClient, type Transcription } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import { Quote } from "./quote";

interface SidebarProps {
  className?: string;
}

interface NavigationChild {
  href: string;
  label: string;
  subtitle?: string;
  compact?: boolean;
}

interface NavigationItem {
  href: string;
  icon: LucideIcon;
  label: string;
  exact: boolean;
  collapsible?: boolean;
  children?: NavigationChild[];
}

const SidebarComponent = function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [itemsOpen, setItemsOpen] = useState<Record<string, boolean>>({});
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const setIsItemOpen = (item: string, open: boolean) => {
    setItemsOpen(prev => ({ ...prev, [item]: open }));
  };

  const { data: transcriptions = [], isLoading } = useSWR("transcriptions", () => apiClient.getTranscriptions(), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  // Navigation configuration - declarative approach
  const navigationItems: readonly NavigationItem[] = [
    {
      href: "/",
      icon: BookOpen,
      label: "Streams",
      exact: true,
    },
    {
      href: "/transcriptions",
      icon: List,
      label: "Transcriptions",
      exact: false,
      collapsible: true,
      children: transcriptions.slice(0, 5).map((transcription: Transcription) => ({
        href: `/transcription/${transcription.id}`,
        label: transcription.filename.replace(/\.[^/.]+$/, ""),
        subtitle: formatDate(transcription.created_at),
        compact: true,
      })),
    },
    {
      href: "/upload",
      icon: Upload,
      label: "Record",
      exact: false,
    },
    {
      href: "/integrations",
      icon: Settings,
      label: "Integrations",
      exact: false,
    },
  ] as const;

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  // Component to render navigation items declaratively
  const renderNavItem = (item: NavigationItem, index: number) => {
    const IconComponent = item.icon;
    const active = isActive(item.href, item.exact);

    if (item.collapsible) {
      const isOpen = itemsOpen[item.label] ?? true;
      return (
        <div key={index} className="space-y-1">
          <Collapsible open={isOpen} onOpenChange={v => setIsItemOpen(item.label, v)}>
            <div className="flex items-center justify-between">
              <Link href={item.href} className="flex-1">
                <Button
                  variant={active ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    active && "bg-accent text-accent-foreground",
                  )}
                >
                  <IconComponent className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="ml-2 px-2 text-muted-foreground hover:text-foreground">
                  {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-1 pl-4">
              {isLoading ? (
                <div className="py-2 text-xs text-muted-foreground italic">Loading...</div>
              ) : item.children && item.children.length === 0 ? (
                <div className="py-2 text-xs text-muted-foreground italic">No thoughts captured yet</div>
              ) : item.children ? (
                item.children.map((child: NavigationChild, childIndex: number) => (
                  <Link key={childIndex} href={child.href}>
                    <Button
                      variant={isActive(child.href) ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start text-left font-normal text-xs py-2 h-auto",
                        isActive(child.href) && "bg-accent/50 text-accent-foreground",
                      )}
                    >
                      <div className="flex flex-col items-start w-full min-w-0">
                        <div className="font-medium truncate w-full">{child.label}</div>
                        <div className="text-xs text-muted-foreground">{child.subtitle}</div>
                      </div>
                    </Button>
                  </Link>
                ))
              ) : null}
            </CollapsibleContent>
          </Collapsible>
        </div>
      );
    }

    return (
      <Link key={index} href={item.href}>
        <Button
          variant={active ? "secondary" : "ghost"}
          className={cn("w-full justify-start text-left font-normal", active && "bg-accent text-accent-foreground")}
        >
          <IconComponent className="mr-2 h-4 w-4" />
          {item.label}
        </Button>
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex h-full w-full flex-col bg-muted/30 border-r border-border">
      {/* Header */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <div className="flex items-center space-x-2">
          <Feather className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl text-foreground stream-text">Joyce</span>
        </div>
        {/* Mobile close button */}
        <Button variant="ghost" size="sm" className="ml-auto lg:hidden" onClick={() => setIsMobileOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-2 px-4">
          <div className="space-y-1">{navigationItems.map((item, index) => renderNavItem(item, index))}</div>
        </nav>
      </div>

      {/* Footer Quote */}
      <div className="border-t border-border p-4">
        <Card className="p-3 bg-accent/20">
          <Quote slug="godfrey-lillian" />
        </Card>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="outline"
        size="sm"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
          <div className="relative flex h-full w-80 flex-col bg-background">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={cn("hidden lg:flex lg:w-80 lg:flex-col", className)}>
        <SidebarContent />
      </div>
    </>
  );
};

export const Sidebar = memo(SidebarComponent);
