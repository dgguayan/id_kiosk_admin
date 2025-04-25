<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@gmail.com',
            'role' => 'Admin',
            'email_verified_at' => now(),
            'password' => Hash::make('qwertyuiop1234567890!@#$%^&*()'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
