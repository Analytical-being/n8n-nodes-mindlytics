import {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	JsonObject,
	NodeApiError,
} from 'n8n-workflow';

export async function wbpApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<IDataObject> {
	const options: {
		method: IHttpRequestMethods;
		url: string;
		json: boolean;
		body?: IDataObject;
		qs?: IDataObject;
	} = {
		method,
		url: `https://wbp-api.mindlytics.in${endpoint}`,
		json: true,
	};

	if (Object.keys(body).length) options.body = body;
	if (Object.keys(qs).length) options.qs = qs;

	try {
		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'whatsappBusinessPlatformApi',
			options,
		);
		return ((response as IDataObject).data ?? {}) as IDataObject;
	} catch (error) {
		const err = error as { response?: { body?: IDataObject }; message?: string };
		const errorBody = err.response?.body;
		const errorObj = errorBody?.error as IDataObject | undefined;
		const message = (errorObj?.message as string) ?? err.message;
		throw new NodeApiError(this.getNode(), error as JsonObject, { message });
	}
}

export async function wbpApiRequestAllItems(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	itemsKey: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<IDataObject[]> {
	const results: IDataObject[] = [];
	let offset = 0;
	const limit = 100;

	while (true) {
		const response = await wbpApiRequest.call(this, method, endpoint, body, {
			...qs,
			limit,
			offset,
		});

		const items = (response[itemsKey] as IDataObject[]) ?? [];
		results.push(...items);
		offset += limit;

		const pagination = response.pagination as IDataObject | undefined;
		if (!pagination?.hasMore) break;
	}

	return results;
}
