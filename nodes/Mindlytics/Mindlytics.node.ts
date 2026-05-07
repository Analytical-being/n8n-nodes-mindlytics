import {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeListSearchResult,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
} from 'n8n-workflow';

import { wbpApiRequest, wbpApiRequestAllItems } from './GenericFunctions';
import {
	BroadcastFields,
	BroadcastOperations,
	ContactFields,
	ContactOperations,
	MessageFields,
	MessageOperations,
	TemplateFields,
	TemplateOperations,
} from './descriptions';

export class Mindlytics implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Mindlytics WhatsApp Marketing',
		name: 'mindlytics',
		icon: { light: 'file:mindlytics.svg', dark: 'file:mindlytics.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Send WhatsApp messages, manage contacts, templates, and broadcasts via Mindlytics',
		defaults: { name: 'Mindlytics WhatsApp Marketing' },
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'whatsappBusinessPlatformApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Broadcast', value: 'broadcast' },
					{ name: 'Contact', value: 'contact' },
					{ name: 'Message', value: 'message' },
					{ name: 'Template', value: 'template' },
				],
				default: 'contact',
			},
			...ContactOperations,
			...ContactFields,
			...MessageOperations,
			...MessageFields,
			...TemplateOperations,
			...TemplateFields,
			...BroadcastOperations,
			...BroadcastFields,
		],
	};

	methods = {
		loadOptions: {
			async getTemplateHeaderType(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const noneOption: INodePropertyOptions[] = [{ name: 'None', value: 'none' }];
				try {
					const components = await fetchTemplateComponents.call(this);
					if (!components) return noneOption;

					const header = components.find(
						(c) => (c.type as string)?.toUpperCase() === 'HEADER',
					) as IDataObject | undefined;
					if (!header) return noneOption;

					const formatMap: Record<string, INodePropertyOptions> = {
						TEXT:     { name: 'Text',     value: 'text' },
						IMAGE:    { name: 'Image',    value: 'image' },
						VIDEO:    { name: 'Video',    value: 'video' },
						DOCUMENT: { name: 'Document', value: 'document' },
					};
					const format = ((header.format as string) ?? '').toUpperCase();
					return formatMap[format] ? [formatMap[format]] : noneOption;
				} catch {
					return noneOption;
				}
			},

			async getTemplateBodyVariableStatus(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
					const components = await fetchTemplateComponents.call(this);
					if (!components) return [{ name: 'No', value: 'no' }];

					const body = components.find(
						(c) => (c.type as string)?.toUpperCase() === 'BODY',
					) as IDataObject | undefined;
					const hasVars = typeof body?.text === 'string' && body.text.includes('{{');
					return [{ name: hasVars ? 'Yes' : 'No', value: hasVars ? 'yes' : 'no' }];
				} catch {
					return [{ name: 'No', value: 'no' }];
				}
			},

			async getTemplateNamedBodyVariableStatus(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
					try {
						const components = await fetchTemplateComponents.call(this);
						if (!components) return [{ name: 'No', value: 'no' }];

						const body = components.find(
							(c) => (c.type as string)?.toUpperCase() === 'BODY',
						) as IDataObject | undefined;
						const hasNamed = typeof body?.text === 'string' && /\{\{[a-zA-Z_]\w*\}\}/.test(body.text);
						return [{ name: hasNamed ? 'Yes' : 'No', value: hasNamed ? 'yes' : 'no' }];
					} catch {
						return [{ name: 'No', value: 'no' }];
					}
				},

			async getTemplateButtonVariableStatus(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
					const components = await fetchTemplateComponents.call(this);
					if (!components) return [{ name: 'No', value: 'no' }];

					const buttonsComponent = components.find(
						(c) => (c.type as string)?.toUpperCase() === 'BUTTONS',
					) as IDataObject | undefined;
					const buttons = (buttonsComponent?.buttons ?? []) as IDataObject[];
					const hasVars = buttons.some(
						(b) => typeof b.url === 'string' && b.url.includes('{{'),
					);
					return [{ name: hasVars ? 'Yes' : 'No', value: hasVars ? 'yes' : 'no' }];
				} catch {
					return [{ name: 'No', value: 'no' }];
				}
			},
		},
		listSearch: {
			async searchContacts(
				this: ILoadOptionsFunctions,
				filter?: string,
			): Promise<INodeListSearchResult> {
				const qs: IDataObject = { limit: 100 };
				if (filter) qs.search = filter;
				const raw = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'whatsappBusinessPlatformApi',
					{ method: 'GET', url: 'https://wbp-api.mindlytics.in/api/v1/contacts', qs, json: true },
				);
				const data = (raw.data ?? raw) as IDataObject;
				const contacts = (data.contacts ?? []) as IDataObject[];
				return {
					results: contacts.map((c) => ({
						name: ((c.name as string) || (c.phoneNumber as string) || (c.id as string)),
						value: c.id as string,
					})),
				};
			},
			async searchTemplates(
				this: ILoadOptionsFunctions,
				filter?: string,
			): Promise<INodeListSearchResult> {
				const raw = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'whatsappBusinessPlatformApi',
					{ method: 'GET', url: 'https://wbp-api.mindlytics.in/api/v1/templates', qs: { limit: 100 }, json: true },
				);
				const data = (raw.data ?? raw) as IDataObject;
				let templates = (data.templates ?? []) as IDataObject[];
				if (filter) {
					const q = filter.toLowerCase();
					templates = templates.filter((t) => (t.name as string)?.toLowerCase().includes(q));
				}
				return {
					results: templates.map((t) => ({
						name: t.name as string,
						value: t.id as string,
					})),
				};
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			let result: IDataObject | IDataObject[];

			if (resource === 'contact') {
				result = await handleContact.call(this, operation, i);
			} else if (resource === 'message') {
				result = await handleMessage.call(this, operation, i);
			} else if (resource === 'template') {
				result = await handleTemplate.call(this, operation, i);
			} else if (resource === 'broadcast') {
				result = await handleBroadcast.call(this, operation, i);
			} else {
				result = {};
			}

			if (Array.isArray(result)) {
				returnData.push(...result.map((r) => ({ json: r })));
			} else {
				returnData.push({ json: result });
			}
		}

		return [returnData];
	}
}

