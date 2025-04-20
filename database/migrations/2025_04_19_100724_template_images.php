<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        //
        Schema::create('template_images', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('businessunit_id');
            $table->string('image_path');
            $table->string('image_path2');
            
            $table->integer('emp_img_x')->nullable();
            $table->integer('emp_img_y')->nullable();
            $table->integer('emp_img_width')->nullable();
            $table->integer('emp_img_height')->nullable();

            $table->integer('emp_name_x')->nullable();
            $table->integer('emp_name_y')->nullable();

            $table->integer('emp_pos_x')->nullable();
            $table->integer('emp_pos_y')->nullable();

            $table->integer('emp_idno_x')->nullable();
            $table->integer('emp_idno_y')->nullable();

            $table->integer('emp_sig_x')->nullable();
            $table->integer('emp_sig_y')->nullable();

            $table->integer('emp_add_x')->nullable();
            $table->integer('emp_add_y')->nullable();

            $table->integer('emp_bday_x')->nullable();
            $table->integer('emp_bday_y')->nullable();

            $table->integer('emp_sss_x')->nullable();
            $table->integer('emp_sss_y')->nullable();

            $table->integer('emp_phic_x')->nullable();
            $table->integer('emp_phic_y')->nullable();

            $table->integer('emp_hdmf_x')->nullable();
            $table->integer('emp_hdmf_y')->nullable();

            $table->integer('emp_tin_x')->nullable();
            $table->integer('emp_tin_y')->nullable();

            $table->integer('emp_emergency_name_x')->nullable();
            $table->integer('emp_emergency_name_y')->nullable();

            $table->integer('emp_emergency_num_x')->nullable();
            $table->integer('emp_emergency_num_y')->nullable();

            $table->integer('emp_emergency_add_x')->nullable();
            $table->integer('emp_emergency_add_y')->nullable();

            $table->integer('emp_qrcode_x')->nullable();
            $table->integer('emp_qrcode_y')->nullable();
            $table->integer('emp_qrcode_width')->nullable();
            $table->integer('emp_qrcode_height')->nullable();

            $table->timestamps();

            // Foreign Key Constraint - Ensure business_units table exists
            $table->foreign('businessunit_id')
                ->references('businessunit_id')
                ->on('business_units') // Ensure this table exists
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('template_images');
    }
};
