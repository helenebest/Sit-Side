# 🚀 Sit Side - Production Deployment Guide

## Quick Start (Recommended: Vercel)

### 1. Prepare Your Code
```bash
# Make sure all changes are committed
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click "New Project"
3. Import your `windward-connect` repository
4. Vercel will auto-detect it's a React app
5. Click "Deploy"

### 3. Set Environment Variables
In Vercel dashboard → Project Settings → Environment Variables:
```
REACT_APP_API_URL=https://your-project-name.vercel.app/api
NODE_ENV=production
```

### 4. Add Custom Domain
1. In Vercel dashboard → Domains
2. Add your purchased domain
3. Follow DNS setup instructions
4. Update CORS_ORIGIN in environment variables

## Alternative: Netlify + Railway

### Frontend (Netlify)
1. Go to [netlify.com](https://netlify.com)
2. Connect GitHub repository
3. Build command: `npm run build`
4. Publish directory: `build`

### Backend (Railway)
1. Go to [railway.app](https://railway.app)
2. Deploy from GitHub
3. Set environment variables
4. Get your Railway URL
5. Update frontend API URL

## Database Setup (MongoDB Atlas)

### 1. Create Free Cluster
1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create account
3. Create free cluster (M0 Sandbox)
4. Choose region closest to your users

### 2. Configure Database
1. Create database user
2. Whitelist IP addresses (0.0.0.0/0 for development)
3. Get connection string
4. Add to environment variables

### 3. Environment Variables
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sitside
JWT_SECRET=your-super-secure-secret-key
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-secure-password
```

## Domain Purchase & Setup

### Recommended Registrars
- **Namecheap**: $10-15/year, good value
- **Google Domains**: $12/year, simple
- **Cloudflare**: $9/year, cheapest

### DNS Configuration
For Vercel:
```
Type: A
Name: @
Value: 76.76.19.19

Type: CNAME  
Name: www
Value: your-project.vercel.app
```

## Security Checklist

### ✅ Environment Variables
- [ ] JWT secret is strong and unique
- [ ] Admin password is secure
- [ ] MongoDB connection string is secure
- [ ] CORS origin is set correctly

### ✅ Production Settings
- [ ] NODE_ENV=production
- [ ] Rate limiting enabled
- [ ] Helmet security headers
- [ ] HTTPS enabled (automatic with Vercel)

### ✅ Database Security
- [ ] Database user has minimal permissions
- [ ] IP whitelist configured
- [ ] Regular backups enabled

## Monitoring & Maintenance

### Health Checks
- Monitor `/api/health` endpoint
- Set up uptime monitoring (UptimeRobot)
- Monitor error logs

### Updates
- Regular security updates
- Monitor for new vulnerabilities
- Keep dependencies updated

## Cost Breakdown (Monthly)

### Free Tier (Starting Out)
- **Domain**: $1-2/month (annual cost ÷ 12)
- **Vercel**: Free
- **MongoDB Atlas**: Free (512MB)
- **Total**: ~$1-2/month

### Growth Tier
- **Domain**: $1-2/month
- **Vercel Pro**: $20/month
- **MongoDB Atlas**: $9/month
- **Monitoring**: $5-10/month
- **Total**: ~$35-40/month

## Troubleshooting

### Common Issues
1. **CORS errors**: Check CORS_ORIGIN environment variable
2. **Database connection**: Verify MongoDB URI and IP whitelist
3. **Build failures**: Check Node.js version compatibility
4. **Domain not working**: Wait 24-48 hours for DNS propagation

### Support Resources
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)

## Next Steps After Deployment

1. **Test all functionality** on live site
2. **Set up monitoring** and alerts
3. **Create backup strategy**
4. **Plan for scaling** as you grow
5. **Consider adding**:
   - Payment processing (Stripe)
   - Email notifications
   - Push notifications
   - Background checks
   - Advanced search filters

---

**Need help?** Check the troubleshooting section or reach out for support!
