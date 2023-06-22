![wink](https://github.com/fogbender/b2b-saaskit/assets/41166/4f00bef4-8db5-4568-9fe5-bcbfe08619a5)

# Welcome to the B2B SaaS Kit!

The B2B SaaS Kit is an open-source springboard for developers looking to quickly stand up a SaaS product where the customer can be a team of users (i.e., a business).

The kit uses TypeScript, Astro, React, Tailwind CSS, and a number of third-party services that take care of essential, yet peripheral requirements, such as secrets management, user authentication, a database, product analytics, customer support, and deployment infrastructure.

The kit is designed with two primary goals in mind:

1. Start with a fully-functional, relatively complex application. Then, modify it to become your own product.

2. You should be able to build an app to validate your idea for the cost of a domain name - all the third-party services used by the kit offer meaningful free-forever starter plans.

## Why "B2B"?

"B2B" means "business-to-business". In the simplest terms, a B2B product is a product where post-signup, a user can create an organization, invite others, and do something as a team.

B2B companies are fairly common - for example, over 40% of <a href="https://www.ycombinator.com/companies" >Y Combinator-funded startups</a> self-identify as B2B - but B2B-specific starter kits appear to be quite rare, hence this effort.

## What's in the kit?

### Backbone

[![Astro](https://github.com/fogbender/b2b-saaskit/assets/41166/0d437d31-95da-43d6-bf31-b7cb3af5baa9)](https://astro.build) &nbsp;&nbsp; [<img src="https://github.com/fogbender/b2b-saaskit/assets/41166/106b6345-bb0e-4785-9b88-086fea0e202a" width="200" />](https://react.dev) &nbsp;&nbsp; [<img src="https://github.com/fogbender/b2b-saaskit/assets/41166/688ba952-4c3d-414e-a273-fb0bd2d98872" width="200" />](https://tailwindcss.com)


### Not optional

[<img src="https://github.com/fogbender/b2b-saaskit/assets/41166/2c2ec770-92e9-473f-afb5-bc4ebff32081" width="200" />](https://doppler.com) &nbsp;&nbsp; [<img src="https://github.com/fogbender/b2b-saaskit/assets/41166/ff4a6935-3af3-4c58-a6a2-6a5322365ca2" width="200" />](https://supabase.com) &nbsp;&nbsp; [<img src="https://github.com/fogbender/b2b-saaskit/assets/41166/6dacda80-ad2f-4eb8-b29e-83b7d687e2d2" width="200" />](https://propelauth.com)

### Optional

[<img src="https://github.com/fogbender/b2b-saaskit/assets/41166/1b059e8a-b1f9-472d-b70c-a073a33eb150" width="200" />](https://stripe.com) &nbsp;&nbsp; [<img src="https://github.com/fogbender/b2b-saaskit/assets/41166/501080dd-19a3-4ae0-a54f-3cd0fad0588b" width="200" />](https://vercel.com) &nbsp;&nbsp; [<img src="https://github.com/fogbender/b2b-saaskit/assets/41166/7c9b2a31-c548-429a-8945-18efb4473919" width="200" />](https://fogbender.com) &nbsp;&nbsp; [<img src="https://github.com/fogbender/b2b-saaskit/assets/41166/6f92c033-d3d5-43d4-ac9a-91dd4651837b" width="200" />](https://posthog.com)

### Also featuring

[Prettier](https://prettier.io/)

[ESLint](https://eslint.org/)

[GitHub](https://github.com)

## Get started

### High-level plan

- First, check out https://PromptsWithFriends.com - it's an example app built with this kit. _Prompts with Friends_ is a way to collaborate on GPT prompts with others

- Next, get your own copy of _Prompts with Friends_ running locally on your machine

- Then, learn how to deploy your version to production

- Lastly, build your own product by modifying the app

### Get it running locally

1. Install prerequisites

   - Node.js 18

2. Clone repo, start app

```
git clone git@github.com:fogbender/b2b-saaskit.git
cd b2b-saaskit
corepack enable
corepack prepare yarn@1.22.19 --activate
yarn
yarn dev
```

3. Open http://localhost:3000 in a browser tab - you should see a page titled "Welcome to Prompts with Friends"

4. You'll find detailed configuration instructions on http://localhost:3000/setup. Once you're here -

<img width="819" alt="image" src="https://github.com/fogbender/b2b-saaskit/assets/41166/a60efadc-0435-4bd9-ae65-ce516e808b02">

\- you should be able to have a working copy of _Prompts with Friends_ running on http://localhost:3000/app

### Deploy to production

## Working with the codebase

### DB migrations

We're using Drizzle Kit to manage database migrations in B2B SaaS Kit. For details on Drizzle, see https://orm.drizzle.team/kit-docs/overview.

Another popular is [Prisma](https://www.prisma.io/docs/guides/migrate/developing-with-prisma-migrate) - if you'd like to use Prisma instead of Drizzle and need help, please get in touch with us.

<details>
<summary>Click to expand</summary>

#### Example: create a new table

First, you'd have to make a few changes in `src/db/schema.ts`. The changes you make will only affect your TypeScript code, not the actual table data.

```ts
export const example = pgTable("example", {
  exampleId: text("id").primaryKey(),
  value: integer("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

If you try to access the `example` table, you'll get a runtime error. To fix this, you have to run a "migration", which applies a set of updates - which may include some combination of schema and data changes - to the database.

Drizzle migrations happen in two steps: the first step generates a migration file, the second step applies the migration to the database.

To generate a migration file, run

```sh
doppler run yarn drizzle-kit generate:pg
```

This will generate a file called something like `src/db/migration/1234_xyz.sql`. Under normal circumstances, you wouldn't have to worry about this file - it will contain an auto-generated set of SQL statements needed to apply the changes expressed in your `schema.ts` to the database. However, since we're using Supabase Postgres, we have to take care of [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security) policies when creating new tables.

To do this, open the migration file and add the following to end, making sure to change `example` to the table name you're using:

```sql
ALTER TABLE example ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service" ON "public"."example" AS PERMISSIVE FOR ALL TO service_role USING (true);
```

Finally, run the migration:

```sh
doppler run yarn migrate
```

If you open your Postgres console (e.g., Supabase or psql), you'll see the new table.

Migrating your development database will not migrate the production one. To migrate production, run `migrate` with production configuration:

```sh
doppler run yarn migrate --config prd
```

</details>

## License

B2B SaaS Kit is licensed under the MIT License. See the [LICENSE](LICENSE.md) file for more details.
