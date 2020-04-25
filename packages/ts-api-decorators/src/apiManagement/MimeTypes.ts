export function parseApiMimeType(contentTypeHeader: string): ApiMimeType {
    switch (contentTypeHeader.toLowerCase()) {
        case 'application/json':
            return ApiMimeType.ApplicationJson;

        case 'application/javascript':
            return ApiMimeType.ApplicationJavascript;

        case 'application/xml': 
            return ApiMimeType.ApplicationXml;

        case 'text':
        case 'text/plain':
        case 'application/text':
            return ApiMimeType.Text;

        default:
            return ApiMimeType.ApplicationOctetStream;
    }
}

export enum ApiMimeType {
    ApplicationJson = 'application/json',
    ApplicationJavascript = 'application/javascript',
    ApplicationXml = 'application/xml',
    ApplicationOctetStream = 'application/octet-stream',
    Text = 'text/plain',
    TextXml = 'text/xml',
}