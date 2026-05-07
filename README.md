# n8n-nodes-mindlytics

An [n8n](https://n8n.io) community node for **[Mindlytics](https://mindlytics.in)** — send WhatsApp template messages, manage contacts, templates, and run broadcast campaigns, all from your n8n workflows.

## Resources

| Resource | Operations |
|---|---|
| **Contact** | Create, Get, Get Many, Update, Delete, Bulk Import |
| **Message** | Send Template, Get |
| **Template** | Get Many |
| **Broadcast** | Create, Get, Get Many |

## Installation

In your n8n instance go to **Settings → Community Nodes**, click **Install**, and enter:

```
n8n-nodes-mindlytics
```

## Credentials

After installation, create a **Mindlytics API** credential:

| Field | Description |
|---|---|
| **API Key** | Generate one in your Mindlytics dashboard under **Settings → API Keys** (format: `wbp_api_...`) |

## Usage Examples

### Send a Template Message

1. Set Resource → **Message**, Operation → **Send Template**
2. Pick a contact **From List**, enter a **Contact ID**, or enter a **Phone Number** directly (the contact is created automatically if it doesn't exist)
3. Pick a **Template** and fill in any header / body / button variables

### Bulk Import Contacts

1. Set Resource → **Contact**, Operation → **Bulk Import**
2. Provide a JSON array:

```json
[
  { "phoneNumber": "+919876543210", "name": "John Doe", "tags": ["vip"] },
  { "phoneNumber": "+919876543211", "name": "Jane Smith" }
]
```

### Create a Broadcast Campaign

1. Set Resource → **Broadcast**, Operation → **Create**
2. Choose a Template
3. Set at least one **Audience** filter (Tag IDs, Language, Source, etc.)
4. Optionally add static parameters or per-contact field mappings for personalisation

### List Broadcasts

1. Set Resource → **Broadcast**, Operation → **Get Many**
2. Filter by status (Sent, Scheduled, Failed, …) or enable **Return All** to auto-paginate

## Notes

- Phone numbers must be in **E.164 format** (e.g. `+919876543210`) or without the leading `+` (e.g. `919876543210`) — the API adds it automatically
- Only **APPROVED** templates can be sent
- Contacts must be **ACTIVE** and not opted out to receive messages
- **Get Many** operations support **Return All** to auto-paginate large result sets

## Links

- [Mindlytics](https://mindlytics.in)
- [API Reference](https://wbp-api.mindlytics.in/api/v1/openapi.json)
- [n8n Community Nodes docs](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE)
