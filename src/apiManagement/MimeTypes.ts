export function parseApiMimeType(contentTypeHeader: string): ApiMimeType {
    switch (contentTypeHeader.toLowerCase()) {
        case 'application/json':
            return ApiMimeType.ApplicationJson;

        case 'application/javascript':
            return ApiMimeType.ApplicationJavascript;

        case 'application/xml': 
            return ApiMimeType.ApplicationXml;

        case 'text':
        case 'application/text':
            return ApiMimeType.Text;

        default:
            return ApiMimeType.Other;
    }
}

export enum ApiMimeType {
    ApplicationJson,
    ApplicationJavascript,
    ApplicationXml,
    Text,
    Other,
}