# TikTok Events API Payloads

## Full API Request Structure

```json
POST https://business-api.tiktok.com/open_api/v1.3/event/track/
Headers: {
  "Content-Type": "application/json",
  "Access-Token": "YOUR_ACCESS_TOKEN"
}
{
  "pixel_code": "PIXEL_ID",
  "event": "CompletePayment",
  "event_id": "unique-event-id-123",
  "timestamp": "2025-01-15T10:30:00Z",
  "context": {
    "user_agent": "Mozilla/5.0...",
    "ip": "1.2.3.4",
    "page": {
      "url": "https://example.com/thank-you",
      "referrer": "https://example.com/checkout"
    },
    "ad": {
      "callback": "TTCLID_VALUE"
    },
    "user": {
      "email": "SHA256_HASHED_EMAIL",
      "phone": "SHA256_HASHED_PHONE",
      "external_id": "SHA256_HASHED_ID",
      "first_name": "SHA256_HASHED_FIRST_NAME",
      "last_name": "SHA256_HASHED_LAST_NAME",
      "city": "SHA256_HASHED_CITY",
      "state": "SHA256_HASHED_STATE",
      "country": "SHA256_HASHED_COUNTRY",
      "zip_code": "SHA256_HASHED_ZIP"
    }
  },
  "properties": {
    "contents": [{
      "content_id": "SKU-001",
      "content_type": "product",
      "content_name": "Product Name",
      "quantity": 2,
      "price": 59.99,
      "content_category": "Category Name",
      "brand": "Brand Name"
    }],
    "value": 119.98,
    "currency": "USD",
    "order_id": "TXN-12345",
    "query": "search term if applicable"
  }
}
```

## Events API Advanced Matching Fields

Every field in context.user must be SHA-256 hashed (lowercase hex). The API does NOT auto-hash.

| Field | Key | Format Before Hashing | Example |
|-------|-----|----------------------|---------|
| Email | email | lowercase, trimmed | user@example.com |
| Phone | phone | digits with country code | 11234567890 |
| External ID | external_id | your raw user ID | USER-12345 |
| First Name | first_name | lowercase, trimmed | john |
| Last Name | last_name | lowercase, trimmed | doe |
| City | city | lowercase, no punctuation | los angeles |
| State | state | two-letter code, lowercase | ca |
| Country | country | two-letter ISO, lowercase | us |
| Zip Code | zip_code | digits only (US: first 5) | 90001 |
