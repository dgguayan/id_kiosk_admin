import { Icon } from '@/components/icon';
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { type ComponentPropsWithoutRef } from 'react';

export function NavFooter({
    items,
    className,
    ...props
}: ComponentPropsWithoutRef<typeof SidebarGroup> & {
    items: NavItem[];
}) {
    return (
        <SidebarGroup {...props} className={`group-data-[collapsible=icon]:p-0 ${className || ''}`}>
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <div className="flex items-center gap-2 px-3 py-2 text-neutral-600 dark:text-neutral-300">
                                {item.icon && <Icon iconNode={item.icon} className="h-5 w-5" />}
                                <span>{item.title}</span>
                            </div>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
