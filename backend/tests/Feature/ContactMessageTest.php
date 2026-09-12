<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The public "contact us" form (homepage) and the administrator's view of
 * what it collects.
 */
class ContactMessageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    private function admin(): User
    {
        $user = User::factory()->create();
        $user->assignRole('Administrator');

        return $user;
    }

    public function test_a_visitor_with_no_account_can_submit_the_contact_form(): void
    {
        $response = $this->postJson('/api/contact', [
            'name' => 'Yassin',
            'email' => 'yassin@example.com',
            'message' => 'Je voudrais en savoir plus sur les centres partenaires.',
        ])->assertCreated();

        $this->assertDatabaseHas('contact_messages', [
            'id' => $response->json('id'),
            'name' => 'Yassin',
            'email' => 'yassin@example.com',
            'status' => 'new',
        ]);
    }

    public function test_the_form_rejects_a_missing_email(): void
    {
        $this->postJson('/api/contact', [
            'name' => 'Yassin',
            'message' => 'Sans adresse email.',
        ])->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_a_non_administrator_cannot_read_submissions(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/admin/contact-messages')
            ->assertForbidden();
    }

    public function test_an_administrator_sees_submissions_and_can_mark_one_read(): void
    {
        $admin = $this->admin();

        $submitted = $this->postJson('/api/contact', [
            'name' => 'Amine',
            'email' => 'amine@example.com',
            'message' => 'Comment devenir centre partenaire ?',
        ])->assertCreated()->json();

        $list = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/contact-messages')
            ->assertOk()->json();

        $this->assertSame('Amine', $list['data'][0]['name']);
        $this->assertSame('new', $list['data'][0]['status']);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/contact-messages/{$submitted['id']}", ['status' => 'read'])
            ->assertOk()
            ->assertJsonPath('status', 'read');
    }
}
