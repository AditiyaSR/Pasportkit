-- PassportKit product image storage setup
-- Safe to run multiple times in Supabase SQL Editor.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read product images" on storage.objects;
create policy "Public can read product images"
on storage.objects
for select
using (bucket_id = 'product-images');

drop policy if exists "Anyone can upload product images" on storage.objects;
create policy "Anyone can upload product images"
on storage.objects
for insert
with check (bucket_id = 'product-images');

drop policy if exists "Users can update their product images" on storage.objects;
create policy "Users can update their product images"
on storage.objects
for update
using (bucket_id = 'product-images')
with check (bucket_id = 'product-images');
