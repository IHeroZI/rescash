# Supabase Storage Setup

## สร้าง Storage Bucket สำหรับรูปโปรไฟล์

1. ไปที่ Supabase Dashboard > Storage
2. สร้าง bucket ใหม่ชื่อ `profile-images`
3. ตั้งค่าให้เป็น **Public** bucket
4. ตั้งค่า MIME types ที่อนุญาต: `image/*`

## RLS Policies

ไปที่ Storage > Policies และเพิ่ม policies:

### Allow public read access
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'profile-images' );
```

### Allow authenticated users to upload
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'profile-images' );
```

### Allow users to update their own files
```sql
CREATE POLICY "Allow users to update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'profile-images' )
WITH CHECK ( bucket_id = 'profile-images' );
```

### Allow users to delete their own files
```sql
CREATE POLICY "Allow users to delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'profile-images' );
```
