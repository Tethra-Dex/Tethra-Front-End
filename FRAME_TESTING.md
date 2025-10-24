# Cara Testing Farcaster Frame

## 1. Testing di Localhost (Development)

### Start Development Server
```bash
npm run dev
```

Server akan running di: http://localhost:3002 (atau port lain jika 3000 dipakai)

### Test Image Endpoints Langsung di Browser

Buka URL berikut di browser untuk melihat image yang di-generate:

#### Main View
```
http://localhost:3002/api/frame/image?view=main
```
**Expected:** Logo TethraDEX dengan 2 card (Advanced Charts & Free USDC)

#### Chart View - BTC Default
```
http://localhost:3002/api/frame/image?view=chart
```
**Expected:** Chart BTC dengan bar representation, price info, dan stats

#### Chart View - ETH
```
http://localhost:3002/api/frame/image?view=chart&coin=ETH
```
**Expected:** Chart ETH dengan bar representation dan stats ETH

#### Chart View - Different Timeframe
```
http://localhost:3002/api/frame/image?view=chart&coin=BTC&timeframe=1H
http://localhost:3002/api/frame/image?view=chart&coin=BTC&timeframe=1D
http://localhost:3002/api/frame/image?view=chart&coin=BTC&timeframe=1W
```
**Expected:** Chart dengan timeframe button yang aktif sesuai selection

#### Connect View
```
http://localhost:3002/api/frame/image?view=connect
```
**Expected:** Info wallet connection dengan Privy features

#### Claim View
```
http://localhost:3002/api/frame/image?view=claim
```
**Expected:** Highlight "100 USDC" dengan green gradient background

#### Coins View
```
http://localhost:3002/api/frame/image?view=coins
```
**Expected:** BTC dan ETH cards dengan "More markets coming soon"

### Test Frame HTML & Meta Tags

```
http://localhost:3002/api/frame
```

**Cara Check:**
1. Buka URL di browser
2. Klik kanan → "View Page Source"
3. Cari meta tags yang dimulai dengan `fc:frame`
4. Pastikan ada:
   - `fc:frame` = "vNext"
   - `fc:frame:image` = URL ke image
   - `fc:frame:button:1`, `button:2`, dst
   - `fc:frame:post_url` = URL untuk POST request

---

## 2. Testing dengan Farcaster Frame Validator

### Menggunakan Warpcast Frame Validator

**Problem:** Validator butuh **public URL**, localhost tidak bisa diakses.

**Solusi:** Gunakan tunnel service untuk expose localhost.

### Opsi A: Menggunakan Ngrok

1. **Install Ngrok:**
   - Download dari https://ngrok.com/download
   - Atau install via npm: `npm install -g ngrok`

2. **Jalankan Ngrok:**
   ```bash
   ngrok http 3002
   ```

3. **Copy Public URL:**
   ```
   Ngrok akan memberikan URL seperti:
   https://abcd-1234.ngrok-free.app
   ```

4. **Update Environment Variable (temporary):**
   ```bash
   # Di terminal baru
   export NEXT_PUBLIC_APP_URL=https://abcd-1234.ngrok-free.app

   # Atau edit .env.local:
   NEXT_PUBLIC_APP_URL=https://abcd-1234.ngrok-free.app
   ```

5. **Restart Next.js server** untuk apply env variable baru

6. **Test di Warpcast Frame Validator:**
   - Buka: https://warpcast.com/~/developers/frames
   - Paste URL: `https://abcd-1234.ngrok-free.app/api/frame`
   - Klik "Validate"

### Opsi B: Menggunakan Cloudflare Tunnel

1. **Install Cloudflare Tunnel:**
   ```bash
   npm install -g cloudflared
   ```

2. **Jalankan Tunnel:**
   ```bash
   cloudflared tunnel --url http://localhost:3002
   ```

3. **Copy Public URL** dan follow step yang sama seperti Ngrok

---

## 3. Manual Testing Frame Interaction

### Test Flow 1: Main → Chart
1. Buka: `http://localhost:3002/api/frame`
2. View source, copy salah satu button target URL
3. Paste di browser
4. Seharusnya redirect ke chart view

### Test Flow 2: Chart → Switch Coin
1. Buka: `http://localhost:3002/api/frame?action=chart&coin=BTC&timeframe=1D`
2. Seharusnya tampil BTC chart
3. Ubah `coin=BTC` jadi `coin=ETH`
4. Seharusnya tampil ETH chart

