<?php

namespace Database\Seeders;

use App\Models\Employee;
use Carbon\Carbon;
use Faker\Factory as Faker;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class EmployeeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();
        
        // Predefined positions for more realistic data
        $positions = [
            'Software Engineer',
            'Frontend Developer', 
            'Backend Developer',
            'Project Manager',
            'Business Analyst',
            'HR Manager',
            'Accounting Staff',
            'Administrative Assistant',
            'Marketing Specialist',
            'Customer Support Representative',
            'Network Administrator',
            'Quality Assurance Specialist',
            'Operations Manager',
            'Sales Executive',
            'Content Writer'
        ];

        for ($i = 0; $i < 10000; $i++) {
            $firstname = $faker->firstName;
            $lastname = $faker->lastName;
            $middlename = $faker->optional(0.7)->lastName;
            $nameExtension = $faker->optional(0.2)->randomElement(['Jr.', 'Sr.', 'II', 'III', 'IV']);
            
            // Generate a realistic ID number (e.g., EMP-2025-0001)
            $employeeIdCounter = str_pad($i + 1, 4, '0', STR_PAD_LEFT);
            $idNo = 'EMP-' . date('Y') . '-' . $employeeIdCounter;
            
            // Random date in the past 5 years
            $dateHired = $faker->dateTimeBetween('-5 years', 'now')->format('Y-m-d');
            
            // Birthday between 21 and 60 years ago
            $birthday = $faker->dateTimeBetween('-60 years', '-21 years')->format('Y-m-d');
            
            // Employment status with weighted randomization
            $employmentStatusOptions = ['inactive', 'active', 'resigned', 'terminated'];
            $employmentStatusWeights = [30, 60, 5, 5];
            $employmentStatus = $this->getRandomWeightedElement($employmentStatusOptions, $employmentStatusWeights);

            // Properly assign id_status (printed or pending)
            $idStatusOptions = ['printed', 'pending'];
            $idStatusWeights = [70, 30];
            $idStatus = $this->getRandomWeightedElement($idStatusOptions, $idStatusWeights);

            Employee::create([
                'uuid' => Str::uuid(),
                'id_no' => $idNo,
                'date_hired' => $dateHired,
                'employee_firstname' => $firstname,
                'employee_middlename' => $middlename,
                'employee_lastname' => $lastname,
                'employee_name_extension' => $nameExtension,
                'address' => $faker->address,
                'birthday' => $birthday,
                'businessunit_id' => $faker->numberBetween(1, 5), // Assuming business_units table has IDs from 1 to 5
                'position' => $faker->randomElement($positions),
                'tin_no' => $faker->optional(0.8)->numerify('###-###-###-###'),
                'sss_no' => $faker->optional(0.8)->numerify('##-#######-#'),
                'hdmf_no' => $faker->optional(0.8)->numerify('####-####-####'),
                'phic_no' => $faker->optional(0.8)->numerify('##-#########-#'),
                'emergency_name' => $faker->name,
                'emergency_contact_number' => $faker->phoneNumber,
                'emergency_address' => $faker->address,
                'id_status' => $idStatus,
                'reason' => null,
                'employment_status' => $employmentStatus,
                'employee_id_counter' => $employeeIdCounter,
                'image_person' => $faker->optional(0.7) ? 'pfp.png' : null,
                'image_signature' => $faker->optional(0.6) ? 'signature.png' : null,
                'image_qrcode' => $faker->optional(0.8) ? 'qrcode.png' : null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }
    }

    /**
     * Get a random element with weighted probability
     *
     * @param array $elements Array of elements to choose from
     * @param array $weights Array of weights corresponding to elements
     * @return mixed Selected element
     */
    private function getRandomWeightedElement($elements, $weights)
    {
        $totalWeight = array_sum($weights);
        $randomWeight = mt_rand(1, $totalWeight);
        
        $currentWeight = 0;
        foreach ($elements as $index => $element) {
            $currentWeight += $weights[$index];
            if ($randomWeight <= $currentWeight) {
                return $element;
            }
        }
        
        return $elements[0]; // Fallback
    }
}
