import { ApiMethod } from "../apiManagement";

export const enum IMetadataType {
    OpenApi = 'OpenApi',
    Builtin = 'Builtin',
    Plugin = 'Plugin',
}

export interface ITransformerMetadataCollection {
    metadata: ITransformerMetadata[];
}

export interface IMetadataDescriptor {
    type: IMetadataType;
    component?: string;
    key?: string;
}

export interface ITransformerMetadata extends IMetadataDescriptor {
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

export function getMetadataByDescriptor(metadata: ITransformerMetadata[], descriptor: IMetadataDescriptor): ITransformerMetadata | undefined {
    return metadata.find(metadataSelector(descriptor.type, descriptor.component, descriptor.key));
}

export function getMetadataValueByDescriptor<V = ITransformerMetadata['value']>(metadata: ITransformerMetadata[], descriptor: IMetadataDescriptor): V | undefined {
    const found = getMetadata(metadata, descriptor.type, descriptor.component, descriptor.key);
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

export abstract class BuiltinMetadata {
    public static readonly BuiltinComponent = 'ts-api-decorators';
    
    public static readonly ApiMethod: IMetadataDescriptor = {
        type: IMetadataType.Builtin,
        component: BuiltinMetadata.BuiltinComponent,
        key: 'apiMethod',
    }

    public static ApiMethodWithValue(value: ApiMethod): ITransformerMetadata {
        return {
            ...BuiltinMetadata.ApiMethod,
            value,
        };
    }

    public static readonly ApiMethodType: IMetadataDescriptor = {
        type: IMetadataType.Builtin,
        component: BuiltinMetadata.BuiltinComponent,
        key: 'apiMethodType',
    }

    public static readonly ApiMethodTypeHttp: ITransformerMetadata = {
        ...BuiltinMetadata.ApiMethodType,
        value: 'http',
    }

    public static readonly Name: IMetadataDescriptor = {
        type: IMetadataType.Builtin,
        component: BuiltinMetadata.BuiltinComponent,
        key: 'name',
    }

    public static readonly FunctionArgumentName: IMetadataDescriptor = {
        type: IMetadataType.Builtin,
        component: BuiltinMetadata.BuiltinComponent,
        key: 'functionargname',
    }

	public static readonly SchemaRefOverride: IMetadataDescriptor = {
        type: IMetadataType.Builtin,
        component: BuiltinMetadata.BuiltinComponent,
        key: 'schemarefoverride',
    }

    public static readonly MimeType: IMetadataDescriptor = {
        type: IMetadataType.Builtin,
        component: BuiltinMetadata.BuiltinComponent,
        key: 'mimeType',
    }

    public static readonly Route: IMetadataDescriptor = {
        type: IMetadataType.Builtin,
        component: BuiltinMetadata.BuiltinComponent,
        key: 'route',
    }

    public static readonly ResponseCodes: IMetadataDescriptor = {
        type: IMetadataType.Builtin,
        component: BuiltinMetadata.BuiltinComponent,
        key: 'responseCodes',
    }

    public static readonly ApiProcessorStage: IMetadataDescriptor = {
        type: IMetadataType.Builtin,
        component: BuiltinMetadata.BuiltinComponent,
        key: 'apiprocessorstage',
    }

    public static readonly ApiProcessorScope: IMetadataDescriptor = {
        type: IMetadataType.Builtin,
        component: BuiltinMetadata.BuiltinComponent,
        key: 'apiprocessorscope',
    }

    public static readonly DependencyScope: IMetadataDescriptor = {
        type: IMetadataType.Builtin,
        component: BuiltinMetadata.BuiltinComponent,
        key: 'dependencyScope',
    }

    public static readonly NumberMin: IMetadataDescriptor = {
        type: IMetadataType.Builtin,
        component: BuiltinMetadata.BuiltinComponent,
        key: 'numberMin',
    }

    public static readonly NumberMax: IMetadataDescriptor = {
        type: IMetadataType.Builtin,
        component: BuiltinMetadata.BuiltinComponent,
        key: 'numberMax',
    }

    public static readonly UndefinedIfOmitted: IMetadataDescriptor = {
        type: IMetadataType.Builtin,
        component: BuiltinMetadata.BuiltinComponent,
        key: 'undefinedIfOmitted',
    }

    public static readonly ValidationRegExp: IMetadataDescriptor = {
        type: IMetadataType.Builtin,
        component: BuiltinMetadata.BuiltinComponent,
        key: 'regexp',
    }

    public static readonly ReturnSchema: IMetadataDescriptor = {
        type: IMetadataType.Builtin,
        component: BuiltinMetadata.BuiltinComponent,
        key: 'returnSchema',
    }

    public static readonly GetSchemaReturnSchema: ITransformerMetadata = {
        type: IMetadataType.Builtin,
        component: BuiltinMetadata.BuiltinComponent,
        key: 'returnSchema',
		value: {
			type: 'object',
			schema: {
				"$schema": "http://json-schema.org/draft-07/schema#",
			},
		}
    }

	public static readonly DecoratorTypeArgType: IMetadataDescriptor = {
		type: IMetadataType.Builtin,
		component: BuiltinMetadata.BuiltinComponent,
		key: 'decoratorTypeArgType',
	}

    public static readonly ValidationFunction: IMetadataDescriptor = {
        type: IMetadataType.Builtin,
        component: BuiltinMetadata.BuiltinComponent,
        key: 'validationFunc',
    }

    public static readonly Typedef: IMetadataDescriptor = {
        type: IMetadataType.Builtin,
        component: BuiltinMetadata.BuiltinComponent,
        key: 'typedef',
    }

    public static readonly Typeref: IMetadataDescriptor = {
        type: IMetadataType.Builtin,
        component: BuiltinMetadata.BuiltinComponent,
        key: 'typeref',
    }

    public static readonly Optional: IMetadataDescriptor = {
        type: IMetadataType.Builtin,
        component: BuiltinMetadata.BuiltinComponent,
        key: 'optional',
    }

    public static readonly Initializer: IMetadataDescriptor = {
        type: IMetadataType.Builtin,
        component: BuiltinMetadata.BuiltinComponent,
        key: 'initializer',
    }

    public static readonly Description: IMetadataDescriptor = {
        type: IMetadataType.Builtin,
        component: BuiltinMetadata.BuiltinComponent,
        key: 'description',
    }

    public static readonly ParameterIndex: IMetadataDescriptor = {
        type: IMetadataType.Builtin,
        component: BuiltinMetadata.BuiltinComponent,
        key: 'parameterIndex',
    }

    public static readonly PropertyKey: IMetadataDescriptor = {
        type: IMetadataType.Builtin,
        component: BuiltinMetadata.BuiltinComponent,
        key: 'propertyKey',
    }

    public static readonly FormDataFieldName: IMetadataDescriptor = {
        type: IMetadataType.Builtin,
        component: BuiltinMetadata.BuiltinComponent,
        key: 'formDataFieldName',
    }

    public static readonly SchemaFormat: IMetadataDescriptor = {
        type: IMetadataType.Builtin,
        component: BuiltinMetadata.BuiltinComponent,
        key: 'schemaFormat',
    }
}