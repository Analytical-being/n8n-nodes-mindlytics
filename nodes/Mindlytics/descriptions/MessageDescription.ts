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
		description: 'Contact to send the message to. Use "By Phone Number" to send without a pre-existing contact — one will be created automatically.',
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
			{
				displayName: 'By Phone Number',
				name: 'phone',
				type: 'string',
				placeholder: '+919876543210',
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

	// ─── TEMPLATE VARIABLES (auto-generated from template structure) ──────────
	{
		displayName: 'Template Variables',
		name: 'templateVariables',
		type: 'resourceMapper',
		default: { mappingMode: 'defineBelow', value: null },
		noDataExpression: true,
		description: 'Variable values required by the selected template. Fields are auto-detected from the template — select a template first, then click Refresh.',
		displayOptions: { show: { resource: ['message'], operation: ['sendTemplate'] } },
		typeOptions: {
			resourceMapper: {
				resourceMapperMethod: 'getTemplateFields',
				mode: 'add',
				fieldWords: { singular: 'variable', plural: 'variables' },
				addAllFields: true,
				noFieldsError: 'This template has no variable placeholders',
			},
		},
	},
];
