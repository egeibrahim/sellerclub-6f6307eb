import { LayoutList, ShoppingCart, User, ImageIcon, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface IconSidebarProps {
  className?: string;
}

const navItems = [
  { icon: LayoutList, label: "Listings", path: "/inventory" },
  { icon: ShoppingCart, label: "Siparişler", path: "/orders" },
  { icon: User, label: "Profiller", path: "/profiles" },
  { icon: ImageIcon, label: "Studio", path: "/studio" },
  { icon: Settings, label: "Ayarlar", path: "/settings" },
];

export const IconSidebar = ({ className }: IconSidebarProps) => {
  return (
    <TooltipProvider delayDuration={100}>
      <div className={cn(
        "w-14 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-2",
        className
      )}>
        {/* Logo */}
        <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center mb-4">
          <span className="text-white font-bold text-sm">SC</span>
        </div>

        {/* Navigation Icons */}
        {navItems.map((item) => (
          <Tooltip key={item.path}>
            <TooltipTrigger asChild>
              <NavLink
                to={item.path}
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
                  "transition-colors"
                )}
                activeClassName="bg-emerald-50 text-emerald-600"
              >
                <item.icon className="h-5 w-5" />
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-white text-gray-900 border border-gray-200">
              {item.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};
