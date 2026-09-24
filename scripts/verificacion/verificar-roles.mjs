import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const REPO = 'C:/Users/Techalth Labs/the-remainder/repo';
const M1 = readFileSync(`${REPO}/supabase/migrations/20260828120000_add_superadmin_role.sql`, 'utf8');
const M2 = readFileSync(`${REPO}/supabase/migrations/20260828120100_granular_permissions.sql`, 'utf8');

const db = new PGlite();

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${extra}`); }
};

const asUser = async (uid) => db.query(`select set_config('test.uid', $1, false)`, [uid ?? '']);
const one = async (sql, params) => (await db.query(sql, params)).rows[0];
const raises = async (sql, params) => {
  try { await db.query(sql, params); return null; }
  catch (e) { return e.message; }
};

// ── Prerrequisitos: el trozo del esquema real del que dependen las migraciones ──
await db.exec(`
  -- Roles que Supabase crea en todo proyecto; aqui hay que fabricarlos.
  create role anon;
  create role authenticated;
  create role service_role;

  create schema if not exists auth;
  create or replace function auth.uid() returns uuid language sql stable as $fn$
    select nullif(current_setting('test.uid', true), '')::uuid
  $fn$;

  create type public.app_role as enum ('admin', 'user', 'moderator');

  create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    role public.app_role not null,
    created_at timestamptz not null default now(),
    unique (user_id, role)
  );
  alter table public.user_roles enable row level security;

  create or replace function public.has_role(_user_id uuid, _role public.app_role)
  returns boolean language sql stable security definer set search_path = public as $fn$
    select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
  $fn$;

  create policy "Users can view own roles" on public.user_roles
    for select using (user_id = auth.uid());
  create policy "Admins can manage all roles" on public.user_roles
    for all using (public.has_role(auth.uid(), 'admin'));

  create table public.profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    email text,
    full_name text,
    created_at timestamptz not null default now()
  );

  create table public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    actor_id uuid,
    actor_role text not null default 'system',
    action text not null,
    entity_type text not null,
    entity_id uuid,
    old_data jsonb,
    new_data jsonb,
    metadata jsonb default '{}'::jsonb,
    ip_address text,
    created_at timestamptz not null default now(),
    checksum text not null default ''
  );
`);

// Datos de partida: el fundador (admin antiguo), un segundo admin, y un cliente.
const FOUNDER = '11111111-1111-1111-1111-111111111111';
const SECOND  = '22222222-2222-2222-2222-222222222222';
const MOD     = '33333333-3333-3333-3333-333333333333';
const CLIENT  = '44444444-4444-4444-4444-444444444444';

await db.exec(`
  insert into public.profiles (user_id, email, full_name) values
    ('${FOUNDER}', 'founder@theremainder.pl', 'Guillermo'),
    ('${SECOND}',  'segundo@theremainder.pl', 'Segundo Admin'),
    ('${MOD}',     'mod@theremainder.pl',     'Moderadora'),
    ('${CLIENT}',  'cliente@ejemplo.com',     'Cliente');

  insert into public.user_roles (user_id, role, created_at) values
    ('${FOUNDER}', 'admin', now() - interval '200 days'),
    ('${SECOND}',  'admin', now() - interval '10 days'),
    ('${MOD}',     'moderator', now() - interval '5 days'),
    ('${CLIENT}',  'user', now());
`);

console.log('\n=== Aplicando migraciones ===');
try {
  await db.exec(M1);
  console.log('  OK  20260828120000_add_superadmin_role.sql');
} catch (e) { console.log('  ERROR migracion 1:', e.message); process.exit(1); }

try {
  await db.exec(M2);
  console.log('  OK  20260828120100_granular_permissions.sql');
} catch (e) { console.log('  ERROR migracion 2:', e.message); process.exit(1); }

console.log('\n=== Semillas de permisos ===');
const counts = (await db.query(`
  select role::text, count(*)::int as n from public.role_permissions group by role order by role::text
