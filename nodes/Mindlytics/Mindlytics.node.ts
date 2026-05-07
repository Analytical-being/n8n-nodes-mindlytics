import {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeListSearchResult,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
	ResourceMapperField,
	ResourceMapperFields,
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

		resourceMapping: {
			async getTemplateFields(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
				const templateIdRaw = this.getCurrentNodeParameter('templateId') as IDataObject | undefined;
				const templateId = (templateIdRaw?.value as string) || '';
				if (!templateId) {
					return {
						fields: [],
						emptyFieldsNotice: 'Select a template above to see its variables',
					};
				}

				const components = await fetchTemplateComponents.call(this, templateId);
				const fields: ResourceMapperField[] = [];

				// ── Header ───────────────────────────────────────────────────────
				const header = components.find(
					(c) => (c.type as string)?.toUpperCase() === 'HEADER',
				) as IDataObject | undefined;

				if (header) {
					const format = ((header.format as string) ?? '').toUpperCase();
					if (format === 'TEXT') {
						const hasVar = typeof header.text === 'string' && header.text.includes('{{');
						if (hasVar) {
							fields.push({
								id: 'header_text_var',
								displayName: 'Header — Text Variable ({{1}})',
								required: true,
								defaultMatch: false,
								display: true,
								type: 'string',
								canBeUsedToMatch: false,
							});
						}
					} else if (format === 'IMAGE' || format === 'VIDEO' || format === 'DOCUMENT') {
						const label = format.charAt(0) + format.slice(1).toLowerCase();
						fields.push({
							id: 'header_media_url',
							displayName: `Header — ${label} URL`,
							required: true,
							defaultMatch: false,
							display: true,
							type: 'string',
							canBeUsedToMatch: false,
						});
					}
				}

				// ── Body ─────────────────────────────────────────────────────────
				const body = components.find(
					(c) => (c.type as string)?.toUpperCase() === 'BODY',
				) as IDataObject | undefined;

				if (body) {
					const bodyText = (body.text as string) ?? '';
					const namedMatches = [...bodyText.matchAll(/\{\{([a-zA-Z_]\w*)\}\}/g)];

					if (namedMatches.length) {
						for (const match of namedMatches) {
							fields.push({
								id: `body_named_${match[1]}`,
								displayName: `Body — {{${match[1]}}}`,
								required: true,
								defaultMatch: false,
								display: true,
								type: 'string',
								canBeUsedToMatch: false,
							});
						}
					} else {
						const positionalNums = [
							...new Set(
								[...bodyText.matchAll(/\{\{(\d+)\}\}/g)].map((m) => parseInt(m[1], 10)),
							),
						].sort((a, b) => a - b);

						for (const num of positionalNums) {
							fields.push({
								id: `body_${num}`,
								displayName: `Body — {{${num}}}`,
								required: true,
								defaultMatch: false,
								display: true,
								type: 'string',
								canBeUsedToMatch: false,
							});
						}
					}
				}

				// ── Buttons ──────────────────────────────────────────────────────
				const buttonsComp = components.find(
					(c) => (c.type as string)?.toUpperCase() === 'BUTTONS',
				) as IDataObject | undefined;

				if (buttonsComp) {
					const buttons = (buttonsComp.buttons ?? []) as IDataObject[];
					let dynIdx = 1;
					for (const btn of buttons) {
						if (typeof btn.url === 'string' && btn.url.includes('{{')) {
							fields.push({
								id: `button_${dynIdx}`,
								displayName: `Button ${dynIdx} — Dynamic URL Suffix`,
								required: true,
								defaultMatch: false,
								display: true,
								type: 'string',
								canBeUsedToMatch: false,
							});
							dynIdx++;
						}
					}
				}

				return { fields };
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
		const templateVars = this.getNodeParameter('templateVariables', i) as {
			value: Record<string, string | null> | null;
		};
		const vars = templateVars.value ?? {};

		const body: IDataObject = { templateId };
		if (contactLocator.mode === 'phone') {
			body.phoneNumber = contactLocator.value as string;
		} else {
			body.contactId = contactLocator.value as string;
		}

		const parameters: IDataObject = {};

		// Header text variable
		if (vars.header_text_var) {
			parameters.header = [vars.header_text_var];
		}

		// Header media URL
		if (vars.header_media_url) {
			parameters.headerMediaUrl = vars.header_media_url;
		}

		// Positional body variables (body_1, body_2, …)
		const bodyArr: string[] = [];
		for (let n = 1; vars[`body_${n}`] !== undefined; n++) {
			bodyArr.push(String(vars[`body_${n}`] ?? ''));
		}
		if (bodyArr.length) parameters.body = bodyArr;

		// Named body variables (body_named_<name>)
		const namedBody: Record<string, string> = {};
		for (const [key, val] of Object.entries(vars)) {
			if (key.startsWith('body_named_')) {
				namedBody[key.slice('body_named_'.length)] = String(val ?? '');
			}
		}
		if (Object.keys(namedBody).length) parameters.namedBody = namedBody;

		// Button dynamic URL suffixes (button_1, button_2, …)
		const buttonArr: string[] = [];
		for (let n = 1; vars[`button_${n}`] !== undefined; n++) {
			buttonArr.push(String(vars[`button_${n}`] ?? ''));
		}
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
	templateId: string,
): Promise<IDataObject[]> {
	// Try the individual template endpoint first (may not be officially documented)
	try {
		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'whatsappBusinessPlatformApi',
			{ method: 'GET', url: `https://wbp-api.mindlytics.in/api/v1/templates/${templateId}`, json: true },
		) as IDataObject;

		const data = (response.data ?? response) as IDataObject;
		const tmpl = (data.template ?? data) as IDataObject;
		const parsed = parseComponentData(tmpl);
		if (parsed.length) return parsed;
	} catch {
		// fall through to list approach
	}

	// Fall back to the documented list endpoint and find by ID
	const listResponse = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'whatsappBusinessPlatformApi',
		{ method: 'GET', url: 'https://wbp-api.mindlytics.in/api/v1/templates', qs: { limit: 500 }, json: true },
	) as IDataObject;

	const listData = (listResponse.data ?? listResponse) as IDataObject;
	const templates = (listData.templates ?? []) as IDataObject[];
	const found = templates.find((t) => t.id === templateId);
	return found ? parseComponentData(found) : [];
}

function parseComponentData(template: IDataObject): IDataObject[] {
	// Format 1: top-level `components` array (WhatsApp standard)
	if (Array.isArray(template.components)) {
		return template.components as IDataObject[];
	}

	const cd = template.componentData;
	if (!cd) return [];

	// Format 2: componentData is already an array
	if (Array.isArray(cd)) {
		return cd as IDataObject[];
	}

	if (typeof cd !== 'object') return [];
	const cdObj = cd as Record<string, unknown>;

	// Format 3: componentData has a nested `components` array
	if (Array.isArray(cdObj.components)) {
		return cdObj.components as IDataObject[];
	}

	// Format 4: componentData is an object with named keys
	// e.g. { header: { format: 'IMAGE' }, body: { text: '...' }, buttons: [...] }
	const result: IDataObject[] = [];
	for (const [key, val] of Object.entries(cdObj)) {
		const typeKey = key.toUpperCase();
		if (typeKey === 'BUTTONS' && Array.isArray(val)) {
			result.push({ type: 'BUTTONS', buttons: val });
		} else if (val && typeof val === 'object' && !Array.isArray(val)) {
			result.push({ ...(val as IDataObject), type: typeKey });
		}
	}
	return result;
}
