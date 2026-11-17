-- Luvai Africa marketplace. Existing app tables and records are unchanged.
create table public.luvai_artisans (
 id uuid primary key references auth.users(id) on delete cascade,
 slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,70}$'),
 shop_name text not null check (char_length(trim(shop_name)) between 2 and 70),
 maker_name text not null check (char_length(trim(maker_name)) between 2 and 80),
 location text not null check (char_length(trim(location)) between 2 and 100),
 bio text not null check (char_length(trim(bio)) between 20 and 600),
 phone text not null check (phone ~ '^[1-9][0-9]{7,14}$'),
 created_at timestamptz not null default now()
);
-- All profile fields are intentionally public. Email remains in Supabase Auth.
alter table public.luvai_artisans enable row level security;
create policy "Luvai shops are public" on public.luvai_artisans for select to anon, authenticated using (true);
create policy "Luvai makers create own shop" on public.luvai_artisans for insert to authenticated with check ((select auth.uid()) = id);
create policy "Luvai makers edit own shop" on public.luvai_artisans for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
grant select on public.luvai_artisans to anon, authenticated;
grant insert,update on public.luvai_artisans to authenticated;

create function public.luvai_valid_photo_paths(paths text[], maker uuid, piece uuid) returns boolean
language sql immutable set search_path = '' as $$
 select cardinality(paths) between 1 and 6 and not exists (
 select 1 from unnest(paths) p where p is null or p !~ ('^' || maker::text || '/' || piece::text || '/[a-f0-9-]{36}\.webp$')
 )
$$;

create table public.luvai_products (
 id uuid primary key default gen_random_uuid(),
 artisan_id uuid not null references public.luvai_artisans(id) on delete cascade,
 title text not null check (char_length(trim(title)) between 3 and 100),
 description text not null check (char_length(trim(description)) between 20 and 600),
 category text not null check (category in ('Basketry','Ceramics','Jewellery','Woodwork','Textiles','Paintings','Sculpture','Other')),
 price_minor bigint not null check (price_minor > 0 and price_minor <= 10000000000),
 currency text not null default 'KES' check (currency in ('KES','USD')),
 materials text not null default '' check (char_length(materials) <= 120),
 dimensions text not null default '' check (char_length(dimensions) <= 120),
 images text[] not null,
 status text not null default 'draft' check (status in ('draft','published','sold','archived')),
 made_to_order boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint luvai_owned_photos check (public.luvai_valid_photo_paths(images,artisan_id,id))
);
alter table public.luvai_products enable row level security;
create index luvai_products_market on public.luvai_products (status,created_at desc,id);
create index luvai_products_category on public.luvai_products (status,category,created_at desc,id);
create index luvai_products_price on public.luvai_products (status,currency,price_minor,id);
create index luvai_products_artisan on public.luvai_products (artisan_id,created_at desc,id);
create policy "Luvai published pieces and own drafts" on public.luvai_products for select to anon, authenticated using (status in ('published','sold') or (select auth.uid()) = artisan_id);
create policy "Luvai makers insert own pieces" on public.luvai_products for insert to authenticated with check ((select auth.uid()) = artisan_id);
create policy "Luvai makers edit own pieces" on public.luvai_products for update to authenticated using ((select auth.uid()) = artisan_id) with check ((select auth.uid()) = artisan_id);
grant select on public.luvai_products to anon, authenticated;
grant insert,update on public.luvai_products to authenticated;

create table public.luvai_reports (
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references public.luvai_products(id) on delete cascade,
 reporter_id uuid not null references auth.users(id) on delete cascade,
 reason text not null check (char_length(trim(reason)) between 10 and 1000),
 created_at timestamptz not null default now(),
 unique (product_id,reporter_id)
);
alter table public.luvai_reports enable row level security;
create index luvai_reports_reporter on public.luvai_reports (reporter_id);
create policy "Luvai buyers report a piece" on public.luvai_reports for insert to authenticated with check ((select auth.uid()) = reporter_id and exists (select 1 from public.luvai_products p where p.id = product_id and p.status in ('published','sold')));
create policy "Luvai buyers see own reports" on public.luvai_reports for select to authenticated using ((select auth.uid()) = reporter_id);
grant insert,select on public.luvai_reports to authenticated;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('luvai-products','luvai-products',true,4194304,array['image/webp']);
create policy "Luvai makers upload own photos" on storage.objects for insert to authenticated with check (
 bucket_id = 'luvai-products' and (storage.foldername(name))[1] = (select auth.uid())::text
 and name ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}/[a-f0-9-]{36}\.webp$'
 and exists (select 1 from public.luvai_artisans a where a.id = (select auth.uid()))
);
create policy "Luvai makers inspect own uploads" on storage.objects for select to authenticated using (bucket_id='luvai-products' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Luvai makers remove own uploads" on storage.objects for delete to authenticated using (bucket_id='luvai-products' and (storage.foldername(name))[1]=(select auth.uid())::text);
