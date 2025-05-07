<?php

namespace Database\Seeders;

use App\Models\NetworkPath;
use Illuminate\Database\Seeder;

class NetworkPathSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        NetworkPath::updateOrCreate(
            ['key' => 'network_images_path'],
            ['value' => '\\\\DESKTOP-PJE8A0F\\Users\\Public\\images\\']
        );
    }
}
