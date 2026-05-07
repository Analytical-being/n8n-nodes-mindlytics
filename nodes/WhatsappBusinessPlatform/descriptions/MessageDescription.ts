import { INodeProperties } from 'n8n-workflow';

export const MessageOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['message'] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Get delivery status of a message',
				action: 'Get a message',
			},
			{
				name: 'Send Template',
				value: 'sendTemplate',
				description: 'Send a WhatsApp template message to a contact',
				action: 'Send a template message',
			},
		],
		default: 'sendTemplate',
	},
];

export const MessageFields: INodeProperties[] = [
	// ─── GET ─────────────────────────────────────────────────────────────────
	{
		displayName: 'Message ID',
		name: 'messageId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['message'], operation: ['get'] } },
	},

	// ─── SEND TEMPLATE ───────────────────────────────────────────────────────
	{
		displayName: 'Contact',
		name: 'contactId',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		description: 'Contact to send the message to (must be ACTIVE and not opted out)',
		displayOptions: { show: { resource: ['message'], operation: ['sendTemplate'] } },
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: { searchListMethod: 'searchContacts', searchable: true },
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. contact_abc123',
			},
		],
	},
	{
		displayName: 'Template',
		name: 'templateId',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		description: 'Approved template to send',
		displayOptions: { show: { resource: ['message'], operation: ['sendTemplate'] } },
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: { searchListMethod: 'searchTemplates', searchable: true },
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. template_abc123',
			},
		],
	},

	// ─── HEADER ───────────────────────────────────────────────────────────────
	{
		displayName: 'Header Type',
		name: 'headerType',
		type: 'options',
		default: 'none',
		description: 'Fetched automatically from the selected template. Select a template first, then refresh this field.',
		displayOptions: { show: { resource: ['message'], operation: ['sendTemplate'] } },
		typeOptions: {
			loadOptionsMethod: 'getTemplateHeaderType',
			loadOptionsDependsOn: ['templateId'],
		},
	},
	{
		displayName: 'Header Variable',
		name: 'headerVariable',
		type: 'string',
		default: '',
		description: 'Value for the {{1}} variable in the template text header',
		displayOptions: {
			show: { resource: ['message'], operation: ['sendTemplate'], headerType: ['text'] },
		},
	},
	{
		displayName: 'Header Media URL',
		name: 'headerMediaUrl',
		type: 'string',
		default: '',
		placeholder: 'https://example.com/image.jpg',
		description: 'Publicly accessible URL of the media file used in the template header',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				headerType: ['image', 'video', 'document'],
			},
		},
	},

	// ─── BODY VARIABLES ───────────────────────────────────────────────────────
	{
		displayName: 'Has Body Variables',
		name: 'hasBodyVariables',
		type: 'options',
		default: 'no',
		description: 'Auto-detected from the selected template',
		displayOptions: { show: { resource: ['message'], operation: ['sendTemplate'] } },
		typeOptions: {
			loadOptionsMethod: 'getTemplateBodyVariableStatus',
			loadOptionsDependsOn: ['templateId'],
		},
	},
	{
		displayName: 'Body Variables',
		name: 'bodyVariables',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		default: {},
		description: 'Values for {{1}}, {{2}}, … placeholders in the template body, in order',
		displayOptions: {
			show: { resource: ['message'], operation: ['sendTemplate'], hasBodyVariables: ['yes'] },
		},
		options: [
			{
				name: 'values',
				displayName: 'Variable',
				values: [
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Replacement value for the next body placeholder in order',
					},
				],
			},
		],
	},

	// ─── BUTTON VARIABLES ────────────────────────────────────────────────────
	{
		displayName: 'Has Button Variables',
		name: 'hasButtonVariables',
		type: 'options',
		default: 'no',
		description: 'Auto-detected from the selected template',
		displayOptions: { show: { resource: ['message'], operation: ['sendTemplate'] } },
		typeOptions: {
			loadOptionsMethod: 'getTemplateButtonVariableStatus',
			loadOptionsDependsOn: ['templateId'],
		},
	},
	{
		displayName: 'Button Variables',
		name: 'buttonVariables',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		default: {},
		description: 'Dynamic URL suffix values for call-to-action buttons in the template, in order',
		displayOptions: {
			show: { resource: ['message'], operation: ['sendTemplate'], hasButtonVariables: ['yes'] },
		},
		options: [
			{
				name: 'values',
				displayName: 'Button',
				values: [
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Dynamic URL suffix for the next button in order',
					},
				],
			},
		],
	},
];
