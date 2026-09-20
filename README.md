# K Star Light

MERN product catalogue and quotation management application.

Customers can browse and compare lights, use a multi-product cart, and submit an order request as a guest or with an account. Guest order access is stored in the same browser and device used at checkout. The owner sends a final quote with item prices, delivery charge, terms, and expiry date. The customer accepts that quote before stock is reserved and the order is confirmed. No online payment is collected by the site. UPI payments remain pending until the owner manually verifies them.

## Local setup

After checkout, the request is saved and the customer is redirected to a prefilled WhatsApp message to the business number to ask for current prices. The customer must tap Send in WhatsApp; this is not an automatic WhatsApp API message. Set `VITE_ORDER_WHATSAPP_NUMBER` in the frontend build environment and `ORDER_WHATSAPP_NUMBER` in the backend environment to change the recipient (international digits without `+`). The owner contacts the customer before providing UPI details or arranging a third-party courier.

In Admin > Orders, enter a final price for each item, a delivery charge, quote expiry and optional terms, then select **Save and send quote**. The customer receives an email link when SMTP is configured. The admin can also share the link through WhatsApp. The quote page has **Save quote as PDF**, which opens the browser print dialog; choose Save as PDF. The customer accepts the quote on that page. If stock is unavailable when the quote is accepted, the request stays open and the owner must resolve availability. Earlier orders created before this quote workflow retain their existing stock handling.

The dashboard highlights requests needing contact and due follow-ups. Admin > Customers groups website and manual orders using matching email, phone, or company details; check possible duplicates before using those records.

Verified accounts can also see guest orders placed with the same email address. Email/password accounts must verify ownership with a six-digit email code before those guest orders are linked. Google sign-in can verify Gmail and Google Workspace addresses directly.

1. Start MongoDB.
2. Copy `backend/.env.example` to `backend/.env` and set local values.
3. Run `npm install && npm start` inside `backend`.
4. Run `npm install && npm run dev` inside `frontend`.

The admin address is configured by `ADMIN_EMAIL` in `backend/.env`. Change its password before sharing or deploying the application. Entering that email on the customer sign-in page routes to the separate admin login; the admin password is still required.

## Production configuration

- Set `MONGODB_URI` to the MongoDB Atlas connection string.
- Replace `JWT_SECRET` with a long random secret.
- Set `FRONTEND_URL` to the deployed frontend origin.
- Set `VITE_API_URL` while building the frontend.
- For Google sign-in, create a Google Identity Services Web client ID, add the frontend origin to Authorized JavaScript origins, and set the same ID as `GOOGLE_CLIENT_ID` on the backend and `VITE_GOOGLE_CLIENT_ID` on the frontend. For local use, authorize `http://localhost:5173`. Restart both services after setting these values.
- Configure `AWS_REGION`, `AWS_S3_BUCKET`, and optionally `AWS_CDN_URL` to use S3. Without them, development uploads use `backend/uploads`.
- Give the deployment role only `s3:PutObject` permission for `products/*`; do not store AWS access keys in source files.
- Enable MongoDB Atlas continuous cloud backups or scheduled snapshots and test restoration periodically.
- Rotate the bootstrap admin password after first production login by updating the account securely in MongoDB.

## Order emails

The owner notification address is `adityapathak987@gmail.com`. Set `MAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS` in `backend/.env` to activate actual email delivery through an SMTP provider. Until those values are configured, orders still save, but their `emailStatus` is `not_configured` and no email is sent. Do not use a regular Gmail password; use a provider-approved SMTP credential.

Email verification codes also require SMTP. If SMTP is unavailable, customers can still place orders and see their signed-in purchases, but earlier guest orders will remain accessible only from the browser used at checkout until verification is configured.

Add a real payment provider and automated verification before accepting online payments. Configure SMTP to send request, quote, and status emails; without it, buyers can still check status from My orders on the same device or through their account, and the owner can share a quote link manually.

Both applications include Dockerfiles. The frontend Nginx configuration supports React Router fallback routes.
