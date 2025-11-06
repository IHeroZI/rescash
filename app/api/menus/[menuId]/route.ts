import { NextRequest, NextResponse } from 'next/server';
import { queryDb, queryDbSingle, getDbPool } from '@/lib/db/connection';
import { validateMenu } from '@/lib/validation/validationSchemas';

interface MenuRow {
  menu_id: number;
  menu_name: string;
  description: string | null;
  price: number;
  recipe: string | null;
  is_available: boolean;
  menu_image_url: string | null;
  create_datetime: string;
  update_datetime: string;
}

interface RouteParams {
  params: Promise<{
    menuId: string;
  }>;
}

// GET /api/menus/[menuId] - Get a single menu by ID with ingredients
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { menuId } = await params;
    const menuIdNum = parseInt(menuId);

    if (isNaN(menuIdNum)) {
      return NextResponse.json(
        {
          success: false,
          error: 'รหัสเมนูไม่ถูกต้อง'
        },
        { status: 400 }
      );
    }

    const menu = await queryDbSingle<MenuRow>(
      `SELECT 
        menu_id, 
        menu_name, 
        description, 
        price, 
        recipe, 
        is_available, 
        menu_image_url, 
        create_datetime, 
        update_datetime
       FROM menu
       WHERE menu_id = $1`,
      [menuIdNum]
    );

    if (!menu) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบเมนู'
        },
        { status: 404 }
      );
    }

    // Fetch menu ingredients
    const ingredients = await queryDb(
      `SELECT 
        mi.ingredient_id,
        mi.quantity_required,
        i.ingredient_name,
        i.unit_of_measure
      FROM "menuIngredient" mi
      JOIN ingredient i ON mi.ingredient_id = i.ingredient_id
      WHERE mi.menu_id = $1
      ORDER BY i.ingredient_name`,
      [menuIdNum]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...menu,
        ingredients
      }
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลเมนู'
      },
      { status: 500 }
    );
  }
}

// PUT /api/menus/[menuId] - Update a menu with ingredients
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const pool = getDbPool();
  const client = await pool.connect();

  try {
    const { menuId } = await params;
    const menuIdNum = parseInt(menuId);

    if (isNaN(menuIdNum)) {
      return NextResponse.json(
        {
          success: false,
          error: 'รหัสเมนูไม่ถูกต้อง'
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { menu_name, description, price, recipe, is_available, menu_image_url, ingredients } = body;

    // Validate input
    const validation = validateMenu({ menu_name, description, price, recipe }, true);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'ข้อมูลไม่ถูกต้อง',
          errors: validation.errors
        },
        { status: 400 }
      );
    }

    // Check if menu exists
    const existingMenu = await queryDbSingle<MenuRow>(
      'SELECT menu_id FROM menu WHERE menu_id = $1',
      [menuIdNum]
    );

    if (!existingMenu) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบเมนู'
        },
        { status: 404 }
      );
    }

    // Start transaction
    await client.query('BEGIN');

    // Build update query dynamically
    const updates: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    let paramIndex = 1;

    if (menu_name !== undefined) {
      updates.push(`menu_name = $${paramIndex}`);
      values.push(menu_name.trim());
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(description?.trim() || null);
      paramIndex++;
    }

    if (price !== undefined) {
      updates.push(`price = $${paramIndex}`);
      values.push(price);
      paramIndex++;
    }

    if (recipe !== undefined) {
      updates.push(`recipe = $${paramIndex}`);
      values.push(recipe?.trim() || null);
      paramIndex++;
    }

    if (is_available !== undefined) {
      updates.push(`is_available = $${paramIndex}`);
      values.push(is_available);
      paramIndex++;
    }

    if (menu_image_url !== undefined) {
      updates.push(`menu_image_url = $${paramIndex}`);
      values.push(menu_image_url);
      paramIndex++;
    }

    updates.push(`update_datetime = NOW()`);
    values.push(menuIdNum);

    const query = `
      UPDATE menu
      SET ${updates.join(', ')}
      WHERE menu_id = $${paramIndex}
      RETURNING menu_id, menu_name, description, price, recipe, is_available, menu_image_url, create_datetime, update_datetime
    `;

    const result = await client.query<MenuRow>(query, values);
    const updatedMenu = result.rows[0];

    // Update ingredients if provided
    if (ingredients !== undefined && Array.isArray(ingredients)) {
      // Delete old menu ingredients
      await client.query(
        'DELETE FROM "menuIngredient" WHERE menu_id = $1',
        [menuIdNum]
      );

      // Insert new menu ingredients
      if (ingredients.length > 0) {
        const ingValues: (number | string)[] = [];
        const placeholders: string[] = [];
        let ingParamIndex = 1;

        ingredients.forEach((ing: { ingredient_id: number; quantity_required: number }) => {
          placeholders.push(`($${ingParamIndex}, $${ingParamIndex + 1}, $${ingParamIndex + 2})`);
          ingValues.push(menuIdNum, ing.ingredient_id, ing.quantity_required);
          ingParamIndex += 3;
        });

        const insertQuery = `
          INSERT INTO "menuIngredient" (menu_id, ingredient_id, quantity_required)
          VALUES ${placeholders.join(', ')}
        `;

        await client.query(insertQuery, ingValues);
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      data: updatedMenu,
      message: 'อัปเดตเมนูสำเร็จ'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating menu:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการอัปเดตเมนู'
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
