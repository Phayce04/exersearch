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
        Schema::create('chat_histories', function (Blueprint $table) {
            $table->id();
            
            // Make foreign key nullable and don't add constraint yet
            $table->unsignedBigInteger('user_id')->nullable();
            
            $table->string('ip_address')->nullable();
            $table->enum('role', ['user', 'assistant']);
            $table->text('content');
            $table->timestamps();

            // Indexes for performance
            $table->index('user_id');
            $table->index('ip_address');
            $table->index('created_at');
        });

        // Add foreign key constraint separately (only if users table exists with id column)
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'id')) {
            Schema::table('chat_histories', function (Blueprint $table) {
                $table->foreign('user_id')
                      ->references('id')
                      ->on('users')
                      ->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_histories');
    }
};