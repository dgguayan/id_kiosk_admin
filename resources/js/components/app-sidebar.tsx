import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, IdCard, UsersRound, BriefcaseBusiness, NotepadTextDashed, FileClock, Users } from 'lucide-react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { auth } = usePage().props as any;
    const isHR = auth?.user?.role === 'HR';

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutGrid,
        },
        {
            title: 'Pending IDs',
            href: '/pending-id',
            icon: IdCard,
        },
        {
            title: 'Employee List',
            href: '/employee',
            icon: UsersRound,
        },
        {
            title: 'Business Units',
            href: '/business-unit',
            icon: BriefcaseBusiness,
        },
        {
            title: 'ID Templates',
            href: '/id-templates',
            icon: NotepadTextDashed,
        },
        ...(isHR ? [] : [
        {
            title: 'Backlogs',
            href: '/activity-log',
            icon: FileClock,
        },
        ]),
        ... (isHR ? []: [
            {
                title: 'User Management',
                href: '/user-management',
                icon: Users,
            }
        ]),
    ];

    const footerNavItems: NavItem[] = [
        // {
        //     title: 'Repository',
        //     href: 'https://github.com/laravel/react-starter-kit',
        //     icon: Folder,
        // },
        // {
        //     title: 'Documentation',
        //     href: 'https://laravel.com/docs/starter-kits',
        //     icon: BookOpen,
        // },
        {
            title: '© All rights reserved. Created by CMU IT Interns 2025 || Ayunar, R., Baylosis, K., Coritico E., Guayan, D.',
            href: '',
            icon: null,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
            <SidebarMenu>
                <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                    <Link href="/dashboard" preserveState={false} preserveScroll={false} className='h-full flex items-center justify-center'>
                    <div className="flex flex-col items-center">
                        <img 
                            src="/images/logos/mmhi-logo.png" 
                            alt="Company Logo" 
                            className="max-w-full h-auto mb-2 dark:invert" 
                            style={{ maxHeight: "80px" }} 
                        />
                    </div>
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                    <Link href="/dashboard" preserveState={false} preserveScroll={false} className='h-full w-full flex items-center justify-center p-0'>
                        <div className="flex items-center justify-center w-full">
                        <AppLogo />
                        </div>
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
            <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
            <NavFooter items={footerNavItems} className="mt-auto" />
            <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}