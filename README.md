# Cookie-share Chrome/Edge/Firefox Extension/Tampermonkey Script

*Note: For learning and communication purposes only. Strictly prohibited for commercial use. Please delete within 24 hours and do not share on social platforms. If this project is useful to you, please give it a star. It really helps me a lot, thank you!*

**Please check [issues](https://github.com/fangyuan99/cookie-share/issues) | [discussions](https://github.com/fangyuan99/cookie-share/discussions) first if you have any questions**

[English](./README.md) | [简体中文](./README_CN.md) | [Update Log](./update.md)

---

## Overview

Cookie-share is a Chrome/Edge/Firefox extension (also has a Tampermonkey script) that allows users to send and receive cookies between different devices or browsers, and can be used for **multi-account switching, sharing video memberships, co-renting planets** and other scenarios. The backend uses a self-hosted Cloudflare Worker to ensure data security.


![image](https://github.com/user-attachments/assets/48877965-4c5e-40ec-9b40-ceeb31a469ef)

---

![image](https://github.com/user-attachments/assets/0260e0b4-760d-4635-88ec-c9417cef6d9b)

---

<img src="https://github.com/user-attachments/assets/309a4e2f-63f2-4ff1-a5c4-d8c9982c1840" width="50%" height="50%" alt="" >

[Download Link](https://github.com/fangyuan99/cookie-share/releases) | [Tampermonkey Script Chinese Address](https://github.site/fangyuan99/cookie-share/raw/refs/heads/main/tampermonkey/cookie-share.user.js) | [Tampermonkey Script Global Address](https://github.com/fangyuan99/cookie-share/raw/refs/heads/main/tampermonkey/cookie-share.user.js)

### Effects and Use Cases
**Many websites don't support multi-account switching, and you don't want to log out and log in again?**

**You have a video membership but your friends always find it cumbersome to scan a code?**

**You joined a certain planet and want to share the rent with classmates?**

**Simply too lazy to take out your phone or enter passwords to log in on different devices?**

1. Go to the homepage of the logged-in website (any address with cookies works)
2. Click the plugin icon, customize an ID (only letters and numbers supported), send cookies
3. On devices without login, visit the login page, use the same ID to receive cookies, wait for the plugin to show successful cookie reception and setting, then refresh the webpage

Tested websites:
1. Certain Planet
2. Certain Yi
3. Certain L site

## Features

- Generate random unique ID for cookie sharing
- Send cookies from current tab to server
- Receive and set cookies from server to current tab
- Admin features for managing stored cookies
- Due to higher plugin permissions, supports `HTTPOnly` Cookies that JS cannot access

## Usage

### Plugin Usage
1. Enable Developer mode in your browser:
   - Chrome/Edge: Visit `chrome://extensions/`
   - Firefox: Visit `about:debugging#/runtime/this-firefox`
2. Load the extension:
   - Chrome/Edge: Drag the `cookie-share.zip` directly into the browser
   - Firefox: Load the `cookie-share.xpi` file temporarily or install from Firefox Add-ons
3. Click the Cookie-share icon in the browser toolbar
4. Send cookies from logged-in browser page
5. Receive cookies on non-logged-in browser page
6. Note: Don't add `/` at the end of the address, example: `https://your-worker-name.your-subdomain.workers.dev`

### Tampermonkey Usage

1. Install [Tampermonkey](https://www.crxsoso.com/webstore/detail/dhdgffkkebhmkfjojejmpbldmpobfkfo) or other script managers
2. [Script Chinese Address](https://github.site/fangyuan99/cookie-share/raw/refs/heads/main/tampermonkey/cookie-share.user.js) | [Script Global Address](https://github.site/fangyuan99/cookie-share/raw/refs/heads/main/tampermonkey/cookie-share.user.js)

### Backend Deployment Tutorial


1. [Register](https://dash.cloudflare.com/sign-up) a Cloudflare account and create a Worker
2. Copy the contents of `_worker.js` to your newly created Worker
3. In Cloudflare Worker settings, add the following environment variables:
   - `ADMIN_PASSWORD`: Set a strong password for accessing admin endpoints
   - `COOKIE_STORE`: Create a KV namespace for storing cookie data
4. In Worker settings, bind the KV namespace:
   - Variable name: `COOKIE_STORE`
   - KV namespace: Select your created KV namespace
5. Save and deploy the Worker
6. Note down the Worker URL, format like: `https://your-worker-name.your-subdomain.workers.dev` (if blocked, please use custom domain)

## Security Considerations

- Ensure `ADMIN_PASSWORD` is set to a strong password and changed regularly
- Don't hardcode `ADMIN_PASSWORD` in code, always use environment variables
- Regularly review stored data, delete unnecessary cookie data
- Consider setting expiration times for cookie data to reduce the risk of storing sensitive information long-term
- Use `PATH_SECRET` in worker configuration to prevent brute force attacks
- Choose complex project names and disable the built-in workers.dev domain

## Backend (Cloudflare Worker)

**If the `/admin/*` interface encounters issues, please check if `X-Admin-Password` is added or use the cf official kv management page**

Backend is implemented as a Cloudflare Worker, providing the following endpoints:

Note: Add `X-Admin-Password: yourpassword`

Example:

`/{PATH_SECRET}/admin/list-cookies`

```sh
curl --location --request GET 'https://your-worker-name.your-subdomain.workers.dev/{PATH_SECRET}/admin/list-cookies' \
--header 'X-Admin-Password: yourpassword'
```

`/{PATH_SECRET}/admin/delete`

```sh
curl --location --request DELETE 'https://your-worker-name.your-subdomain.workers.dev/{PATH_SECRET}/admin/delete?key={yourid}' \
--header 'X-Admin-Password: yourpassword'
```

Available endpoints:
- `POST /{PATH_SECRET}/send-cookies`: Store cookies associated with unique ID
- `GET /{PATH_SECRET}/admin`: Access admin management page
- `GET /{PATH_SECRET}/admin/list-cookies`: List all stored cookie IDs and URLs
- `GET /{PATH_SECRET}/admin/list-cookies-by-host`: List cookies filtered by hostname
- `DELETE /{PATH_SECRET}/admin/delete`: Delete data for given key
- `PUT /{PATH_SECRET}/admin/update`: Update data for given key
- `OPTIONS /{PATH_SECRET}/`: Handle CORS preflight requests

The admin management page provides a user-friendly interface for managing cookies and other data stored in the Worker. It includes features for viewing all stored cookies, creating new cookie entries, updating existing cookies, and deleting individual cookies or all stored data.

To access the admin page, navigate to `https://your-worker-name.your-subdomain.workers.dev/admin` in your browser. You will need to enter the admin password before accessing the management interface.

**Admin endpoints require authentication using the admin password.**

## File Structure

- `manifest.json`: Extension configuration file
- `popup.html`: HTML structure for extension popup
- `popup.js`: JavaScript for handling user interactions and cookie operations
- `style.css`: CSS styles for popup
- `_worker.js`: Cloudflare Worker script for backend operations

## Development

Modifying the extension:

1. Edit relevant files (`popup.html`, `popup.js`, `style.css`)
2. Reload the extension in Chrome to see changes

Modifying the backend:

1. Edit the `_worker.js` file
2. Deploy updated Worker to Cloudflare

## Security Considerations (Not yet perfected in initial version)

- Extension uses HTTPS for all communication with backend
- Admin endpoints are password protected
- Input validation implemented to prevent injection attacks
- Cookies are securely stored on server, inaccessible without unique ID

## Future Development Plans

- Only provide admin API, no management page (update time unknown)

## Contributing

[aBER0724 (aBER)](https://github.com/aBER0724) - Rewrite the Tampermonkey script
Contributions welcome! Feel free to submit Pull Requests.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=fangyuan99/cookie-share&type=Date)](https://star-history.com/#fangyuan99/cookie-share&Date)

## License

MIT