// ─── CONTACT HANDLERS ────────────────────────────────────────────────────────

async function handleContact(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'create') {
		const phoneNumber = this.getNodeParameter('phoneNumber', i) as string;
		const additional = this.getNodeParameter('additionalFields', i) as IDataObject;

		const body: IDataObject = { phoneNumber };
		if (additional.name) body.name = additional.name;
		if (additional.email) body.email = additional.email;
		if (additional.tags) {
			body.tags = splitCommaList(additional.tags as string);
		}
		if (additional.customFields) {
			body.customFields = parseJsonField(additional.customFields);
		}

		return wbpApiRequest.call(this, 'POST', '/api/v1/contacts', body);
	}

	if (operation === 'get') {
		const contactId = this.getNodeParameter('contactId', i) as string;
		return wbpApiRequest.call(this, 'GET', `/api/v1/contacts/${contactId}`);
	}

	if (operation === 'getAll') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		const filters = this.getNodeParameter('filters', i) as IDataObject;
		const qs = stripEmpty({
			search: filters.search,
			status: filters.status,
			tag: filters.tag,
			sortBy: filters.sortBy,
			sortOrder: filters.sortOrder,
			offset: filters.offset,
		});

		if (returnAll) {
			return wbpApiRequestAllItems.call(this, 'GET', '/api/v1/contacts', 'contacts', {}, qs);
		}

		const limit = this.getNodeParameter('limit', i) as number;
		const response = (await wbpApiRequest.call(this, 'GET', '/api/v1/contacts', {}, {
			...qs,
			limit,
		})) as IDataObject;
		return (response.contacts as IDataObject[]) ?? [];
	}

	if (operation === 'update') {
		const contactId = this.getNodeParameter('contactId', i) as string;
		const fields = this.getNodeParameter('updateFields', i) as IDataObject;

		const body: IDataObject = {};
		if (fields.name) body.name = fields.name;
		if (fields.email) body.email = fields.email;
		if (fields.tags) body.tags = splitCommaList(fields.tags as string);
		if (fields.customFields) body.customFields = parseJsonField(fields.customFields);
		if (fields.status) body.status = fields.status;

		return wbpApiRequest.call(this, 'PATCH', `/api/v1/contacts/${contactId}`, body);
	}

	if (operation === 'delete') {
		const contactId = this.getNodeParameter('contactId', i) as string;
		await wbpApiRequest.call(this, 'DELETE', `/api/v1/contacts/${contactId}`);
		return { success: true };
	}

	if (operation === 'bulkImport') {
		const raw = this.getNodeParameter('contacts', i);
		const contacts = typeof raw === 'string' ? JSON.parse(raw) : raw;
		return wbpApiRequest.call(this, 'POST', '/api/v1/contacts/bulk', { contacts });
	}

	return {};
}

