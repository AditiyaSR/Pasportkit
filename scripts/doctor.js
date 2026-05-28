#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const env = {};
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const index = line.indexOf('=');
    env[line.slice(0, index).trim()] = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
  }
  return env;
}

async function checkSupabase(label, url, key) {
  if (!url || !key) {
    console.log(`${label}: skipped, missing env`);
    return false;
  }

  try {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error, status, statusText } = await client
      .from('passports')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.log(`${label}: failed (${status || 'unknown'} ${statusText || ''})`);
      console.log(`  ${error.message || 'Supabase returned an error. Check key, project URL, schema, and RLS.'}`);
      return false;
    }

    console.log(`${label}: ok`);
    return true;
  } catch (error) {
    console.log(`${label}: failed (${error.message})`);
    return false;
  }
}

async function main() {
  console.log('PassportKit dev doctor\n');

  const envCheck = spawnSync(process.execPath, ['scripts/check-env.js'], {
    stdio: 'inherit',
  });

  const env = {
    ...parseEnvFile(path.join(process.cwd(), '.env.local')),
    ...process.env,
  };

  console.log('\nSupabase connectivity check');
  const anonOk = await checkSupabase('Anon key', env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const serviceOk = await checkSupabase('Service role key', env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  console.log('\nDatabase setup order');
  console.log('1. Run supabase/setup_all.sql');
  console.log('2. Run supabase/rls_policies.sql');
  console.log('3. Run supabase/storage.sql');
  console.log('4. Run supabase/repair_user_workspace.sql only when repairing existing users');

  console.log('\nCore smoke test');
  console.log('1. npm run build');
  console.log('2. npm run dev');
  console.log('3. Open /admin/setup and confirm core Supabase is configured');
  console.log('4. Create a guest passport from /generator');
  console.log('5. Log in and create the first workspace passport');
  console.log('6. Open /p/[slug] in a logged-out/incognito browser');

  if (envCheck.status !== 0) {
    console.log('\nCore environment is incomplete. Fill .env.local before testing passport creation.');
    process.exitCode = envCheck.status || 1;
  } else if (!anonOk || !serviceOk) {
    console.log('\nCore Supabase connectivity is not healthy. Fix the key/project/migration issue before testing passport creation.');
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