### Test Flow 3: Chart → Change Timeframe
1. Buka: `http://localhost:3002/api/frame?action=chart&coin=BTC&timeframe=1H`
2. Ubah `timeframe=1H` jadi `timeframe=1D` atau `timeframe=1W`
3. Image seharusnya update dengan timeframe button yang aktif

---

## 4. Testing Checklist

### ✅ Image Generation
- [ ] Main view tampil dengan benar
- [ ] Chart view BTC tampil
- [ ] Chart view ETH tampil
- [ ] Timeframe buttons highlight sesuai selection
- [ ] Connect view tampil
- [ ] Claim view tampil dengan "100 USDC"
- [ ] Coins view tampil dengan BTC dan ETH

### ✅ Frame Meta Tags
- [ ] `fc:frame` meta tag ada
- [ ] `fc:frame:image` ada dan URL valid
- [ ] `fc:frame:button:1` sampai `button:4` ada
- [ ] `fc:frame:post_url` ada dan URL valid
- [ ] Button actions (post/link) benar

### ✅ Dynamic Interaction
- [ ] Switch BTC → ETH berfungsi
- [ ] Switch ETH → BTC berfungsi
- [ ] Change timeframe 1H, 1D, 1W berfungsi
- [ ] Back button ke main menu berfungsi
- [ ] Trade link ke `/trade` benar

### ✅ Frame Validator (jika pakai tunnel)
- [ ] Frame valid di Warpcast validator
- [ ] Image preview muncul
- [ ] Buttons muncul dengan label yang benar
- [ ] Button interactions berfungsi
- [ ] No errors di validator

---

## 5. Debugging Tips

### Jika Image Tidak Muncul:
1. Check browser console untuk error
2. Buka URL image langsung di tab baru
3. Check apakah ImageResponse error di terminal
4. Pastikan tidak ada syntax error di JSX

### Jika Meta Tags Tidak Ada:
1. View page source (bukan inspect element)
2. Search untuk "fc:frame"
3. Check apakah `generateFrameHTML()` dipanggil dengan benar
4. Pastikan `other` field di metadata tidak overwrite

### Jika Button Tidak Berfungsi:
1. Check button target URL format
2. Pastikan POST endpoint handle parameters dengan benar
3. Log di console untuk debug: `console.log('Frame interaction:', { action, coin, timeframe })`
4. Check apakah searchParams di-pass dengan benar

### Jika Validator Error:
- "Invalid frame version" → Check `fc:frame` value harus "vNext"
- "Image not found" → Check image URL accessible dan return 200
- "Invalid button action" → Check action type: "post", "link", atau "post_redirect"
- "Missing post_url" → Pastikan `fc:frame:post_url` meta tag ada

---

## 6. Production Testing

### Deploy ke Vercel
```bash
vercel --prod
```

### Update .env.production
```
NEXT_PUBLIC_APP_URL=https://tethradex.vercel.app
```

### Test Production Frame
1. Buka: https://tethradex.vercel.app/api/frame
2. Test di Warpcast Frame Validator
3. Test di Farcaster app (jika punya akses)

---

## 7. Advanced Testing Tools

### Farcaster Frame Tester (CLI)
```bash
npx farcaster-frame-tester http://localhost:3002/api/frame
```

### Manual POST Request Test
```bash
curl -X POST http://localhost:3002/api/frame?action=chart \
  -H "Content-Type: application/json" \
  -d '{"untrustedData": {"fid": 12345}}'
```

---

## Common Issues & Solutions

### Port Already in Use
```
Error: Port 3000 is in use
Solution: Server auto-switch ke port lain (3002, 3003, etc)
```

### Image Generation Timeout
```
Error: ERR_EMPTY_RESPONSE
Solution: Simplify JSX, remove unsupported CSS properties
```

### Meta Tags Not Updating
```
Problem: Changes tidak keliatan
Solution: Clear browser cache atau hard refresh (Ctrl+F5)
```

---

## Quick Test Commands

```bash
# Test all image endpoints
curl http://localhost:3002/api/frame/image?view=main
curl http://localhost:3002/api/frame/image?view=chart
curl http://localhost:3002/api/frame/image?view=chart&coin=ETH
curl http://localhost:3002/api/frame/image?view=connect
curl http://localhost:3002/api/frame/image?view=claim
curl http://localhost:3002/api/frame/image?view=coins

# Test frame HTML
curl http://localhost:3002/api/frame | grep "fc:frame"
```

---

Happy Testing! 🚀
