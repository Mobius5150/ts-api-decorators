import * as ts from 'typescript';import { ITransformerMetadata } from "./TransformerMetadata";
import { IDecorationFunctionTransformInfoBase } from './DecoratorDefinition';
import { IApiParamDefinition } from "../apiManagement/ApiDefinition";
import { CollectionUtil } from '../Util/CollectionUtil';
import { IHandlerTreeNodeHandler, IHandlerTreeNodeParameter, IHandlerTreeNodeHandlerCollection } from './HandlerTree';

export type ApiMethodMetadataGeneratorFunc = (method: IHandlerTreeNodeHandler, methodNode: ts.MethodDeclaration) => ITransformerMetadata[];
export type ApiMethodCollectionMetadataGeneratorFunc = (method: IHandlerTreeNodeHandlerCollection, collectionNode: ts.ClassDeclaration) => ITransformerMetadata[];
export type ApiMethodParamMetadataGeneratorFunc = (param: IHandlerTreeNodeParameter, paramNode: ts.ParameterDeclaration) => ITransformerMetadata[];

export interface IMetadataManager {
    addApiMethodCollectionMetadataGenerator(generator: ApiMethodCollectionMetadataGeneratorFunc): void;
    addApiMethodCollectionMetadataGenerator(generator: ApiMethodCollectionMetadataGeneratorFunc, decorator: IDecorationFunctionTransformInfoBase): void;
    
    removeApiMethodCollectionMetadataGenerator(generator: ApiMethodCollectionMetadataGeneratorFunc): void;
    removeApiMethodCollectionMetadataGenerator(generator: ApiMethodCollectionMetadataGeneratorFunc, decorator: IDecorationFunctionTransformInfoBase): void;

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
    getApiMetadataForApiMethodCollection(collection: IHandlerTreeNodeHandlerCollection, collectionNode: ts.ClassDeclaration, decorator: IDecorationFunctionTransformInfoBase): ITransformerMetadata[];
    getApiMethodCollectionMetadataDecorators(): IDecorationFunctionTransformInfoBase[];
    getApiMetadataForApiMethod(method: IHandlerTreeNodeHandler, methodNode: ts.MethodDeclaration, decorator: IDecorationFunctionTransformInfoBase): ITransformerMetadata[];
    getApiMethodMetadataDecorators(): IDecorationFunctionTransformInfoBase[];
    getApiMetadataForApiMethodParam(param: IHandlerTreeNodeParameter, paramNode: ts.ParameterDeclaration, decorator: IDecorationFunctionTransformInfoBase): ITransformerMetadata[];
    getApiMethodParamMetadataDecorators(): IDecorationFunctionTransformInfoBase[];
}

export class MetadataManager implements IMetadataManager, IMetadataResolver {
    private apiMethodGenerators: Map<IDecorationFunctionTransformInfoBase, Set<ApiMethodMetadataGeneratorFunc | null>> = new Map();
    private apiMethodCollectionGenerators: Map<IDecorationFunctionTransformInfoBase, Set<ApiMethodCollectionMetadataGeneratorFunc | null>> = new Map();
    private apiMethodParamGenerators: Map<IDecorationFunctionTransformInfoBase, Set<ApiMethodParamMetadataGeneratorFunc | null>> = new Map();

    public addApiMethodCollectionMetadataGenerator(generator: ApiMethodCollectionMetadataGeneratorFunc): void;
    public addApiMethodCollectionMetadataGenerator(generator: ApiMethodCollectionMetadataGeneratorFunc, decorator: IDecorationFunctionTransformInfoBase): void;
    public addApiMethodCollectionMetadataGenerator(generator: ApiMethodCollectionMetadataGeneratorFunc, decorator?: IDecorationFunctionTransformInfoBase): void {
        CollectionUtil.addToMapSet(
            this.apiMethodCollectionGenerators, decorator || null, generator, this.isMatchingDecoratorExact);
    }

    public getApiMethodCollectionMetadataDecorators(): IDecorationFunctionTransformInfoBase[] {
        return Array.from(this.apiMethodCollectionGenerators.keys())
            .filter(k => k !== null);
    }

    public removeApiMethodCollectionMetadataGenerator(generator: ApiMethodCollectionMetadataGeneratorFunc): void;
    public removeApiMethodCollectionMetadataGenerator(generator: ApiMethodCollectionMetadataGeneratorFunc, decorator: IDecorationFunctionTransformInfoBase): void;
    public removeApiMethodCollectionMetadataGenerator(generator: ApiMethodCollectionMetadataGeneratorFunc, decorator?: IDecorationFunctionTransformInfoBase) {
        CollectionUtil.removeFromMapSet(
            this.apiMethodCollectionGenerators, decorator || null, generator, this.isMatchingDecoratorExact);
    }

    public addApiMethodMetadataGenerator(generator: ApiMethodMetadataGeneratorFunc): void;
    public addApiMethodMetadataGenerator(generator: ApiMethodMetadataGeneratorFunc, decorator: IDecorationFunctionTransformInfoBase): void;
    public addApiMethodMetadataGenerator(generator: ApiMethodMetadataGeneratorFunc, decorator?: IDecorationFunctionTransformInfoBase): void {
        CollectionUtil.addToMapSet(
            this.apiMethodGenerators, decorator || null, generator, this.isMatchingDecoratorExact);
    }