`)).rows;
console.log('  ', JSON.stringify(counts));
const totalPerms = (await one(`select count(*)::int as n from unnest(enum_range(null::public.app_permission))`)).n;
const byRole = Object.fromEntries(counts.map(r => [r.role, r.n]));
ok('superadmin tiene TODOS los permisos', byRole.superadmin === totalPerms, `(${byRole.superadmin}/${totalPerms})`);
ok('admin tiene todos menos roles.manage', byRole.admin === totalPerms - 1, `(${byRole.admin})`);
ok('moderator tiene 6 permisos acotados', byRole.moderator === 6, `(${byRole.moderator})`);
ok('user no recibe permisos de panel', !byRole.user);

console.log('\n=== Bootstrap del superadmin ===');
const boot = (await db.query(`select user_id from public.user_roles where role = 'superadmin'`)).rows;
ok('se promociona exactamente a una persona', boot.length === 1, `(${boot.length})`);
ok('es el admin mas antiguo (el fundador)', boot[0]?.user_id === FOUNDER);

console.log('\n=== Jerarquia de has_role ===');
const hr = async (uid, role) => (await one(`select public.has_role($1,$2) as r`, [uid, role])).r;
ok('superadmin satisface admin', await hr(FOUNDER, 'admin'));
ok('superadmin satisface moderator', await hr(FOUNDER, 'moderator'));
ok('admin satisface moderator', await hr(SECOND, 'moderator'));
ok('admin NO satisface superadmin', !(await hr(SECOND, 'superadmin')));
ok('moderator NO satisface admin', !(await hr(MOD, 'admin')));
ok('cliente NO satisface moderator', !(await hr(CLIENT, 'moderator')));
ok("has_role(...,'user') es exacto: el admin no cuenta como user", !(await hr(SECOND, 'user')));
ok("has_role(...,'user') es true para el cliente", await hr(CLIENT, 'user'));

console.log('\n=== has_permission ===');
const hp = async (uid, perm) => (await one(`select public.has_permission($1,$2) as r`, [uid, perm])).r;
ok('admin puede gestionar pedidos', await hp(SECOND, 'orders.manage'));
ok('admin NO puede repartir roles', !(await hp(SECOND, 'roles.manage')));
ok('superadmin SI puede repartir roles', await hp(FOUNDER, 'roles.manage'));
ok('moderator modera', await hp(MOD, 'moderation.manage'));
ok('moderator NO ve facturas', !(await hp(MOD, 'invoices.view')));
ok('moderator NO ve pedidos', !(await hp(MOD, 'orders.view')));
ok('moderator ve disputas pero no las gestiona',
   (await hp(MOD, 'disputes.view')) && !(await hp(MOD, 'disputes.manage')));
ok('cliente no tiene ningun permiso', !(await hp(CLIENT, 'dashboard.view')));

console.log('\n=== my_permissions / my_role ===');
await asUser(MOD);
const myPerms = (await db.query(`select * from public.my_permissions()`)).rows;
ok('my_permissions() devuelve los 6 del moderador', myPerms.length === 6, `(${myPerms.length})`);
ok('my_role() devuelve moderator', (await one(`select public.my_role()::text as r`)).r === 'moderator');
await asUser(FOUNDER);
ok('my_role() del fundador es superadmin (rango mayor, no el primero)',
   (await one(`select public.my_role()::text as r`)).r === 'superadmin');

console.log('\n=== Invariante 1: nadie toca sus propios roles ===');
await asUser(FOUNDER);
const selfErr = await raises(`insert into public.user_roles (user_id, role) values ($1,'admin')`, [FOUNDER]);
ok('el superadmin no puede auto-asignarse', !!selfErr, selfErr ?? '(no fallo)');
ok('  y el mensaje lo explica', (selfErr ?? '').includes('propios roles'), selfErr ?? '');

const selfDel = await raises(`delete from public.user_roles where user_id = $1 and role = 'admin'`, [FOUNDER]);
ok('tampoco puede quitarse un rol a si mismo', !!selfDel);

console.log('\n=== Invariante 2: no quedarse sin superadmin ===');
await asUser(SECOND);
const lastErr = await raises(`delete from public.user_roles where user_id = $1 and role = 'superadmin'`, [FOUNDER]);
ok('no se puede borrar al ultimo superadmin', !!lastErr, lastErr ?? '(no fallo)');
ok('  y el mensaje lo explica', (lastErr ?? '').includes('ultimo superadmin'), lastErr ?? '');

// Con dos superadmins, quitar uno si debe funcionar.
await asUser(null);
await db.query(`insert into public.user_roles (user_id, role) values ($1,'superadmin')`, [SECOND]);
await asUser(FOUNDER);
const delSecond = await raises(`delete from public.user_roles where user_id = $1 and role = 'superadmin'`, [SECOND]);
ok('con dos superadmins si se puede revocar a uno', delSecond === null, delSecond ?? '');

console.log('\n=== Auditoria ===');
const audit = (await db.query(`
  select action, entity_type, actor_role, entity_id from public.audit_logs order by created_at
`)).rows;
ok('los cambios de rol dejan rastro', audit.length > 0, `(${audit.length} filas)`);
ok('hay un role.granted', audit.some(r => r.action === 'role.granted'));
ok('hay un role.revoked', audit.some(r => r.action === 'role.revoked'));
ok('el rastro apunta a user_roles', audit.every(r => r.entity_type === 'user_roles'));
const revoked = audit.find(r => r.action === 'role.revoked');
ok('el revoke registra quien lo hizo con su rango', revoked?.actor_role === 'superadmin', JSON.stringify(revoked));

console.log('\n=== Puerta de list_role_assignments ===');
await asUser(CLIENT);
const gateErr = await raises(`select * from public.list_role_assignments()`);
ok('un cliente no puede listar roles', !!gateErr, gateErr ?? '(no fallo)');
await asUser(MOD);
const gateMod = await raises(`select * from public.list_role_assignments()`);
ok('un moderador tampoco (no tiene roles.view)', !!gateMod);
await asUser(FOUNDER);
const list = (await db.query(`select * from public.list_role_assignments()`)).rows;
ok('el superadmin si lista', list.length > 0, `(${list.length} filas)`);
ok('la lista trae email desde profiles', list.every(r => !!r.email));
ok('viene ordenada por rango, superadmin primero', list[0]?.role === 'superadmin', JSON.stringify(list[0]));

console.log('\n=== find_user_by_email ===');
await asUser(FOUNDER);
const found = (await db.query(`select * from public.find_user_by_email($1)`, ['  MOD@THEREMAINDER.PL '])).rows;
ok('busca ignorando mayusculas y espacios', found.length === 1 && found[0].user_id === MOD);
const notFound = (await db.query(`select * from public.find_user_by_email($1)`, ['nadie@ejemplo.com'])).rows;
ok('email inexistente devuelve vacio', notFound.length === 0);
await asUser(SECOND);
const findGate = await raises(`select * from public.find_user_by_email($1)`, ['mod@theremainder.pl']);
ok('un admin sin roles.manage no puede buscar cuentas', !!findGate, findGate ?? '(no fallo)');

console.log(`\n=== RESULTADO: ${pass} pasan, ${fail} fallan ===`);
process.exit(fail === 0 ? 0 : 1);
