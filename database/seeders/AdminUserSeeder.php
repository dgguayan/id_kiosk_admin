<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Create initial admin user
        User::create([
            'name' => 'Admin User',
            'email' => 'admin2@gmail.com',
            'password' => Hash::make('qwertyuiop1234567890!@#$%^&*()'),
            'role' => 'Admin',
            'email_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create initial HR user
        User::create([
            'name' => 'HR User',
            'email' => 'hr@example.com',
            'password' => Hash::make('password'),
            'role' => 'HR',
            'email_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
