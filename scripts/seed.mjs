// Seeds (or resets) the demo account and its workspace data.
// Usage: npm run seed   (reads .env.local)
import { createClient } from "@supabase/supabase-js";
import { faker } from "@faker-js/faker";

const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key, DEMO_EMAIL: email, DEMO_PASSWORD: password } =
  process.env;
if (!url || !key || !email || !password) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEMO_EMAIL or DEMO_PASSWORD in .env.local");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });
const TYPES = ["Call", "Email", "Meeting", "Note"];

// 1. Demo user (create if missing, otherwise reset password).
let userId;
const created = await db.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: "Demo User" },
});
if (created.error) {
  const { data } = await db.auth.admin.listUsers({ perPage: 1000 });
  userId = data.users.find((u) => u.email === email)?.id;
  if (!userId) throw created.error;
  await db.auth.admin.updateUserById(userId, { password });
} else {
  userId = created.data.user.id;
}

// 2. Their personal workspace (created by the signup trigger), forced to Pro so the demo has no limit.
const { data: member, error: mErr } = await db
  .from("workspace_members").select("workspace_id").eq("user_id", userId).eq("role", "owner").limit(1).single();
if (mErr) throw mErr;
const ws = member.workspace_id;
await db.from("workspaces").update({ name: "Acme Studio", plan: "pro" }).eq("id", ws);

// 3. Wipe and regenerate data (activities cascade with clients).
await db.from("clients").delete().eq("workspace_id", ws);
faker.seed(42);

const clients = Array.from({ length: 40 }, () => {
  const status = faker.helpers.weightedArrayElement([
    { weight: 2, value: "New" }, { weight: 2, value: "Contacted" }, { weight: 2, value: "Proposal Sent" },
    { weight: 2, value: "Won" }, { weight: 1, value: "Lost" },
  ]);
  const updated = faker.date.recent({ days: 150 });
  return {
    workspace_id: ws,
    owner_id: userId,
    name: faker.person.fullName(),
    company: faker.company.name(),
    email: faker.internet.email().toLowerCase(),
    phone: faker.phone.number(),
    status,
    value: faker.number.int({ min: 5, max: 120 }) * 100,
    last_contact: updated.toISOString(),
    created_at: faker.date.past({ years: 1, refDate: updated }).toISOString(),
    updated_at: updated.toISOString(),
  };
});
const { data: inserted, error: cErr } = await db.from("clients").insert(clients).select("id");
if (cErr) throw cErr;

const activities = inserted.flatMap(({ id }) =>
  Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () => ({
    workspace_id: ws,
    client_id: id,
    created_by: userId,
    type: faker.helpers.arrayElement(TYPES),
    note: faker.lorem.sentence(),
    created_at: faker.date.recent({ days: 60 }).toISOString(),
  })),
);
const { error: aErr } = await db.from("activities").insert(activities);
if (aErr) throw aErr;

console.log(`Seeded ${inserted.length} clients and ${activities.length} activities for ${email}.`);
