<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BusinessUnitSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $businessUnits = [
            'MMHI', 
            'MMFI', 
            'MMEI', 
            'MMHC', 
            'MMDC',
        ];

        $businessUnits_codes = [
            'MMHI' => 'Holdings Incorporated',
            'MMFI' => 'Farms Incorporated',
            'MMEI' => 'Enterprises Incorporated',
            'MMHC' => 'Hospitality Corporation',
            'MMDC' => 'Development Corporation',
        ];

        $businessUnits_image_path = [
            'MMHI' => 'business_units/wmtqLoTtektHXnJCGcyAZmBzAVHLL9QIv4IKo8kO.png',
            'MMFI' => 'business_units/wmtqLoTtektHXnJCGcyAZmBzAVHLL9QIv4IKo8kO.png',
            'MMEI' => 'business_units/8TPfViU8WBlwDbuhqlua6cSSnN8Kv5EtuXu12CyU.png',
            'MMHC' => 'business_units/8TPfViU8WBlwDbuhqlua6cSSnN8Kv5EtuXu12CyU.png',
            'MMDC' => 'business_units/80N0wowMfvpBjFYbgPKNXjdDzx0orxiffOXrNgVe.png',
        ];

        foreach ($businessUnits_codes as $code => $name) {
            DB::table('business_units')->insert([
            'businessunit_name' => $code,
            'businessunit_code' => $name,
            'businessunit_image_path' => $businessUnits_image_path[$code],
            'created_at' => now(),
            'updated_at' => now(),
            ]);
        }
    }
}
