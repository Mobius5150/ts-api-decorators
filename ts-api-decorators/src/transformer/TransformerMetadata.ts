export const enum IMetadataType {
    OpenApi = 'OpenApi',
    Plugin = 'Plugin',
}

export interface ITransformerMetadataCollection {
    metadata: ITransformerMetadata[];
}

export interface ITransformerMetadata {
    type: IMetadataType;
    component?: string;
    key?: string;
    value: any;
}

export function getMetadata(metadata: ITransformerMetadata[], type: IMetadataType, component?: string, key?: string): ITransformerMetadata | undefined {
    return metadata.find(metadataSelector(type, component, key));
}

export function getMetadataValue<V = ITransformerMetadata['value']>(metadata: ITransformerMetadata[], type: IMetadataType, component?: string, key?: string): V | undefined {
    const found = getMetadata(metadata, type, component, key);
    if (found) {
        return <V>found.value;
    }

    return undefined;
}

export function getAllMetadata(metadata: ITransformerMetadata[], type: IMetadataType, component?: string, key?: string): ITransformerMetadata[] {
    return metadata.filter(metadataSelector(type, component, key));
}

export function getAllMetadataValues<V = ITransformerMetadata['value']>(metadata: ITransformerMetadata[], type: IMetadataType, component?: string, key?: string): V[] {
    return getAllMetadata(metadata, type, component, key).map(m => <V>m.value);
}

function metadataSelector(type: IMetadataType, component: string, key: string): (value: ITransformerMetadata, index: number, obj: ITransformerMetadata[]) => boolean {
    return m => {
        if (m.type !== type) {
            return false;
        }
        if (component && m.component !== component) {
            return false;
        }
        if (key && m.key !== key) {
            return false;
        }
        return true;
    };
}
