# n8n-nodes-wbp

An [n8n](https://n8n.io) community node for the **WhatsApp Business Platform** API.

## Features

| Resource | Operations |
|---|---|
| **Contact** | Create, Get, Get Many, Update, Delete, Bulk Import |
| **Message** | Send Template, Get Status |
| **Template** | Get, Get Many |
| **Broadcast** | Create, Get Status |

## Installation

In your n8n instance, go to **Settings → Community Nodes** and install:

```
n8n-nodes-wbp
```

## Credentials

Create a **WhatsApp Business Platform API** credential with:

| Field | Description |
|---|---|
| **API Key** | Your API key from Settings → API Keys (format: `wbp_api_...`) |
| **Base URL** | Your platform URL, e.g. `https://api.yourplatform.com` |

## Usage Examples

### Send a Template Message
1. Set Resource → **Message**, Operation → **Send Template**
2. Provide the **Contact ID** and **Template ID**
3. Add body/header parameters matching the template's placeholders

### Bulk Import Contacts
1. Set Resource → **Contact**, Operation → **Bulk Import**
2. Provide a JSON array:
```json
[
  { "phoneNumber": "+919876543210", "name": "John Doe", "tags": "vip" },
  { "phoneNumber": "+919876543211", "name": "Jane Smith" }
]
```

### Create a Broadcast Campaign
1. Set Resource → **Broadcast**, Operation → **Create**
2. Choose a Template ID
3. Set at least one **Audience** filter (e.g. Tag IDs or Language)
4. Optionally add static parameters or per-contact field mappings

## Notes

- Phone numbers must be in **E.164 format** (e.g. `+919876543210`)
- Only **APPROVED** templates can be sent
- Contacts must be **ACTIVE** and not opted out to receive messages
- Use **Get Many → Return All** to auto-paginate large result sets

## License

MIT
