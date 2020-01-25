import { IClassDecoratorDefinition } from './DecoratorDefinition';
import { HandlerTreeNodeType } from './HandlerTree';
import { ClassDecorator } from './ClassDecorator';

export class DependencyClassDecorator extends ClassDecorator {
	public constructor(definition: Omit<IClassDecoratorDefinition, 'decoratorType'>) {
		super({
			...definition,
		}, HandlerTreeNodeType.Dependency);
	}
}