// ─── MESSAGE HANDLERS ────────────────────────────────────────────────────────

async function handleMessage(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject> {
	if (operation === 'get') {
		const messageId = this.getNodeParameter('messageId', i) as string;
		return wbpApiRequest.call(this, 'GET', `/api/v1/messages/${messageId}`);
	}

	if (operation === 'sendTemplate') {
		const contactLocator = this.getNodeParameter('contactId', i) as IDataObject;
		const templateId = this.getNodeParameter('templateId', i, '', { extractValue: true }) as string;
		const headerType = this.getNodeParameter('headerType', i) as string;
		const hasBodyVariables = this.getNodeParameter('hasBodyVariables', i) as string;
		const hasNamedBodyVariables = this.getNodeParameter('hasNamedBodyVariables', i) as string;
		const hasButtonVariables = this.getNodeParameter('hasButtonVariables', i) as string;
		const bodyVariables = hasBodyVariables === 'yes'
			? this.getNodeParameter('bodyVariables', i) as IDataObject
			: {};
		const namedBodyVariables = hasNamedBodyVariables === 'yes'
			? this.getNodeParameter('namedBodyVariables', i) as IDataObject
			: {};
		const buttonVariables = hasButtonVariables === 'yes'
			? this.getNodeParameter('buttonVariables', i) as IDataObject
			: {};

		const body: IDataObject = { templateId };
		if (contactLocator.mode === 'phone') {
			body.phoneNumber = contactLocator.value as string;
		} else {
			body.contactId = contactLocator.value as string;
		}

		const parameters: IDataObject = {};

		if (headerType === 'text') {
			const headerVariable = this.getNodeParameter('headerVariable', i) as string;
			if (headerVariable) parameters.header = [headerVariable];
		} else if (headerType === 'image' || headerType === 'video' || headerType === 'document') {
			const headerMediaUrl = this.getNodeParameter('headerMediaUrl', i) as string;
			if (headerMediaUrl) parameters.headerMediaUrl = headerMediaUrl;
		}

		const bodyArr = extractFixedCollectionValues(bodyVariables, 'values');
		if (bodyArr.length) parameters.body = bodyArr;

		const namedBodyItems = (namedBodyVariables.values as IDataObject[]) ?? [];
		if (namedBodyItems.length) {
			parameters.namedBody = Object.fromEntries(
				namedBodyItems.map((item) => [String(item.name ?? ''), String(item.value ?? '')]),
			);
		}

		const buttonArr = extractFixedCollectionValues(buttonVariables, 'values');
		if (buttonArr.length) parameters.buttons = buttonArr;

		if (Object.keys(parameters).length) body.parameters = parameters;

		return wbpApiRequest.call(this, 'POST', '/api/v1/messages/template', body);
	}

	return {};
}

// ─── TEMPLATE HANDLERS ───────────────────────────────────────────────────────

async function handleTemplate(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'get') {
		const templateId = this.getNodeParameter('templateId', i) as string;
		return wbpApiRequest.call(this, 'GET', `/api/v1/templates/${templateId}`);
	}

	if (operation === 'getAll') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		const filters = this.getNodeParameter('filters', i) as IDataObject;
		const qs = stripEmpty({
			category: filters.category,
			language: filters.language,
			offset: filters.offset,
		});

		if (returnAll) {
			return wbpApiRequestAllItems.call(this, 'GET', '/api/v1/templates', 'templates', {}, qs);
		}

		const limit = this.getNodeParameter('limit', i) as number;
		const response = (await wbpApiRequest.call(this, 'GET', '/api/v1/templates', {}, {
			...qs,
			limit,
		})) as IDataObject;
		return (response.templates as IDataObject[]) ?? [];
	}

	return {};
}

// ─── BROADCAST HANDLERS ──────────────────────────────────────────────────────

