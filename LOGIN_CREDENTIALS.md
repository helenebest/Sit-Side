# Login Credentials for Vercel Deployment

## Default Admin Account

When deploying to Vercel, you can use the following default admin credentials:

**Email:** `helbybest@gmail.com`  
**Password:** `Tenacity2301!`

## Important Notes

1. **Serverless Function Behavior**: In Vercel serverless functions, user data is stored in-memory and resets on each cold start. The default admin account is automatically recreated on each request.

2. **New Users**: If you register a new account, it will only persist during that serverless function instance's lifetime. For production, you should use a database (MongoDB Atlas recommended).

3. **Environment Variables**: You can override the default admin credentials by setting these environment variables in Vercel:
   - `ADMIN_EMAIL` - Your admin email
   - `ADMIN_PASSWORD` - Your admin password

## Testing Login

1. Navigate to your deployed site's login page
2. Enter the credentials above
3. You should be redirected to the admin dashboard upon successful login

## Troubleshooting

If login fails:
1. Check the browser console for error messages
2. Verify the API endpoint is accessible: `https://your-site.vercel.app/api/health`
3. Check Vercel function logs for any errors
4. Ensure you're using the exact email (case-insensitive) and password

## Registering New Accounts

You can register new accounts through the signup page, but note:
- Accounts will only persist during the serverless function instance lifetime
- For production, integrate MongoDB Atlas for persistent storage
- See `DEPLOYMENT.md` for database setup instructions

