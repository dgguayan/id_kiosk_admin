<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BusinessUnitSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $businessUnits = [
            [
                'code' => 'MMHI',
                'name' => 'Holdings Incorporated',
                'image_path' => 'business_units/mmhi-logo.png',
            ],
            [
                'code' => 'MMFI',
                'name' => 'Farms Incorporated',
                'image_path' => 'business_units/mmfi-logo.png',
            ],
            [
                'code' => 'MMEI',
                'name' => 'Enterprises Incorporated',
                'image_path' => 'business_units/mmei-logo.png',
            ],
            [
                'code' => 'MMHC',
                'name' => 'Hospitality Corporation',
                'image_path' => 'business_units/mmhc-logo.png',
            ],
            [
                'code' => 'MMDC',
                'name' => 'Development Corporation',
                'image_path' => 'business_units/mmdc-logo.png',
            ],
        ];

        foreach ($businessUnits as $unit) {
            DB::table('business_units')->insert([
                'businessunit_code' => $unit['code'],
                'businessunit_name' => $unit['name'],
                'businessunit_image_path' => $unit['image_path'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
