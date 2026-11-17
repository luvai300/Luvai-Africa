
begin;
insert into auth.users (id,instance_id,aud,role,email,encrypted_password,created_at,updated_at)
values ('10000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','luvai-rls-one@example.invalid','',now(),now()),
('10000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','luvai-rls-two@example.invalid','',now(),now());
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
insert into public.luvai_artisans(id,slug,shop_name,maker_name,location,bio,phone)
values ('10000000-0000-4000-8000-000000000001','rls-test-one','Test One','Test Maker','Nairobi, Kenya','Temporary integration test profile only.','254700000001');
insert into public.luvai_products(id,artisan_id,title,description,category,price_minor,images,status)
values ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Public test piece','Temporary integration test description.','Basketry',500000,array['10000000-0000-4000-8000-000000000001/20000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000001.webp'],'published'),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Private test piece','Temporary integration test description.','Basketry',500000,array['10000000-0000-4000-8000-000000000001/20000000-0000-4000-8000-000000000002/30000000-0000-4000-8000-000000000002.webp'],'draft');
do $$ begin
 if (select count(*) from public.luvai_products where artisan_id='10000000-0000-4000-8000-000000000001') <> 2 then raise exception 'Owner cannot see own draft'; end if;
end $$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
insert into public.luvai_artisans(id,slug,shop_name,maker_name,location,bio,phone)
values ('10000000-0000-4000-8000-000000000002','rls-test-two','Test Two','Second Maker','Nairobi, Kenya','Temporary integration test profile only.','254700000002');
do $$ declare n integer; begin
 if (select count(*) from public.luvai_products where artisan_id='10000000-0000-4000-8000-000000000001') <> 1 then raise exception 'Draft leaked to another seller'; end if;
 update public.luvai_products set title='Unauthorized change' where id='20000000-0000-4000-8000-000000000001';
 get diagnostics n = row_count;
 if n <> 0 then raise exception 'Another maker edited the product'; end if;
 begin
 insert into public.luvai_products(id,artisan_id,title,description,category,price_minor,images,status)
 values ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','Forbidden piece','Temporary integration test description.','Basketry',100,array['10000000-0000-4000-8000-000000000001/20000000-0000-4000-8000-000000000003/30000000-0000-4000-8000-000000000003.webp'],'published');
 raise exception 'Foreign insert was accepted';
 exception when insufficient_privilege then null;
 end;
 begin
 insert into storage.objects(bucket_id,name) values ('luvai-products','10000000-0000-4000-8000-000000000001/20000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000003.webp');
 raise exception 'Foreign photo upload was accepted';
 exception when insufficient_privilege then null;
 end;
end $$;
insert into public.luvai_reports(product_id,reporter_id,reason)
values('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','Temporary integration test report only.');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
do $$ begin
 if exists(select 1 from public.luvai_reports where product_id='20000000-0000-4000-8000-000000000001') then raise exception 'Private report leaked'; end if;
 begin
 update public.luvai_products set artisan_id='10000000-0000-4000-8000-000000000002',images=array['10000000-0000-4000-8000-000000000002/20000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000001.webp'] where id='20000000-0000-4000-8000-000000000001';
 raise exception 'Ownership transfer accepted';
 exception when insufficient_privilege then null;
 end;
end $$;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$ begin
 if (select count(*) from public.luvai_products where id in ('20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002')) <> 1 then raise exception 'Anonymous visibility failed'; end if;
end $$;
rollback;
select 'PASS: own drafts visible; anonymous drafts hidden; cross-seller writes and photo uploads blocked; ownership transfer blocked; reports private; fixtures rolled back' as verification;

