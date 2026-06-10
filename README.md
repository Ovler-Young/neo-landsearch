# Island Search

Third-party search frontend for https://www.nmbxd1.com.

Forked from https://github.com/saveweb/neo-uglysearch.

## Search fields

The frontend targets the `posts` table and `nmbxd` index. Search and filters use the synced fields:

- `id`
- `fid`
- `ext`
- `now`
- `name`
- `title`
- `content`
- `parent`
- `type`
- `userid`

`img` is intentionally not synced because image paths are randomized.

## Advanced search examples

```sql
(fid = 4 AND type = "thread" AND now >= sec(2025-1-1))
```

```sql
(content CONTAINS "岛" AND fid IN [4, 20])
```

## Development

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

```bash
pnpm dev
```

Set `API_BACKEND` to your backend URL in `.env.local` or in Vercel. Browser clients call the local Next.js API routes instead of the backend directly.

```bash
API_BACKEND=http://localhost:3000
```

## License

MIT.
