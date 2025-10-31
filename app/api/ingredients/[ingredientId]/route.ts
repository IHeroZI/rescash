import { NextRequest, NextResponse } from 'next/server';
import { queryDbSingle } from '@/lib/db/connection';
import { validateIngredient } from '@/lib/validation/validationSchemas';

interface IngredientRow {
  ingredient_id: number;
  ingredient_name: string;
  unit_of_measure: string;
  is_available: boolean;
  create_datetime: string;
  update_datetime: string;
}

interface RouteParams {
  params: Promise<{
    ingredientId: string;
  }>;
}

// GET /api/ingredients/[ingredientId] - Get a single ingredient by ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { ingredientId } = await params;
    const ingredientIdNum = parseInt(ingredientId);

    if (isNaN(ingredientIdNum)) {
      return NextResponse.json(
        {
          success: false,
          error: 'รหัสวัตถุดิบไม่ถูกต้อง'
        },
        { status: 400 }
      );
    }

    const ingredient = await queryDbSingle<IngredientRow>(
      `SELECT 
        ingredient_id, 
        ingredient_name, 
        unit_of_measure, 
        is_available, 
        create_datetime, 
        update_datetime
       FROM ingredient
       WHERE ingredient_id = $1`,
      [ingredientIdNum]
    );

    if (!ingredient) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบวัตถุดิบ'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: ingredient
    });
  } catch (error) {
    console.error('Error fetching ingredient:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลวัตถุดิบ'
      },
      { status: 500 }
    );
  }
}

// PUT /api/ingredients/[ingredientId] - Update an ingredient
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { ingredientId } = await params;
    const ingredientIdNum = parseInt(ingredientId);

    if (isNaN(ingredientIdNum)) {
      return NextResponse.json(
        {
          success: false,
          error: 'รหัสวัตถุดิบไม่ถูกต้อง'
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { ingredient_name, unit_of_measure, is_available } = body;

    // Validate input
    const validation = validateIngredient({ ingredient_name, unit_of_measure }, true);
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

    // Check if ingredient exists
    const existingIngredient = await queryDbSingle<IngredientRow>(
      'SELECT ingredient_id FROM ingredient WHERE ingredient_id = $1',
      [ingredientIdNum]
    );

    if (!existingIngredient) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบวัตถุดิบ'
        },
        { status: 404 }
      );
    }

    // Check if ingredient name already exists (excluding current ingredient)
    if (ingredient_name !== undefined) {
      const duplicateIngredient = await queryDbSingle<IngredientRow>(
        'SELECT ingredient_id FROM ingredient WHERE LOWER(ingredient_name) = LOWER($1) AND ingredient_id != $2',
        [ingredient_name.trim(), ingredientIdNum]
      );

      if (duplicateIngredient) {
        return NextResponse.json(
          {
            success: false,
            error: 'ชื่อวัตถุดิบนี้มีอยู่แล้ว',
            errors: [{ field: 'ingredient_name', message: 'ชื่อวัตถุดิบนี้มีอยู่แล้ว' }]
          },
          { status: 400 }
        );
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values: any[] = [];
    let paramIndex = 1;

    if (ingredient_name !== undefined) {
      updates.push(`ingredient_name = $${paramIndex}`);
      values.push(ingredient_name.trim());
      paramIndex++;
    }

    if (unit_of_measure !== undefined) {
      updates.push(`unit_of_measure = $${paramIndex}`);
      values.push(unit_of_measure.trim());
      paramIndex++;
    }

    if (is_available !== undefined) {
      updates.push(`is_available = $${paramIndex}`);
      values.push(is_available);
      paramIndex++;
    }

    updates.push(`update_datetime = NOW()`);
    values.push(ingredientIdNum);

    const query = `
      UPDATE ingredient
      SET ${updates.join(', ')}
      WHERE ingredient_id = $${paramIndex}
      RETURNING ingredient_id, ingredient_name, unit_of_measure, is_available, create_datetime, update_datetime
    `;

    const updatedIngredient = await queryDbSingle<IngredientRow>(query, values);

    return NextResponse.json({
      success: true,
      data: updatedIngredient,
      message: 'อัปเดตวัตถุดิบสำเร็จ'
    });
  } catch (error) {
    console.error('Error updating ingredient:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการอัปเดตวัตถุดิบ'
      },
      { status: 500 }
    );
  }
}
