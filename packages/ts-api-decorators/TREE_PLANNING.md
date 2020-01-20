# Transformer Tree Planning
TODO: Remove this section from final docs

```typescript


```

## Example Trees

### Azure Multiple Output Sample
```yaml
Api:
	constructor: MyApi
	dependencies: []
	handlers:
		copyBlob:
			type: azfunc.queue
			method: queue
			route: '8fba2580-fbff-42f8-8663-119e942c4719'
			parameters:
				inputBlobName:
					type: <IInternalTypeDefinition<string>>
					...
				inputBlob:
					type: <IInternalTypeDefinition<TbdAzureBlobType>>
					...
			modifiers:
				- <IApiModifier: AzureApiBlobOutput>
				- <IApiModifier: AzureApiQueueOutput>
				- <IApiModifier: AzureApiEventGridEventOutput>
			returnType: <IInternalTypeDefinition<MyComplexReturnType>>
```