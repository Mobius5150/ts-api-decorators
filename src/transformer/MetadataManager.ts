import * as ts from 'typescript';import { ITransformerMetadata } from "./TransformerMetadata";
import { IExtractedApiDefinition } from "./ExtractionTransformer";
import { IDecorationFunctionTransformInfoBase } from "./DecoratorTransformer";
import { IApiParamDefinition } from "../apiManagement/ApiDefinition";
import { CollectionUtil } from '../Util/CollectionUtil';

export type ApiMethodMetadataGeneratorFunc = (method: IExtractedApiDefinition, methodNode: ts.MethodDeclaration) => ITransformerMetadata[];
export type ApiMethodParamMetadataGeneratorFunc = (param: IApiParamDefinition, paramNode: ts.ParameterDeclaration, method: IExtractedApiDefinition, methodNode: ts.MethodDeclaration) => ITransformerMetadata[];

export interface IMetadataManager {
    addApiMethodMetadataGenerator(generator: ApiMethodMetadataGeneratorFunc): void;
    addApiMethodMetadataGenerator(generator: ApiMethodMetadataGeneratorFunc, decorator: IDecorationFunctionTransformInfoBase): void;
    
    removeApiMethodMetadataGenerator(generator: ApiMethodMetadataGeneratorFunc): void;
    removeApiMethodMetadataGenerator(generator: ApiMethodMetadataGeneratorFunc, decorator: IDecorationFunctionTransformInfoBase): void;

    addApiMethodParamMetadataGenerator(generator: ApiMethodParamMetadataGeneratorFunc): void;
    addApiMethodParamMetadataGenerator(generator: ApiMethodParamMetadataGeneratorFunc, decorator: IDecorationFunctionTransformInfoBase): void;

    removeApiMethodParamMetadataGenerator(generator: ApiMethodParamMetadataGeneratorFunc): void;
    removeApiMethodParamMetadataGenerator(generator: ApiMethodParamMetadataGeneratorFunc, decorator: IDecorationFunctionTransformInfoBase): void;
}

export interface IMetadataResolver {
    getApiMetadataForApiMethod(method: IExtractedApiDefinition, methodNode: ts.MethodDeclaration, decorator: IDecorationFunctionTransformInfoBase): ITransformerMetadata[];
    getApiMethodMetadataDecorators(): IDecorationFunctionTransformInfoBase[];
    getApiMetadataForApiMethodParam(param: IApiParamDefinition, paramNode: ts.ParameterDeclaration, method: IExtractedApiDefinition, methodNode: ts.MethodDeclaration, decorator: IDecorationFunctionTransformInfoBase): ITransformerMetadata[];
    getApiMethodParamMetadataDecorators(): IDecorationFunctionTransformInfoBase[];
}

export class MetadataManager implements IMetadataManager, IMetadataResolver {
    private apiMethodGenerators: Map<IDecorationFunctionTransformInfoBase, Set<ApiMethodMetadataGeneratorFunc | null>> = new Map();
    private apiMethodParamGenerators: Map<IDecorationFunctionTransformInfoBase, Set<ApiMethodParamMetadataGeneratorFunc | null>> = new Map();

    public addApiMethodMetadataGenerator(generator: ApiMethodMetadataGeneratorFunc): void;
    public addApiMethodMetadataGenerator(generator: ApiMethodMetadataGeneratorFunc, decorator: IDecorationFunctionTransformInfoBase): void;
    public addApiMethodMetadataGenerator(generator: ApiMethodMetadataGeneratorFunc, decorator?: IDecorationFunctionTransformInfoBase): void {
        CollectionUtil.addToMapSet(
            this.apiMethodGenerators, decorator || null, generator, this.isMatchingDecorator);
    }

    public getApiMethodMetadataDecorators(): IDecorationFunctionTransformInfoBase[] {
        return Array.from(this.apiMethodGenerators.keys())
            .filter(k => k !== null);
    }

    public removeApiMethodMetadataGenerator(generator: ApiMethodMetadataGeneratorFunc): void;
    public removeApiMethodMetadataGenerator(generator: ApiMethodMetadataGeneratorFunc, decorator: IDecorationFunctionTransformInfoBase): void;
    public removeApiMethodMetadataGenerator(generator: ApiMethodMetadataGeneratorFunc, decorator?: IDecorationFunctionTransformInfoBase) {
        CollectionUtil.removeFromMapSet(
            this.apiMethodGenerators, decorator || null, generator, this.isMatchingDecorator);
    }

    public addApiMethodParamMetadataGenerator(generator: ApiMethodParamMetadataGeneratorFunc): void;
    public addApiMethodParamMetadataGenerator(generator: ApiMethodParamMetadataGeneratorFunc, decorator: IDecorationFunctionTransformInfoBase): void;
    public addApiMethodParamMetadataGenerator(generator: ApiMethodParamMetadataGeneratorFunc, decorator?: IDecorationFunctionTransformInfoBase) {
        CollectionUtil.addToMapSet(
            this.apiMethodParamGenerators, decorator || null, generator, this.isMatchingDecorator);
    }

    public removeApiMethodParamMetadataGenerator(generator: ApiMethodParamMetadataGeneratorFunc): void;
    public removeApiMethodParamMetadataGenerator(generator: ApiMethodParamMetadataGeneratorFunc, decorator: IDecorationFunctionTransformInfoBase): void;
    public removeApiMethodParamMetadataGenerator(generator: any, decorator?: any) {
        CollectionUtil.removeFromMapSet(
            this.apiMethodParamGenerators, decorator || null, generator, this.isMatchingDecorator);
    }

    public getApiMethodParamMetadataDecorators(): IDecorationFunctionTransformInfoBase[] {
        return Array.from(this.apiMethodParamGenerators.keys())
            .filter(k => k !== null);
    }

    public getApiMetadataForApiMethod(method: IExtractedApiDefinition, methodNode: ts.MethodDeclaration, decorator: IDecorationFunctionTransformInfoBase | null): ITransformerMetadata[] {
        const set = CollectionUtil.getSet(this.apiMethodGenerators, decorator, this.isMatchingDecorator);
        if (!set) {
            return [];
        }
        return Array.from(set)
            .reduce((prev: ITransformerMetadata[], func) => {
                const result = func(method, methodNode);
                if (!Array.isArray(result)) {
                    throw new Error(`ApiMethodMetadataGeneratorFunc return value must be an array`);
                }

                return prev.concat(result);
            }, []);
    }

    public getApiMetadataForApiMethodParam(param: IApiParamDefinition, paramNode: ts.ParameterDeclaration, method: IExtractedApiDefinition, methodNode: ts.MethodDeclaration, decorator: IDecorationFunctionTransformInfoBase | null): ITransformerMetadata[] {
        const set = CollectionUtil.getSet(this.apiMethodParamGenerators, decorator, this.isMatchingDecorator);
        if (!set) {
            return [];
        }
        return Array.from(set)
            .reduce((prev: ITransformerMetadata[], func) => {
                const result = func(param, paramNode, method, methodNode);
                if (!Array.isArray(result)) {
                    throw new Error(`ApiMethodParamMetadataGeneratorFunc return value must be an array`);
                }

                return prev.concat(result);
            }, []);
    }

    private isMatchingDecorator(a: IDecorationFunctionTransformInfoBase | null, b: IDecorationFunctionTransformInfoBase | null) {
        if (a === b) {
            return true;
        } else if (a === null || b === null) {
            return false;
        }

        return a.magicFunctionName === b.magicFunctionName && a.indexTs === b.indexTs;
    }
}