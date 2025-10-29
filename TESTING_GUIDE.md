# Testing Guide for Refactored System

## Prerequisites

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase credentials
   - Add your `DATABASE_URL` (get from Supabase Dashboard > Project Settings > Database > Connection pooling)

3. **Verify Database Connection**
   The connection string should look like:
   ```
   DATABASE_URL=postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```

## Testing Checklist

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test API Endpoints

#### Users API
```bash
# Get all users
curl http://localhost:3000/api/users

# Get users by role
curl http://localhost:3000/api/users?role=staff

# Get user by email
curl "http://localhost:3000/api/users?email=test@example.com"

# Get single user
curl http://localhost:3000/api/users/1
```

#### Menus API
```bash
# Get all menus
curl http://localhost:3000/api/menus

# Get available menus
curl http://localhost:3000/api/menus?is_available=true

# Search menus
curl "http://localhost:3000/api/menus?search=pizza"

# Get single menu
curl http://localhost:3000/api/menus/1
```

#### Ingredients API
```bash
# Get all ingredients
curl http://localhost:3000/api/ingredients

# Get available ingredients
curl http://localhost:3000/api/ingredients?is_available=true

# Get single ingredient
curl http://localhost:3000/api/ingredients/1
```

#### Orders API
```bash
# Get all orders
curl http://localhost:3000/api/orders

# Get orders by user
curl http://localhost:3000/api/orders?user_id=1

# Get orders by status
curl http://localhost:3000/api/orders?order_status=pending

# Get single order with details
curl http://localhost:3000/api/orders/1
```

#### Purchases API
```bash
# Get all purchases
curl http://localhost:3000/api/purchases

# Get non-deleted purchases
curl http://localhost:3000/api/purchases?is_deleted=false

# Get single purchase with details
curl http://localhost:3000/api/purchases/1
```

#### Notifications API
```bash
# Get all notifications
curl http://localhost:3000/api/notifications

# Get notifications for user
curl http://localhost:3000/api/notifications?user_id=1

# Get unread notifications
curl http://localhost:3000/api/notifications?user_id=1&is_read=false
```

### 3. Test Form Validations

#### Ingredient Form
1. Navigate to Ingredient Management page
2. Click "เพิ่มวัตถุดิบ"
3. Try submitting without filling in name → Should show error "กรุณากรอกชื่อวัตถุดิบ"
4. Enter name with 1 character → Should show error "ชื่อวัตถุดิบต้องมีอย่างน้อย 2 ตัวอักษร"
5. Enter valid data → Should create successfully

#### Staff Form
1. Navigate to Staff Management page
2. Click "เพิ่มพนักงาน"
3. Try submitting without email → Should show error "กรุณากรอกอีเมล"
4. Enter invalid email format → Should show error "รูปแบบอีเมลไม่ถูกต้อง"
5. Enter valid email of existing user → Should upgrade user to staff

### 4. Test CRUD Operations

#### Create Operations
- [ ] Create new menu item
- [ ] Create new ingredient
- [ ] Create new order
- [ ] Create new purchase
- [ ] Add new staff member

#### Read Operations
- [ ] View all menus
- [ ] View all ingredients
- [ ] View all orders
- [ ] View all purchases
- [ ] View all staff
- [ ] View order details
- [ ] View purchase details

#### Update Operations
- [ ] Edit menu item
- [ ] Edit ingredient
- [ ] Update order status
- [ ] Update purchase
- [ ] Edit staff information

#### Delete Operations
- [ ] Delete menu item
- [ ] Delete ingredient
- [ ] Cancel order
- [ ] Delete purchase (soft delete)
- [ ] Remove staff (change role)

### 5. Test Error Handling

#### Server-side Validation
Test by sending invalid data via API:

```bash
# Test invalid menu creation
curl -X POST http://localhost:3000/api/menus \
  -H "Content-Type: application/json" \
  -d '{"menu_name": "A", "price": -10}'
# Expected: Validation errors for name length and price

# Test invalid ingredient creation
curl -X POST http://localhost:3000/api/ingredients \
  -H "Content-Type: application/json" \
  -d '{"ingredient_name": "", "unit_of_measure": ""}'
# Expected: Validation errors for both fields
```

#### Client-side Validation
- [ ] Try submitting forms with empty required fields
- [ ] Try submitting forms with invalid formats
- [ ] Verify error labels appear below inputs
- [ ] Verify error labels clear when correcting input

### 6. Test Database Connection

#### Verify SQL Queries
Check terminal/console for SQL query logs. All queries should:
- [ ] Use parameterized queries ($1, $2, etc.)
- [ ] NOT use `SELECT *`
- [ ] Include specific column names
- [ ] Handle errors properly

#### Verify Transactions
For operations with multiple tables (orders, purchases):
- [ ] Create order with multiple menu items → Should commit all or none
- [ ] Create purchase with multiple ingredients → Should commit all or none
- [ ] Delete order → Should also delete menu_order items

### 7. Test Image Upload

#### Profile Images (Staff)
- [ ] Upload profile image when editing staff
- [ ] Verify image appears after save
- [ ] Verify image URL is stored in database

#### Menu Images
- [ ] Upload menu image when creating/editing menu
- [ ] Verify image appears in menu list
- [ ] Verify image URL is stored in database

### 8. Test Real-time Features

#### Notifications
- [ ] Create order → Should create notification
- [ ] Check notification count updates
- [ ] Mark notification as read
- [ ] Verify real-time updates work

### 9. Performance Testing

- [ ] Load pages with large datasets
- [ ] Verify connection pooling works (check pool status)
- [ ] Check for N+1 query problems
- [ ] Verify proper index usage

### 10. Common Issues & Solutions

#### Issue: "Missing Supabase environment variables"
**Solution**: Ensure `.env.local` has:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`

#### Issue: "Connection timeout" or "ETIMEDOUT"
**Solution**: 
- Check `DATABASE_URL` is correct
- Verify you're using Session Mode pooler (port 6543)
- Check firewall/network settings

#### Issue: "relation does not exist"
**Solution**: 
- Verify database tables are created
- Check table names match (case-sensitive)
- Ensure migrations are run

#### Issue: "Invalid input syntax for type"
**Solution**:
- Check data types match database schema
- Verify date/time formats
- Check numeric values are not strings

#### Issue: "Validation errors not showing"
**Solution**:
- Check browser console for errors
- Verify ErrorLabel component is imported
- Check error state is being set correctly

## Success Criteria

✅ All API endpoints return expected data
✅ All form validations work (client & server)
✅ All CRUD operations complete successfully
✅ No SQL injection vulnerabilities
✅ Images upload correctly to Supabase Storage
✅ Error handling works as expected
✅ Real-time notifications work
✅ No compilation or runtime errors

## Rollback Plan

If issues occur, you can temporarily rollback by:
1. Revert hooks to use Supabase ORM
2. Comment out new API routes
3. Use original form components

Keep the old code in git history for reference.