async function handleBroadcast(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'get') {
		const broadcastId = this.getNodeParameter('broadcastId', i) as string;
		return wbpApiRequest.call(this, 'GET', `/api/v1/broadcasts/${broadcastId}`);
	}

	if (operation === 'getAll') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		const filters = this.getNodeParameter('filters', i) as IDataObject;
		const qs = stripEmpty({
			status: filters.status,
			offset: filters.offset,
		});

		if (returnAll) {
			return wbpApiRequestAllItems.call(this, 'GET', '/api/v1/broadcasts/', 'broadcasts', {}, qs);
		}

		const limit = this.getNodeParameter('limit', i) as number;
		const response = (await wbpApiRequest.call(this, 'GET', '/api/v1/broadcasts/', {}, {
			...qs,
			limit,
		})) as IDataObject;
		return (response.broadcasts as IDataObject[]) ?? [];
	}

	if (operation === 'create') {
		const templateId = this.getNodeParameter('templateId', i, '', { extractValue: true }) as string;
		const audienceRaw = this.getNodeParameter('audience', i) as IDataObject;
		const options = this.getNodeParameter('additionalOptions', i) as IDataObject;

		const audience: IDataObject = {};
		if (audienceRaw.tagIds) {
			audience.tagIds = splitCommaList(audienceRaw.tagIds as string);
		}
		if (audienceRaw.language) audience.language = audienceRaw.language;
		if (audienceRaw.timezone) audience.timezone = audienceRaw.timezone;
		if (audienceRaw.source) audience.source = audienceRaw.source;
		if (audienceRaw.email) audience.email = audienceRaw.email;
		if (audienceRaw.customFields) {
			audience.customFields = parseJsonField(audienceRaw.customFields);
		}

		const body: IDataObject = { templateId, audience };

		if (options.name) body.name = options.name;
		if (options.scheduledAt) body.scheduledAt = options.scheduledAt;

		const bodyArr = extractFixedCollectionValues(options.bodyParams as IDataObject, 'values');
		const headerArr = extractFixedCollectionValues(options.headerParams as IDataObject, 'values');
		if (bodyArr.length || headerArr.length) {
			const parameters: IDataObject = {};
			if (bodyArr.length) parameters.body = bodyArr;
			if (headerArr.length) parameters.header = headerArr;
			body.parameters = parameters;
		}

		const mappingsRaw = options.contactFieldMappings as IDataObject | undefined;
		if (mappingsRaw?.mappings) {
			body.contactFieldMappings = (mappingsRaw.mappings as IDataObject[]).map((m) =>
				stripEmpty({
					apiKey: m.apiKey as string,
					contactField: m.contactField as string,
					fallbackValue: m.fallbackValue as string,
				}),
			);
		}

		return wbpApiRequest.call(this, 'POST', '/api/v1/broadcasts', body);
	}

	return {};
}

// ─── UTILITIES ───────────────────────────────────────────────────────────────

function stripEmpty(obj: IDataObject): IDataObject {
	return Object.fromEntries(
		Object.entries(obj).filter(([, v]) => v !== undefined && v !== '' && v !== null),
	);
}

function splitCommaList(value: string): string[] {
	return value
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
}

function parseJsonField(value: unknown): IDataObject {
	if (typeof value === 'object' && value !== null) return value as IDataObject;
	if (typeof value === 'string') {
		try {
			return JSON.parse(value);
		} catch {
			return {};
		}
	}
	return {};
}

function extractFixedCollectionValues(
	collection: IDataObject | undefined,
	groupKey: string,
): string[] {
	if (!collection || !collection[groupKey]) return [];
	return (collection[groupKey] as IDataObject[]).map((v) => v.value as string);
}

async function fetchTemplateComponents(
	this: ILoadOptionsFunctions,
): Promise<IDataObject[] | null> {
	const templateIdRaw = this.getCurrentNodeParameter('templateId') as IDataObject | undefined;
	const templateId = (templateIdRaw?.value as string) || '';
	if (!templateId) return null;

	const response = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'whatsappBusinessPlatformApi',
		{ method: 'GET', url: `https://wbp-api.mindlytics.in/api/v1/templates/${templateId}`, json: true },
	) as IDataObject;

	const data = (response.data ?? response) as IDataObject;
	const template = (data.template ?? data) as IDataObject;
	return (template.components ?? []) as IDataObject[];
}
