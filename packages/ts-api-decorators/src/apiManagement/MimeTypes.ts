import { HttpUnsupportedMediaTypeError, HttpVersionNotSupportedError } from "../GeneratedErrors";

export interface ParsedContentTypeHeader {
    mimeType: ApiMimeType,
    charset: BufferEncoding,
    boundary?: string,
}

export function parseApiMimeType(contentTypeHeader: string | undefined, defaultCharset: BufferEncoding = 'latin1'): ParsedContentTypeHeader {
    const parts = contentTypeHeader ? contentTypeHeader.toLowerCase().split(';') : [];
    const header: ParsedContentTypeHeader = {
        mimeType: <ApiMimeType>parts[0] || ApiMimeType.ApplicationOctetStream,
        charset: defaultCharset,
    };

    // Parse mime type
    switch (parts[0]) {
        case 'application/json':
            header.mimeType = ApiMimeType.ApplicationJson;
            break;

        case 'application/javascript':
            header.mimeType = ApiMimeType.ApplicationJavascript;
            break;

        case 'application/xml': 
            header.mimeType = ApiMimeType.ApplicationXml;
            break;

        case 'application/octet-stream':
            header.mimeType = ApiMimeType.ApplicationOctetStream;
            break;

        case 'text':
        case 'text/plain':
        case 'application/text':
            header.mimeType = ApiMimeType.Text;
            break;
    }

    // parse args
    for (let i = 1; i < parts.length; ++i) {
        const [argType, arg] = parts[i].split('=', 2);
        switch (argType.trim()) {
            case 'charset':
                header.charset = normalizeCharset(arg);
                break;

            case 'boundary':
                header.boundary = arg;
                break;
        }
    }

    return header;
}

function normalizeCharset(charset: string): BufferEncoding {
    charset = charset.toLowerCase().trim();
    switch (charset) {
        case 'utf-8':
        case 'utf8':
            return 'utf8';

        case 'utf16le':
        case 'utf-16le':
            return 'utf16le';

        case 'latin1':
        case 'latin-1':
        case 'iso-8859-1':
            return 'latin1';

        case 'ucs-2':
        case 'ucs2':
            return 'ucs2';

        case 'ascii':
        case 'base64':
        case 'bindary':
        case 'hex':
            return <BufferEncoding>charset;
    }

    throw new HttpUnsupportedMediaTypeError('Charset not supported');
}

export enum ApiMimeType {
    ApplicationJson = 'application/json',
    ApplicationJavascript = 'application/javascript',
    ApplicationXml = 'application/xml',
    ApplicationOctetStream = 'application/octet-stream',
    Text = 'text/plain',
    TextXml = 'text/xml',
    MultipartFormData = 'multipart/form-data',
}