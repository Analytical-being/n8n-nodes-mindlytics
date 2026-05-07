import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class WhatsappBusinessPlatformApi implements ICredentialType {
	name = 'whatsappBusinessPlatformApi';
	displayName = 'Mindlytics API';
	documentationUrl = 'https://docs.mindlytics.in/';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			placeholder: 'wbp_api_...',
			required: true,
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://wbp-api.mindlytics.in',
			url: '/api/v1/templates',
			qs: { limit: 1 },
		},
	};
}
