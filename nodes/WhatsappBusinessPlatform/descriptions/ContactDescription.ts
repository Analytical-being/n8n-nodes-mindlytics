import { INodeProperties } from 'n8n-workflow';

export const ContactOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['contact'] } },
		options: [
			{
				name: 'Bulk Import',
				value: 'bulkImport',
				description: 'Import up to 1000 contacts at once',
				action: 'Bulk import contacts',
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new contact',
				action: 'Create a contact',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a contact',
				action: 'Delete a contact',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a contact by ID',
				action: 'Get a contact',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many contacts',
				action: 'Get many contacts',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a contact',
				action: 'Update a contact',
			},
		],
		default: 'create',
	},
];

export const ContactFields: INodeProperties[] = [
	// ─── CREATE ──────────────────────────────────────────────────────────────
	{
		displayName: 'Phone Number',
		name: 'phoneNumber',
		type: 'string',
		required: true,
		default: '',
		placeholder: '+919876543210',
		description: 'Phone number in E.164 format (e.g. +919876543210)',
		displayOptions: { show: { resource: ['contact'], operation: ['create'] } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['contact'], operation: ['create'] } },
		options: [
			{
				displayName: 'Custom Fields (JSON)',
				name: 'customFields',
				type: 'json',
				default: '{}',
				description: 'Key-value pairs for custom contact fields, e.g. {"plan":"premium"}',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Tags',
				name: 'tags',
				type: 'string',
				default: '',
				placeholder: 'vip, customer, premium',
				description: 'Comma-separated list of tags to assign to the contact',
			},
		],
	},

	// ─── GET / UPDATE / DELETE ────────────────────────────────────────────────
	{
		displayName: 'Contact ID',
		name: 'contactId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['contact'], operation: ['get', 'update', 'delete'] } },
	},

	// ─── GET ALL ─────────────────────────────────────────────────────────────
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: { resource: ['contact'], operation: ['getAll'] } },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 100 },
		default: 20,
		description: 'Max number of results to return',
		displayOptions: {
			show: { resource: ['contact'], operation: ['getAll'], returnAll: [false] },
		},
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource: ['contact'], operation: ['getAll'] } },
		options: [
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				typeOptions: { minValue: 0 },
				default: 0,
				description: 'Number of results to skip for manual pagination',
			},
			{
				displayName: 'Search',
				name: 'search',
				type: 'string',
				default: '',
				description: 'Search contacts by name, phone number, or email',
			},
			{
				displayName: 'Sort By',
				name: 'sortBy',
				type: 'options',
				options: [
					{ name: 'Created At', value: 'createdAt' },
					{ name: 'Last Seen', value: 'lastSeen' },
					{ name: 'Name', value: 'name' },
					{ name: 'Phone Number', value: 'phoneNumber' },
				],
				default: 'createdAt',
			},
			{
				displayName: 'Sort Order',
				name: 'sortOrder',
				type: 'options',
				options: [
					{ name: 'Ascending', value: 'asc' },
					{ name: 'Descending', value: 'desc' },
				],
				default: 'desc',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Active', value: 'ACTIVE' },
					{ name: 'Blocked', value: 'BLOCKED' },
					{ name: 'Inactive', value: 'INACTIVE' },
					{ name: 'Opted Out', value: 'OPTED_OUT' },
				],
				default: 'ACTIVE',
			},
			{
				displayName: 'Tag ID',
				name: 'tag',
				type: 'string',
				default: '',
				description: 'Filter contacts by tag UUID',
			},
		],
	},

	// ─── UPDATE ───────────────────────────────────────────────────────────────
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['contact'], operation: ['update'] } },
		options: [
			{
				displayName: 'Custom Fields (JSON)',
				name: 'customFields',
				type: 'json',
				default: '{}',
				description: 'Key-value pairs for custom contact fields',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Active', value: 'ACTIVE' },
					{ name: 'Blocked', value: 'BLOCKED' },
					{ name: 'Inactive', value: 'INACTIVE' },
					{ name: 'Opted Out', value: 'OPTED_OUT' },
				],
				default: 'ACTIVE',
			},
			{
				displayName: 'Tags',
				name: 'tags',
				type: 'string',
				default: '',
				placeholder: 'vip, customer',
				description: 'Comma-separated list of tags (replaces existing tags)',
			},
		],
	},

	// ─── BULK IMPORT ──────────────────────────────────────────────────────────
	{
		displayName: 'Contacts (JSON)',
		name: 'contacts',
		type: 'json',
		required: true,
		default: '[]',
		description:
			'Array of contact objects to import. Maximum 1000 per request. Each object must include a phoneNumber in E.164 format. Example: [{"phoneNumber":"+919876543210","name":"John Doe"}]',
		displayOptions: { show: { resource: ['contact'], operation: ['bulkImport'] } },
	},
];