    public getApiMethodMetadataDecorators(): IDecorationFunctionTransformInfoBase[] {
        return Array.from(this.apiMethodGenerators.keys())
            .filter(k => k !== null);
    }

    public removeApiMethodMetadataGenerator(generator: ApiMethodMetadataGeneratorFunc): void;
    public removeApiMethodMetadataGenerator(generator: ApiMethodMetadataGeneratorFunc, decorator: IDecorationFunctionTransformInfoBase): void;
    public removeApiMethodMetadataGenerator(generator: ApiMethodMetadataGeneratorFunc, decorator?: IDecorationFunctionTransformInfoBase) {
        CollectionUtil.removeFromMapSet(
            this.apiMethodGenerators, decorator || null, generator, this.isMatchingDecoratorExact);
    }

    public addApiMethodParamMetadataGenerator(generator: ApiMethodParamMetadataGeneratorFunc): void;
    public addApiMethodParamMetadataGenerator(generator: ApiMethodParamMetadataGeneratorFunc, decorator: IDecorationFunctionTransformInfoBase): void;
    public addApiMethodParamMetadataGenerator(generator: ApiMethodParamMetadataGeneratorFunc, decorator?: IDecorationFunctionTransformInfoBase) {
        CollectionUtil.addToMapSet(
            this.apiMethodParamGenerators, decorator || null, generator, this.isMatchingDecoratorExact);
    }

    public removeApiMethodParamMetadataGenerator(generator: ApiMethodParamMetadataGeneratorFunc): void;
    public removeApiMethodParamMetadataGenerator(generator: ApiMethodParamMetadataGeneratorFunc, decorator: IDecorationFunctionTransformInfoBase): void;
    public removeApiMethodParamMetadataGenerator(generator: any, decorator?: any) {
        CollectionUtil.removeFromMapSet(
            this.apiMethodParamGenerators, decorator || null, generator, this.isMatchingDecoratorExact);
    }

    public getApiMethodParamMetadataDecorators(): IDecorationFunctionTransformInfoBase[] {
        return Array.from(this.apiMethodParamGenerators.keys())
            .filter(k => k !== null);
    }

    public getApiMetadataForApiMethodCollection(collection: IHandlerTreeNodeHandlerCollection, collectionNode: ts.ClassDeclaration, decorator: IDecorationFunctionTransformInfoBase): ITransformerMetadata[] {
        const set = CollectionUtil.iterateSet(this.apiMethodCollectionGenerators, decorator, this.isMatchingDecoratorFuzzy);
        if (!set) {
            return [];
        }
        return Array.from(new Set(set))
            .reduce((prev: ITransformerMetadata[], func) => {
                const result = func(collection, collectionNode);
                if (!Array.isArray(result)) {
                    throw new Error(`ApiMethodCollectionMetadataGeneratorFunc return value must be an array`);
                }

                return prev.concat(result);
            }, []);
    }


    public getApiMetadataForApiMethod(method: IHandlerTreeNodeHandler, methodNode: ts.MethodDeclaration, decorator: IDecorationFunctionTransformInfoBase | null): ITransformerMetadata[] {
        const set = CollectionUtil.iterateSet(this.apiMethodGenerators, decorator, this.isMatchingDecoratorFuzzy);
        if (!set) {
            return [];
        }
        return Array.from(new Set(set))
            .reduce((prev: ITransformerMetadata[], func) => {
                const result = func(method, methodNode);
                if (!Array.isArray(result)) {
                    throw new Error(`ApiMethodMetadataGeneratorFunc return value must be an array`);
                }

                return prev.concat(result);
            }, []);
    }

    public getApiMetadataForApiMethodParam(param: IHandlerTreeNodeParameter, paramNode: ts.ParameterDeclaration, decorator: IDecorationFunctionTransformInfoBase | null): ITransformerMetadata[] {
        const set = CollectionUtil.iterateSet(this.apiMethodParamGenerators, decorator, this.isMatchingDecoratorFuzzy);
        if (!set) {
            return [];
        }
        return Array.from(new Set(set))
            .reduce((prev: ITransformerMetadata[], func) => {
                const result = func(param, paramNode);
                if (!Array.isArray(result)) {
                    throw new Error(`ApiMethodParamMetadataGeneratorFunc return value must be an array`);
                }

                return prev.concat(result);
            }, []);
    }

    private isMatchingDecoratorFuzzy(a: IDecorationFunctionTransformInfoBase | null, b: IDecorationFunctionTransformInfoBase | null) {
        if (a === b) {
            return true;
        } else if (a === null || b === null) {
            return true;
        }

        return a.magicFunctionName === b.magicFunctionName && a.indexTs === b.indexTs && a.provider === b.provider;
    }

    private isMatchingDecoratorExact(a: IDecorationFunctionTransformInfoBase | null, b: IDecorationFunctionTransformInfoBase | null) {
        if (a === b) {
            return true;
        } else if (a === null || b === null) {
            return false;
        }

        return a.magicFunctionName === b.magicFunctionName && a.indexTs === b.indexTs && a.provider === b.provider;
    }
}