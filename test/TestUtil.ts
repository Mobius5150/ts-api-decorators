import ts from 'typescript';
import transformer from '../src/transformer';
import { TransformerType } from '../src/Util/CompilationUtil';

export * from '../src/Util/CompilationUtil';

export function getTransformer(): (p: ts.Program) => TransformerType {
	return transformer;	
}