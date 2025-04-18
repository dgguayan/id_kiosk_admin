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

        foreach ($businessUnits as $unit) {
            DB::table('business_units')->insert([
                'businessunit_name' => $unit,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
