import { INodeProperties } from 'n8n-workflow';

export const BroadcastOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['broadcast'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create and trigger a broadcast campaign',
				action: 'Create a broadcast',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get broadcast status and analytics',
				action: 'Get a broadcast',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'List broadcast campaigns',
				action: 'Get many broadcasts',
			},
		],
		default: 'create',
	},
];

export const BroadcastFields: INodeProperties[] = [
	// ─── GET ─────────────────────────────────────────────────────────────────
	{
		displayName: 'Broadcast ID',
		name: 'broadcastId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['broadcast'], operation: ['get'] } },
	},

	// ─── GET ALL ─────────────────────────────────────────────────────────────
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: { resource: ['broadcast'], operation: ['getAll'] } },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 50,
		description: 'Max number of results to return',
		displayOptions: {
			show: { resource: ['broadcast'], operation: ['getAll'], returnAll: [false] },
		},
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource: ['broadcast'], operation: ['getAll'] } },
		options: [
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Cancelled', value: 'CANCELLED' },
					{ name: 'Draft', value: 'DRAFT' },
					{ name: 'Failed', value: 'FAILED' },
					{ name: 'Paused', value: 'PAUSED' },
					{ name: 'Queued', value: 'QUEUED' },
					{ name: 'Scheduled', value: 'SCHEDULED' },
					{ name: 'Sending', value: 'SENDING' },
					{ name: 'Sent', value: 'SENT' },
				],
				default: 'SENT',
				description: 'Filter by broadcast status',
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				typeOptions: { minValue: 0 },
				default: 0,
				description: 'Number of results to skip for manual pagination',
			},
		],
	},

	// ─── CREATE ──────────────────────────────────────────────────────────────
	{
		displayName: 'Template',
		name: 'templateId',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		description: 'Approved template to use for this broadcast',
		displayOptions: { show: { resource: ['broadcast'], operation: ['create'] } },
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'searchTemplates',
					searchable: true,
				},
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. template_abc123',
			},
		],
	},
	{
		displayName: 'Audience',
		name: 'audience',
		type: 'collection',
		placeholder: 'Add Audience Filter',
		default: {},
		required: true,
		description:
			'Define who receives this broadcast. At least one filter is required. Filters are combined with AND logic.',
		displayOptions: { show: { resource: ['broadcast'], operation: ['create'] } },
		options: [
			{
				displayName: 'Custom Fields Filter (JSON)',
				name: 'customFields',
				type: 'json',
				default: '{}',
				description: 'Filter by custom field values, e.g. {"plan":"premium"}',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				description: 'Filter contacts by exact email match',
			},
			{
				displayName: 'Language',
				name: 'language',
				type: 'string',
				default: '',
				placeholder: 'en',
				description: 'Filter contacts by language code',
			},
			{
				displayName: 'Source',
				name: 'source',
				type: 'options',
				options: [
					{ name: 'API', value: 'API' },
					{ name: 'Broadcast', value: 'BROADCAST' },
					{ name: 'Chat', value: 'CHAT' },
					{ name: 'Google Sheets', value: 'GOOGLE_SHEETS' },
					{ name: 'Import', value: 'IMPORT' },
					{ name: 'Manual', value: 'MANUAL' },
					{ name: 'Shopify', value: 'SHOPIFY' },
					{ name: 'Webhook', value: 'WEBHOOK' },
				],
				default: 'MANUAL',
				description: 'Filter contacts by how they were added',
			},
			{
				displayName: 'Tag IDs',
				name: 'tagIds',
				type: 'string',
				default: '',
				placeholder: 'uuid1, uuid2',
				description: 'Comma-separated list of tag UUIDs to target',
			},
			{
				displayName: 'Timezone',
				name: 'timezone',
				type: 'string',
				default: '',
				placeholder: 'Asia/Kolkata',
				description: 'Filter contacts by timezone (IANA format)',
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['broadcast'], operation: ['create'] } },
		options: [
			{
				displayName: 'Body Parameters',
				name: 'bodyParams',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: {},
				description: 'Static values for {{1}}, {{2}}, … body placeholders (in order)',
				options: [
					{
						name: 'values',
						displayName: 'Values',
						values: [
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
							},
						],
					},
				],
			},
			{
				displayName: 'Broadcast Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Display name for this campaign. Auto-generated if left empty.',
			},
			{
				displayName: 'Contact Field Mappings',
				name: 'contactFieldMappings',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: {},
				description:
					'Map template parameters to per-contact field values for personalisation',
				options: [
					{
						name: 'mappings',
						displayName: 'Mapping',
						values: [
							{
								displayName: 'Parameter Key',
								name: 'apiKey',
								type: 'string',
								typeOptions: { password: true },
								default: '',
								placeholder: 'param_1',
								description:
									'Template parameter key (param_1, header_param_1, button_0_url_1, …)',
							},
							{
								displayName: 'Contact Field',
								name: 'contactField',
								type: 'string',
								default: '',
								placeholder: 'customField.discountCode',
								description:
									'Contact field to read from (name, email, customField.fieldName)',
							},
							{
								displayName: 'Fallback Value',
								name: 'fallbackValue',
								type: 'string',
								default: '',
								description: 'Value to use when the contact field is empty',
							},
						],
					},
				],
			},
			{
				displayName: 'Header Parameters',
				name: 'headerParams',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: {},
				description: 'Static values for header placeholders (e.g. image URL)',
				options: [
					{
						name: 'values',
						displayName: 'Values',
						values: [
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
							},
						],
					},
				],
			},
			{
				displayName: 'Scheduled At',
				name: 'scheduledAt',
				type: 'dateTime',
				default: '',
				description: 'Schedule the broadcast for a future date/time. Leave empty to send immediately.',
			},
		],
	},
];
