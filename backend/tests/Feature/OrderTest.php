<?php

use App\Models\User;
use App\Models\Shop;
use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;

beforeEach(function () {
    $this->seed();
    $this->vendor = User::factory()->vendor()->create();
    $this->customer = User::factory()->customer()->create();
    $this->shop = Shop::factory()->create(['owner_id' => $this->vendor->id]);
    $this->product = Product::factory()->create(['shop_id' => $this->shop->id, 'price' => 100.00]);
    $this->order = Order::factory()->create([
        'user_id' => $this->customer->id,
        'shop_id' => $this->shop->id,
    ]);
});

describe('Order API', function () {
    it('allows customers to create orders', function () {
        $orderData = [
            'shop_id' => $this->shop->id,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 2,
                    'price' => 100.00
                ]
            ],
            'delivery_type' => 'delivery',
            'delivery_address' => '123 Customer Street, Nairobi',
            'notes' => 'Please call when you arrive'
        ];

        $response = $this->actingAs($this->customer)
            ->postJson('/api/v1/orders', $orderData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'total',
                    'status',
                    'delivery_type',
                    'delivery_address',
                    'notes',
                    'shop' => [
                        'id',
                        'name',
                    ],
                    'items' => [
                        '*' => [
                            'id',
                            'quantity',
                            'price',
                            'product' => [
                                'id',
                                'name',
                            ]
                        ]
                    ]
                ]
            ]);

        $this->assertDatabaseHas('orders', [
            'user_id' => $this->customer->id,
            'shop_id' => $this->shop->id,
            'total' => 200.00, // 2 * 100.00
            'delivery_type' => 'delivery',
        ]);

        $this->assertDatabaseHas('order_items', [
            'product_id' => $this->product->id,
            'quantity' => 2,
            'price' => 100.00,
        ]);
    });

    it('calculates order total correctly', function () {
        $product2 = Product::factory()->create(['shop_id' => $this->shop->id, 'price' => 50.00]);

        $orderData = [
            'shop_id' => $this->shop->id,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 2,
                    'price' => 100.00
                ],
                [
                    'product_id' => $product2->id,
                    'quantity' => 3,
                    'price' => 50.00
                ]
            ],
            'delivery_type' => 'pickup',
        ];

        $response = $this->actingAs($this->customer)
            ->postJson('/api/v1/orders', $orderData);

        $response->assertStatus(201);

        $order = Order::latest()->first();
        expect($order->total)->toBe(350.00); // (2 * 100) + (3 * 50)
    });

    it('lists customer orders', function () {
        Order::factory()->count(3)->create(['user_id' => $this->customer->id]);

        $response = $this->actingAs($this->customer)
            ->getJson('/api/v1/orders');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'total',
                        'status',
                        'delivery_type',
                        'shop' => [
                            'id',
                            'name',
                        ],
                        'items' => [
                            '*' => [
                                'id',
                                'quantity',
                                'price',
                                'product' => [
                                    'id',
                                    'name',
                                ]
                            ]
                        ]
                    ]
                ],
                'links',
                'meta'
            ]);
    });

    it('shows specific order details', function () {
        OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'product_id' => $this->product->id,
        ]);

        $response = $this->actingAs($this->customer)
            ->getJson("/api/v1/orders/{$this->order->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'total',
                    'status',
                    'delivery_type',
                    'delivery_address',
                    'notes',
                    'shop' => [
                        'id',
                        'name',
                        'owner' => [
                            'id',
                            'name',
                        ]
                    ],
                    'items' => [
                        '*' => [
                            'id',
                            'quantity',
                            'price',
                            'product' => [
                                'id',
                                'name',
                                'description',
                                'images',
                            ]
                        ]
                    ]
                ]
            ]);
    });

    it('allows customers to update their pending orders', function () {
        $updateData = [
            'delivery_address' => 'Updated Address',
            'notes' => 'Updated notes',
        ];

        $response = $this->actingAs($this->customer)
            ->putJson("/api/v1/orders/{$this->order->id}", $updateData);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'delivery_address' => 'Updated Address',
                'notes' => 'Updated notes',
            ]);

        $this->assertDatabaseHas('orders', [
            'id' => $this->order->id,
            'delivery_address' => 'Updated Address',
        ]);
    });

    it('prevents updating non-pending orders', function () {
        $this->order->update(['status' => 'confirmed']);

        $updateData = [
            'delivery_address' => 'Should not update',
        ];

        $response = $this->actingAs($this->customer)
            ->putJson("/api/v1/orders/{$this->order->id}", $updateData);

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Only pending orders can be updated.'
            ]);
    });

    it('allows customers to cancel their pending orders', function () {
        $response = $this->actingAs($this->customer)
            ->deleteJson("/api/v1/orders/{$this->order->id}");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Order cancelled successfully.'
            ]);

        $this->assertDatabaseHas('orders', [
            'id' => $this->order->id,
            'status' => 'cancelled',
        ]);
    });

    it('prevents cancelling non-pending orders', function () {
        $this->order->update(['status' => 'shipped']);

        $response = $this->actingAs($this->customer)
            ->deleteJson("/api/v1/orders/{$this->order->id}");

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Only pending orders can be cancelled.'
            ]);
    });

    it('allows shop owners to view their shop orders', function () {
        Order::factory()->count(3)->create(['shop_id' => $this->shop->id]);

        $response = $this->actingAs($this->vendor)
            ->getJson("/api/v1/shops/{$this->shop->id}/orders");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'total',
                        'status',
                        'delivery_type',
                        'user' => [
                            'id',
                            'name',
                        ],
                        'items' => [
                            '*' => [
                                'id',
                                'quantity',
                                'price',
                                'product' => [
                                    'id',
                                    'name',
                                ]
                            ]
                        ]
                    ]
                ]
            ]);
    });

    it('allows shop owners to update order status', function () {
        $response = $this->actingAs($this->vendor)
            ->putJson("/api/v1/orders/{$this->order->id}/status", [
                'status' => 'confirmed'
            ]);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'status' => 'confirmed'
            ]);

        $this->assertDatabaseHas('orders', [
            'id' => $this->order->id,
            'status' => 'confirmed',
        ]);
    });

    it('prevents non-shop-owners from updating order status', function () {
        $otherVendor = User::factory()->vendor()->create();

        $response = $this->actingAs($otherVendor)
            ->putJson("/api/v1/orders/{$this->order->id}/status", [
                'status' => 'confirmed'
            ]);

        $response->assertStatus(403);
    });

    it('prevents customers from accessing other customers orders', function () {
        $otherCustomer = User::factory()->customer()->create();

        $response = $this->actingAs($otherCustomer)
            ->getJson("/api/v1/orders/{$this->order->id}");

        $response->assertStatus(403);
    });

    it('requires authentication for order operations', function () {
        // List orders
        $this->getJson('/api/v1/orders')
            ->assertStatus(401);

        // Show order
        $this->getJson("/api/v1/orders/{$this->order->id}")
            ->assertStatus(401);

        // Create order
        $this->postJson('/api/v1/orders', [])
            ->assertStatus(401);

        // Update order
        $this->putJson("/api/v1/orders/{$this->order->id}", [])
            ->assertStatus(401);

        // Cancel order
        $this->deleteJson("/api/v1/orders/{$this->order->id}")
            ->assertStatus(401);
    });

    it('validates required fields when creating order', function () {
        $response = $this->actingAs($this->customer)
            ->postJson('/api/v1/orders', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['shop_id', 'items', 'delivery_type']);
    });

    it('validates order items structure', function () {
        $orderData = [
            'shop_id' => $this->shop->id,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    // Missing quantity and price
                ]
            ],
            'delivery_type' => 'pickup',
        ];

        $response = $this->actingAs($this->customer)
            ->postJson('/api/v1/orders', $orderData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items.0.quantity', 'items.0.price']);
    });

    it('validates that products belong to the specified shop', function () {
        $otherShop = Shop::factory()->create();
        $otherProduct = Product::factory()->create(['shop_id' => $otherShop->id]);

        $orderData = [
            'shop_id' => $this->shop->id,
            'items' => [
                [
                    'product_id' => $otherProduct->id,
                    'quantity' => 1,
                    'price' => 100.00
                ]
            ],
            'delivery_type' => 'pickup',
        ];

        $response = $this->actingAs($this->customer)
            ->postJson('/api/v1/orders', $orderData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items.0.product_id']);
    });

    it('validates order status transitions', function () {
        $response = $this->actingAs($this->vendor)
            ->putJson("/api/v1/orders/{$this->order->id}/status", [
                'status' => 'invalid_status'
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    });

    it('filters orders by status', function () {
        Order::factory()->create(['user_id' => $this->customer->id, 'status' => 'pending']);
        Order::factory()->create(['user_id' => $this->customer->id, 'status' => 'confirmed']);
        Order::factory()->create(['user_id' => $this->customer->id, 'status' => 'delivered']);

        $response = $this->actingAs($this->customer)
            ->getJson('/api/v1/orders?status=pending');

        $response->assertStatus(200);
        
        $orders = $response->json('data');
        foreach ($orders as $order) {
            expect($order['status'])->toBe('pending');
        }
    });

    it('paginates orders list', function () {
        Order::factory()->count(25)->create(['user_id' => $this->customer->id]);

        $response = $this->actingAs($this->customer)
            ->getJson('/api/v1/orders');

        $response->assertStatus(200);
        
        $data = $response->json();
        expect($data['data'])->toHaveCount(15); // Default pagination
        expect($data['links'])->toHaveKey('next');
    });
});
