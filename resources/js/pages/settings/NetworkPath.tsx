import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Network Path Settings',
        href: '/settings/network-path',
    },
];

type NetworkPathForm = {
    network_images_path: string;
}

export default function NetworkPath({ networkPath }: { networkPath: string }) {
    const { data, setData, post, errors, processing, recentlySuccessful } = useForm<NetworkPathForm>({
        network_images_path: networkPath,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('settings.network-path.store'), {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Network Path Settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall 
                        title="Network Path Configuration" 
                        description="Update the shared network path for accessing images" 
                    />

                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="network_images_path">Network Images Path</Label>

                            <Input
                                id="network_images_path"
                                className="mt-1 block w-full"
                                value={data.network_images_path.endsWith('\\') ? data.network_images_path : data.network_images_path + '\\'}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setData('network_images_path', value.endsWith('\\') ? value : value + '\\');
                                }}
                                required
                                placeholder="\\\\SERVER\\SharedFolder\\Images\\"
                            />

                            <p className="text-sm text-muted-foreground">
                                Enter the full network path where images are stored, using double backslashes. 
                                Example: \\\\SERVER\\SharedFolder\\Images\\
                            </p>

                            <InputError className="mt-2" message={errors.network_images_path} />
                        </div>

                        <div className="flex items-center gap-4">
                            <Button disabled={processing}>Save</Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-green-600 font-medium">Saved</p>
                            </Transition>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}