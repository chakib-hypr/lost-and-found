# Lost & Found API
 
An API to report lost and found items. Built with Node.js, Express and Supabase.
 
## Requirements
 
- Node.js, Git, VS Code, Thunder Client
- Supabase and GitHub accounts
- Packages: express, @supabase/supabase-js, dotenv, bcryptjs, jsonwebtoken
## Run
 
1. `npm install`
2. Run `schema.sql` in the Supabase SQL Editor
3. Fill the `.env` file
4. `node index.js`
## Endpoints
 
- `POST /register`: create an account
- `POST /login`: get a token
- `POST /items`: report an item (token)
- `GET /items`: list and filter (`type`, `category`, `status`, `q`)
- `GET /items/:id`: view one item
- `PUT /items/:id`: update your report (token)
- `PATCH /items/:id/recovered`: mark as recovered (token)
Token header: `Authorization: Bearer <token>`
 
